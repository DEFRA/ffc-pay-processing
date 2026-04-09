const db = require('../data')
const { zeroValueSplit } = require('../processing/delta/zero-value-split')
const { sendZeroValueEvent } = require('../event')
const { sanitizeInvoiceLine } = require('../helpers/sanitize-invoice-line')

const handleScheduleUpdate = async (schedule, transaction) => {
  if (schedule.completed !== null) {
    return false
  }
  await db.schedule.update(
    { completed: new Date() },
    {
      where: { scheduleId: schedule.scheduleId },
      transaction
    }
  )
  return true
}

const processInvoiceLines = async (
  invoiceLines,
  completedPaymentRequestId,
  transaction
) => {
  for (const line of invoiceLines) {
    const completedLine = line.dataValues ?? line
    if (completedLine.value !== 0) {
      completedLine.completedPaymentRequestId = completedPaymentRequestId
      sanitizeInvoiceLine(completedLine)
      await db.completedInvoiceLine.create(completedLine, { transaction })
    }
  }
}

const checkSingleRequestOffsets = paymentRequest => {
  const lines = paymentRequest.invoiceLines
  const totalPos = lines.reduce(
    (sum, line) => (line.value > 0 ? sum + line.value : sum),
    0
  )
  const totalNeg = lines.reduce(
    (sum, line) => (line.value < 0 ? sum + line.value : sum),
    0
  )
  const hasLineOffsets = totalPos + totalNeg === 0 && totalPos !== 0

  console.log('Single request line offsets:', {
    hasLineOffsets,
    totalPos,
    totalNeg,
    invoiceNumber: paymentRequest.invoiceNumber
  })

  return hasLineOffsets
}

const checkMultipleRequestOffsets = paymentRequests => {
  const hasOffsets =
    paymentRequests.length === 2 &&
    paymentRequests[0].value + paymentRequests[1].value === 0 &&
    (paymentRequests[0].value !== 0 || paymentRequests[1].value !== 0)

  console.log('Multiple request offsets:', {
    hasOffsets,
    requests: paymentRequests.map(x => ({
      value: x.value,
      invoiceNumber: x.invoiceNumber,
      lines: x.invoiceLines.map(l => l.value)
    }))
  })

  return hasOffsets
}

const hasOffsettingValues = paymentRequests => {
  return paymentRequests.length === 1
    ? checkSingleRequestOffsets(paymentRequests[0])
    : checkMultipleRequestOffsets(paymentRequests)
}

const processSingleRequest = async (paymentRequest, transaction) => {
  const isFirstPayment =
    !paymentRequest.paymentRequestNumber ||
    paymentRequest.paymentRequestNumber === 1
  const splitRequests = zeroValueSplit(paymentRequest, isFirstPayment)

  console.log('Split payment requests:', {
    original: paymentRequest.invoiceNumber,
    split: splitRequests.map(x => x.invoiceNumber),
    isFirstPayment
  })

  for (const request of splitRequests) {
    const savedRequest = await db.completedPaymentRequest.create(
      request.dataValues ?? request,
      { transaction }
    )
    await processInvoiceLines(
      request.invoiceLines,
      savedRequest.completedPaymentRequestId,
      transaction
    )
    await createOutboxEntry(request, savedRequest, isFirstPayment, transaction)
  }
}

const createOutboxEntry = async (
  paymentRequest,
  savedRequest,
  isFirstPayment,
  transaction
) => {
  const isSplitPayment =
    paymentRequest.originalInvoiceNumber ||
    paymentRequest.invoiceNumber?.endsWith('A') ||
    paymentRequest.invoiceNumber?.endsWith('B')

  const hasNonZeroLines = paymentRequest.invoiceLines.some(x => x.value !== 0)
  const shouldCreateOutbox =
    hasNonZeroLines || (isSplitPayment && isFirstPayment)

  console.log('Outbox creation decision:', {
    invoiceNumber: paymentRequest.invoiceNumber,
    shouldCreateOutbox,
    isSplitPayment,
    isFirstPayment,
    hasNonZeroLines,
    lineValues: paymentRequest.invoiceLines.map(x => x.value)
  })

  if (!shouldCreateOutbox) {
    await sendZeroValueEvent(paymentRequest)
    return
  }

  await db.outbox.create(
    {
      completedPaymentRequestId: savedRequest.completedPaymentRequestId
    },
    { transaction }
  )
  console.log('Created outbox entry:', paymentRequest.invoiceNumber)
}

const processMultipleRequests = async (paymentRequests, transaction) => {
  const hasOffset = hasOffsettingValues(paymentRequests)
  for (const request of paymentRequests) {
    const savedRequest = await db.completedPaymentRequest.create(
      request.dataValues ?? request,
      { transaction }
    )
    await processInvoiceLines(
      request.invoiceLines,
      savedRequest.completedPaymentRequestId,
      transaction
    )
    await createOutboxEntry(request, savedRequest, hasOffset, transaction)
  }
}

const completePaymentRequests = async (scheduleId, paymentRequests) => {
  const transaction = await db.sequelize.transaction()

  try {
    const schedule = await db.schedule.findByPk(scheduleId, { transaction })
    const shouldProcess = await handleScheduleUpdate(schedule, transaction)

    if (shouldProcess) {
      if (
        paymentRequests.length === 1 &&
        hasOffsettingValues(paymentRequests)
      ) {
        await processSingleRequest(paymentRequests[0], transaction)
      } else {
        await processMultipleRequests(paymentRequests, transaction)
      }
    }

    await transaction.commit()
  } catch (error) {
    await transaction.rollback()
    throw error
  }
}

module.exports = {
  completePaymentRequests
}
