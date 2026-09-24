const db = require('../database')
const { zeroValueSplit } = require('../processing/delta/zero-value-split')
const { sendZeroValueEvent } = require('../event')
const { sanitizeInvoiceLine } = require('../helpers/sanitize-invoice-line')

const handleScheduleUpdate = async (scheduleId, transaction) => {
  const updatedRows = await db.schedule(transaction)
    .where({ scheduleId })
    .whereNull('completed')
    .update({ completed: new Date() })

  return updatedRows === 1
}

const saveCompletedPaymentRequest = async (request, transaction) => {
  const [savedRequest] = await db.completedPaymentRequest(transaction).insert({
    paymentRequestId: request.paymentRequestId,
    schemeId: request.schemeId,
    batch: request.batch,
    ledger: request.ledger,
    sourceSystem: request.sourceSystem,
    deliveryBody: request.deliveryBody,
    invoiceNumber: request.invoiceNumber,
    frn: request.frn,
    sbi: request.sbi,
    vendor: request.vendor,
    trader: request.trader,
    marketingYear: request.marketingYear,
    agreementNumber: request.agreementNumber,
    contractNumber: request.contractNumber,
    paymentRequestNumber: request.paymentRequestNumber,
    currency: request.currency,
    schedule: request.schedule,
    dueDate: request.dueDate,
    debtType: request.debtType,
    recoveryDate: request.recoveryDate,
    originalSettlementDate: request.originalSettlementDate,
    originalInvoiceNumber: request.originalInvoiceNumber,
    invoiceCorrectionReference: request.invoiceCorrectionReference,
    value: request.value,
    submitted: request.submitted,
    acknowledged: request.acknowledged,
    lastSettlement: request.lastSettlement,
    settledValue: request.settledValue,
    // the column has no database default, so it is set here as the old model did
    invalid: request.invalid ?? false,
    referenceId: request.referenceId,
    correlationId: request.correlationId,
    paymentType: request.paymentType,
    pillar: request.pillar,
    exchangeRate: request.exchangeRate,
    eventDate: request.eventDate,
    claimDate: request.claimDate,
    fesCode: request.fesCode,
    annualValue: request.annualValue,
    remittanceDescription: request.remittanceDescription,
    providesAccountingValues: request.providesAccountingValues
  }).returning('completedPaymentRequestId')
  return savedRequest
}

const processInvoiceLines = async (
  invoiceLines,
  completedPaymentRequestId,
  transaction
) => {
  for (const line of invoiceLines) {
    if (line.value !== 0) {
      line.completedPaymentRequestId = completedPaymentRequestId
      sanitizeInvoiceLine(line)
      await db.completedInvoiceLine(transaction).insert({
        completedPaymentRequestId,
        schemeCode: line.schemeCode,
        accountCode: line.accountCode,
        fundCode: line.fundCode,
        agreementNumber: line.agreementNumber,
        description: line.description,
        value: line.value,
        convergence: line.convergence,
        deliveryBody: line.deliveryBody,
        marketingYear: line.marketingYear,
        stateAid: line.stateAid
      })
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
    const savedRequest = await saveCompletedPaymentRequest(request, transaction)
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

  await db.outbox(transaction).insert({
    completedPaymentRequestId: savedRequest.completedPaymentRequestId
  })
  console.log('Created outbox entry:', paymentRequest.invoiceNumber)
}

const processMultipleRequests = async (paymentRequests, transaction) => {
  const hasOffset = hasOffsettingValues(paymentRequests)
  for (const request of paymentRequests) {
    const savedRequest = await saveCompletedPaymentRequest(request, transaction)
    await processInvoiceLines(
      request.invoiceLines,
      savedRequest.completedPaymentRequestId,
      transaction
    )
    await createOutboxEntry(request, savedRequest, hasOffset, transaction)
  }
}

const completePaymentRequests = async (scheduleId, paymentRequests) => {
  const transaction = await db.transaction()
  console.log(`Scheduled payment request ${scheduleId} ready to be completed`)
  try {
    const shouldProcess = await handleScheduleUpdate(scheduleId, transaction)

    if (shouldProcess) {
      if (
        paymentRequests.length === 1 &&
        hasOffsettingValues(paymentRequests)
      ) {
        await processSingleRequest(paymentRequests[0], transaction)
      } else {
        await processMultipleRequests(paymentRequests, transaction)
      }
    } else {
      console.log(`Schedule ${scheduleId} has already been completed, skipping processing`)
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
