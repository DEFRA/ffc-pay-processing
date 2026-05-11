const { updateRequestsAwaitingManualLedgerCheck } = require('../routing')
const { sendProcessingErrorEvent } = require('../event')

const processManualLedgerCheckMessage = async (message, receiver) => {
  try {
    const paymentRequest = message.body
    console.log('Payment request passing manual ledger check received:', { frn: paymentRequest.frn, sbi: paymentRequest.sbi, invoiceNumber: paymentRequest.invoiceNumber })
    await updateRequestsAwaitingManualLedgerCheck(paymentRequest)
    await receiver.completeMessage(message)
    console.log('Processed manual ledger update', { frn: paymentRequest.frn, sbi: paymentRequest.sbi, invoiceNumber: paymentRequest.invoiceNumber })
  } catch (err) {
    console.error('Unable to process manual ledger message:', err)
    await sendProcessingErrorEvent(message.body, err)
    await receiver.deadLetterMessage(message)
  }
}

module.exports = {
  processManualLedgerCheckMessage
}
