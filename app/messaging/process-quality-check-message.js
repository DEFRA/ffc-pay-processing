const { VALIDATION } = require('../constants/errors')
const { updateRequestsAwaitingDebtData } = require('../routing')
const { sendProcessingErrorEvent } = require('../event')

const processQualityCheckMessage = async (message, receiver) => {
  try {
    const paymentRequest = message.body
    console.log('Payment request passing quality check received:', { frn: paymentRequest.frn, sbi: paymentRequest.sbi, invoiceNumber: paymentRequest.invoiceNumber })
    await updateRequestsAwaitingDebtData(paymentRequest)
    await receiver.completeMessage(message)
    console.log('Processed quality check update', { frn: paymentRequest.frn, sbi: paymentRequest.sbi, invoiceNumber: paymentRequest.invoiceNumber })
  } catch (err) {
    console.error('Unable to process quality check message:', err)
    await sendProcessingErrorEvent(message.body, err)
    if (err.category === VALIDATION) {
      await receiver.deadLetterMessage(message)
    }
  }
}

module.exports = {
  processQualityCheckMessage
}
