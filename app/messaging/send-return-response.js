const { MessageSender } = require('ffc-messaging')
const { messageConfig } = require('../config')
const { SOURCE } = require('../constants/source')

const sendReturnResponse = async (paymentRequest, type) => {
  const message = {
    body: paymentRequest,
    type,
    source: SOURCE,
    subject: paymentRequest.sourceSystem
  }
  const sender = new MessageSender(messageConfig.returnResponseTopic)
  await sender.sendMessage(message)
  await sender.closeConnection()
}

module.exports = {
  sendReturnResponse
}
