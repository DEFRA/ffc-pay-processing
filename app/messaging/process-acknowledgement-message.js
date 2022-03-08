const updateAcknowledgement = require('../acknowledgement')
const util = require('util')

const processAcknowledgementMessage = async (message, receiver) => {
  try {
    console.log('Acknowledgement received:', util.inspect(message.body, false, null, true))
    await updateAcknowledgement(message.body)
    await receiver.completeMessage(message)
    console.log('Acknowledgement processed')
  } catch (err) {
    console.error('Unable to process acknowledgement request:', err)
  }
}

module.exports = processAcknowledgementMessage
