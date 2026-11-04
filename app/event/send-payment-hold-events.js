const { EventPublisher } = require('ffc-pay-event-publisher')
const { messageConfig } = require('../config')
const { SOURCE } = require('../constants/source')
const { PAYMENT_PAUSED_HOLD } = require('../constants/events')

const sendPaymentHoldEvents = async (paymentRequests) => {
  if (!paymentRequests.length) {
    return
  }
  const events = paymentRequests.map(paymentRequest => ({
    source: SOURCE,
    type: PAYMENT_PAUSED_HOLD,
    data: paymentRequest
  }))
  const eventPublisher = new EventPublisher(messageConfig.eventsTopic)
  await eventPublisher.publishEvents(events)
}

module.exports = {
  sendPaymentHoldEvents
}
