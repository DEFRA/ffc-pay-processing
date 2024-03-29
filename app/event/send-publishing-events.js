const { processingConfig, messageConfig } = require('../config')
const { EventPublisher } = require('ffc-pay-event-publisher')
const { SOURCE } = require('../constants/source')
const { PAYMENT_PROCESSED } = require('../constants/events')

const sendPublishingEvents = async (paymentRequests) => {
  if (processingConfig.useV2Events) {
    await sendV2PublishingEvents(paymentRequests)
  }
}

const sendV2PublishingEvents = async (paymentRequests) => {
  const events = paymentRequests.map(createEvent)
  const eventPublisher = new EventPublisher(messageConfig.eventsTopic)
  await eventPublisher.publishEvents(events)
}

const createEvent = (paymentRequest) => {
  return {
    source: SOURCE,
    type: PAYMENT_PROCESSED,
    data: paymentRequest
  }
}

module.exports = {
  sendPublishingEvents
}
