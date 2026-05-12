const { updateRequestsAwaitingCrossBorder } = require('../routing')
const { sendProcessingErrorEvent } = require('../event')

const processXbResponseMessage = async (message, receiver) => {
  try {
    const paymentRequest = message.body
    console.log('Payment request returned from Cross Border Payment Engine received:', { frn: message.body.frn, sbi: message.body.sbi, invoiceNumber: message.body.invoiceNumber })
    await updateRequestsAwaitingCrossBorder(paymentRequest)
    await receiver.completeMessage(message)
    console.log('Processed cross border update', { frn: message.body.frn, sbi: message.body.sbi, invoiceNumber: message.body.invoiceNumber })
  } catch (err) {
    console.error('Unable to process cross border message:', err)
    await sendProcessingErrorEvent(message.body, err)
  }
}

module.exports = {
  processXbResponseMessage
}
