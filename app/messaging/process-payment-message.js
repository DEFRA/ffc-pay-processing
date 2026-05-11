const { savePaymentRequest } = require('../inbound')
const { sendProcessingErrorEvent } = require('../event')

const processPaymentMessage = async (message, receiver) => {
  try {
    const paymentRequest = message.body
    console.log('Payment request received:', { frn: paymentRequest.frn, sbi: paymentRequest.sbi, invoiceNumber: paymentRequest.invoiceNumber })
    await savePaymentRequest(paymentRequest)
    await receiver.completeMessage(message)
  } catch (err) {
    await sendProcessingErrorEvent(message.body, err)
    console.error('Unable to process payment request:', err)
  }
}

module.exports = {
  processPaymentMessage
}
