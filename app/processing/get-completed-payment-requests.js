const db = require('../database')
const { getCompletedPaymentRequestsFilter } = require('./get-completed-payment-requests-filter')

const getCompletedPaymentRequests = async (paymentRequest) => {
  const filter = getCompletedPaymentRequestsFilter(paymentRequest)

  const completedPaymentRequests = await db.completedPaymentRequest()
    .modify(filter)
    .orderBy('paymentRequestNumber', 'asc')

  const invoiceLines = await db.completedInvoiceLine()
    .whereIn('completedPaymentRequestId', completedPaymentRequests.map(x => x.completedPaymentRequestId))
    .orderBy('completedInvoiceLineId', 'asc')

  return completedPaymentRequests.map(x => ({
    ...x,
    invoiceLines: invoiceLines.filter(line => line.completedPaymentRequestId === x.completedPaymentRequestId)
  }))
}

module.exports = {
  getCompletedPaymentRequests
}
