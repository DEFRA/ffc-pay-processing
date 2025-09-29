const { processingConfig, messageConfig } = require('../config')
const { EventPublisher } = require('ffc-pay-event-publisher')
const { SOURCE } = require('../constants/source')
const { PAYMENT_PROCESSED_NO_FURTHER_ACTION } = require('../constants/events')

const sendZeroValueEvent = async (paymentRequest) => {
  const event = createEvent(paymentRequest)
  const eventPublisher = new EventPublisher(messageConfig.eventsTopic)
  await eventPublisher.publishEvent(event)
}

const createEvent = (paymentRequest) => {
  return {
    source: SOURCE,
    type: PAYMENT_PROCESSED_NO_FURTHER_ACTION,
    data: paymentRequest
  }
}

module.exports = {
  sendZeroValueEvent
}
