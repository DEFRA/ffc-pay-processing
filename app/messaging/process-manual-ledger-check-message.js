const { updateRequestsAwaitingManualLedgerCheck } = require('../routing')
const { sendProcessingErrorEvent } = require('../event')

const processManualLedgerCheckMessage = async (message, receiver) => {
  try {
    const paymentRequest = message.body
    const originalPaymentRequest = paymentRequest.paymentRequest
    console.log('Payment request passing manual ledger check received:', {
      frn: originalPaymentRequest.frn,
      ...(originalPaymentRequest.sbi != null && { sbi: originalPaymentRequest.sbi }),
      invoiceNumber: originalPaymentRequest.invoiceNumber
    })
    await updateRequestsAwaitingManualLedgerCheck(paymentRequest)
    await receiver.completeMessage(message)
    console.log('Processed manual ledger update', {
      frn: originalPaymentRequest.frn,
      ...(originalPaymentRequest.sbi != null && { sbi: originalPaymentRequest.sbi }),
      invoiceNumber: originalPaymentRequest.invoiceNumber
    })
  } catch (err) {
    console.error('Unable to process manual ledger message:', err)
    await sendProcessingErrorEvent(message.body, err)
    await receiver.deadLetterMessage(message)
  }
}

module.exports = {
  processManualLedgerCheckMessage
}
