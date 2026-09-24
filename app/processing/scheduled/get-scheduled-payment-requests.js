const db = require('../../database')
const { processingConfig } = require('../../config')
const getScheduledPaymentRequestsQuery = require('../../constants/get-scheduled-payment-requests-query')

const getScheduledPaymentRequests = async () => {
  // This is written as a raw query for performance reasons
  const transaction = await db.transaction(undefined, { isolationLevel: 'serializable' })
  try {
    const schedules = await determineSchedules(transaction)

    await transaction.commit()

    const scheduledPaymentRequests = await getPaymentRequestsForSchedules(schedules.map(x => x.scheduleId))
    return scheduledPaymentRequests
  } catch (error) {
    await transaction.rollback()
    throw error
  }
}

const determineSchedules = async (transaction) => {
  const { rows } = await transaction.raw(getScheduledPaymentRequestsQuery, {
    processingCap: processingConfig.processingCap
  })
  return rows
}

const getPaymentRequestsForSchedules = async (scheduleIds) => {
  const schedules = await db.schedule().whereIn('scheduleId', scheduleIds)
  const paymentRequestIds = schedules.map(x => x.paymentRequestId)

  const paymentRequests = await db.paymentRequest().whereIn('paymentRequestId', paymentRequestIds)
  const invoiceLines = await db.invoiceLine()
    .whereIn('paymentRequestId', paymentRequestIds)
    .where('invalid', '<>', true)
    .orderBy('invoiceLineId', 'asc')
  const schemes = await db.scheme().whereIn('schemeId', [...new Set(paymentRequests.map(x => x.schemeId))])

  return schedules
    .map(schedule => ({
      ...schedule,
      paymentRequest: buildPaymentRequest(paymentRequests.find(x => x.paymentRequestId === schedule.paymentRequestId), invoiceLines, schemes)
    }))
    .filter(x => x.paymentRequest)
}

const buildPaymentRequest = (paymentRequest, invoiceLines, schemes) => {
  const paymentRequestInvoiceLines = invoiceLines.filter(x => x.paymentRequestId === paymentRequest?.paymentRequestId)
  // invoice lines were a required include, so a payment request without a valid line is not returned
  if (!paymentRequest || paymentRequestInvoiceLines.length === 0) {
    return null
  }
  return {
    ...paymentRequest,
    invoiceLines: paymentRequestInvoiceLines,
    scheme: schemes.find(x => x.schemeId === paymentRequest.schemeId) ?? null
  }
}

module.exports = {
  getScheduledPaymentRequests
}
