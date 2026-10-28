const { EventPublisher } = require('ffc-pay-event-publisher')
const { messageConfig } = require('../config')
const { SOURCE } = require('../constants/source')
const { SCHEME_ADDED } = require('../constants/events')

const sendSchemeAddedEvent = async ({ schemeId, schemeName }) => {
  const event = {
    source: SOURCE,
    type: SCHEME_ADDED,
    data: {
      message: 'A new scheme has been added to Payment Hub',
      schemeId,
      schemeName
    }
  }

  const eventPublisher = new EventPublisher(messageConfig.eventsTopic)
  await eventPublisher.publishEvent(event)
}

module.exports = {
  sendSchemeAddedEvent
}
