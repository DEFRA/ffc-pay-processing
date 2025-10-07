const { messageConfig } = require('../config')
const { EventPublisher } = require('ffc-pay-event-publisher')
const { SOURCE } = require('../constants/source')
const { PAYMENT_PROCESSING_FAILED } = require('../constants/events')

const sendProcessingErrorEvent = async (paymentRequest, error) => {
  const event = {
    source: SOURCE,
    type: PAYMENT_PROCESSING_FAILED,
    data: {
      message: error.message,
      ...paymentRequest
    }
  }
  const eventPublisher = new EventPublisher(messageConfig.eventsTopic)
  await eventPublisher.publishEvent(event)
}

module.exports = {
  sendProcessingErrorEvent
}
