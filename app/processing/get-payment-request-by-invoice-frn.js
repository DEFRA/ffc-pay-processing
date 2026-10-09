const db = require('../database')

const getPaymentRequestByInvoiceAndFrn = async (invoiceNumber, frn) => {
  const paymentRequest = await db.completedPaymentRequest().where({ invoiceNumber, frn }).first()
  if (!paymentRequest) {
    return undefined
  }
  paymentRequest.invoiceLines = await db.completedInvoiceLine()
    .where({ completedPaymentRequestId: paymentRequest.completedPaymentRequestId })
    .orderBy('completedInvoiceLineId', 'asc')
  return paymentRequest
}

module.exports = {
  getPaymentRequestByInvoiceAndFrn
}
