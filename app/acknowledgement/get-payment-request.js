const db = require('../database')

const getPaymentRequest = async (invoiceNumber) => {
  const paymentRequest = await db.completedPaymentRequest().where({ invoiceNumber }).first()
  if (!paymentRequest) {
    return null
  }
  paymentRequest.invoiceLines = await db.completedInvoiceLine()
    .where({ completedPaymentRequestId: paymentRequest.completedPaymentRequestId })
    .orderBy('completedInvoiceLineId', 'asc')
  return paymentRequest
}

module.exports = {
  getPaymentRequest
}
