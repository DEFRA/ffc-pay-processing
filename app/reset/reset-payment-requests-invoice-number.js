const db = require('../database')
const { sendResetEvent } = require('../event')
const { resetPaymentRequestById } = require('./reset-payment-request-id')

const resetPaymentRequestByInvoiceNumber = async (invoiceNumber, transaction) => {
  const paymentRequest = (await db.paymentRequest().where({ invoiceNumber }).first()) ?? null
  if (!paymentRequest) {
    throw new Error(`Payment request ${invoiceNumber} does not exist`)
  }
  const completedPaymentRequest = (await db.completedPaymentRequest().where({ paymentRequestId: paymentRequest.paymentRequestId, invalid: false }).first()) ?? null
  if (!completedPaymentRequest) {
    throw new Error(`Payment request ${invoiceNumber} has not completed processing so cannot be reset`)
  }
  await resetPaymentRequestById(paymentRequest.paymentRequestId, transaction)
  await sendResetEvent(completedPaymentRequest)
}

module.exports = {
  resetPaymentRequestByInvoiceNumber
}
