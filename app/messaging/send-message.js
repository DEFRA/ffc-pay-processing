const { getSender, sendMessage: sendServiceBusMessage } = require('./service-bus')
const { createMessage } = require('./create-message')

const sendMessage = async (paymentRequest, type, config) => {
  const sender = getSender(config)
  const message = createMessage(paymentRequest, type)
  await sendServiceBusMessage(sender, message)
}

module.exports = {
  sendMessage
}
