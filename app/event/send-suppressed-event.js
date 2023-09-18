const { processingConfig, messageConfig } = require('../config')
const { EventPublisher } = require('ffc-pay-event-publisher')
const { SOURCE } = require('../constants/source')
const { PAYMENT_SUPPRESSED } = require('../constants/events')

const sendSuppressedEvent = async (paymentRequest, deltaValue, creditAP, suppressedAR) => {
  if (processingConfig.useV2Events) {
    await sendV2SuppressedEvent(paymentRequest, deltaValue, creditAP, suppressedAR)
  }
}

const sendV2SuppressedEvent = async (paymentRequest, deltaValue, creditAP, suppressedAR) => {
  const event = {
    source: SOURCE,
    type: PAYMENT_SUPPRESSED,
    data: {
      ...paymentRequest,
      deltaValue,
      creditAP,
      suppressedAR
    }
  }
  const eventPublisher = new EventPublisher(messageConfig.eventsTopic)
  await eventPublisher.publishEvent(event)
}

module.exports = {
  sendSuppressedEvent
}
