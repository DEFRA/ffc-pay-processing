const { getSender, sendMessage: sendServiceBusMessage } = require('./service-bus')
const { messageConfig } = require('../config')
const { SOURCE } = require('../constants/source')

const sendReturnResponse = async (paymentRequest, type) => {
  const message = {
    body: paymentRequest,
    type,
    source: SOURCE,
    subject: paymentRequest.sourceSystem
  }
  const sender = getSender(messageConfig.returnResponseTopic)
  await sendServiceBusMessage(sender, message)
}

module.exports = {
  sendReturnResponse
}
