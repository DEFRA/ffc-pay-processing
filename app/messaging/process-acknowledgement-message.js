const { processAcknowledgement } = require('../acknowledgement')
const { sendProcessingErrorEvent } = require('../event')

const processAcknowledgementMessage = async (message, receiver) => {
  try {
    console.log('Acknowledgement received:', { frn: message.body.frn, sbi: message.body.sbi, invoiceNumber: message.body.invoiceNumber })
    await processAcknowledgement(message.body)
    console.log('Acknowledgement processed')
    await receiver.completeMessage(message)
  } catch (err) {
    await sendProcessingErrorEvent(message.body, err)
    console.error('Unable to process acknowledgement request:', err)
  }
}

module.exports = {
  processAcknowledgementMessage
}
