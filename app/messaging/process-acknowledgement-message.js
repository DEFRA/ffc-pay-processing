const util = require('util')
const { updateAcknowledgement } = require('../acknowledgement')
const { sendProcessingErrorEvent } = require('../event')

const processAcknowledgementMessage = async (message, receiver) => {
  try {
    console.log('Acknowledgement received:', util.inspect(message.body, false, null, true))
    await updateAcknowledgement(message.body)
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
