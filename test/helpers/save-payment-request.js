const db = require('../../app/database')
const { pickColumns } = require('./table-columns')

const savePaymentRequest = async (paymentRequest, completed = false) => {
  const [savedPaymentRequest] = await db.paymentRequest().insert(pickColumns('paymentRequest', paymentRequest)).returning('paymentRequestId')
  await db.invoiceLine().insert(paymentRequest.invoiceLines.map(invoiceLine => pickColumns('invoiceLine', { ...invoiceLine, paymentRequestId: savedPaymentRequest.paymentRequestId })))
  if (completed) {
    const [completedPaymentRequest] = await db.completedPaymentRequest().insert(pickColumns('completedPaymentRequest', { invalid: false, ...paymentRequest, paymentRequestId: savedPaymentRequest.paymentRequestId })).returning('completedPaymentRequestId')
    await db.completedInvoiceLine().insert(paymentRequest.invoiceLines.map(invoiceLine => pickColumns('completedInvoiceLine', { ...invoiceLine, completedPaymentRequestId: completedPaymentRequest.completedPaymentRequestId })))
    await db.outbox().insert({ completedPaymentRequestId: completedPaymentRequest.completedPaymentRequestId })
    return { id: savedPaymentRequest.paymentRequestId, completedId: completedPaymentRequest.completedPaymentRequestId }
  }
  return { id: savedPaymentRequest.paymentRequestId }
}

module.exports = {
  savePaymentRequest
}
