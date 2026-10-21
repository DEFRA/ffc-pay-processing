const db = require('../database')
const { removeAutoHold } = require('../auto-hold')
const { CROSS_BORDER } = require('../constants/hold-categories-names')
const { saveInvoiceLines } = require('../inbound/save-invoice-lines')
const { invalidateInvoiceLines } = require('./invalidate-invoice-lines')

const updateRequestsAwaitingCrossBorder = async (paymentRequest) => {
  const transaction = await db.transaction()
  try {
    const originalPaymentRequest = (await db.paymentRequest(transaction).where({ invoiceNumber: paymentRequest.invoiceNumber }).first()) ?? null

    if (!originalPaymentRequest) {
      throw new Error(`No payment request matching Cross Border invoice number: ${paymentRequest.invoiceNumber}`)
    }

    await db.paymentRequest(transaction)
      .where({ paymentRequestId: originalPaymentRequest.paymentRequestId })
      .update({
        deliveryBody: paymentRequest.deliveryBody,
        value: paymentRequest.value
      })

    await invalidateInvoiceLines(originalPaymentRequest.paymentRequestId, transaction)
    await saveInvoiceLines(paymentRequest.invoiceLines, originalPaymentRequest.paymentRequestId, transaction)
    await removeAutoHold(paymentRequest, CROSS_BORDER)
    await transaction.commit()
  } catch (err) {
    await transaction.rollback()
    console.log(err)
  }
}

module.exports = {
  updateRequestsAwaitingCrossBorder
}
