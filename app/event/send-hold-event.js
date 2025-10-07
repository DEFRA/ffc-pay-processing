const { messageConfig } = require('../config')
const { EventPublisher } = require('ffc-pay-event-publisher')
const { SOURCE } = require('../constants/source')
const { HOLD_PREFIX } = require('../constants/events')
const { getSchemeId } = require('../holds/get-scheme-id')

const sendHoldEvent = async (hold, status) => {
  const { holdCategoryId, autoHoldCategoryId } = hold
  const schemeId = await getSchemeId(holdCategoryId, autoHoldCategoryId)
  if (autoHoldCategoryId) {
    hold.holdCategoryId = autoHoldCategoryId
    delete hold.autoHoldCategoryId
  }
  const event = {
    source: SOURCE,
    type: `${HOLD_PREFIX}.${status}`,
    data: {
      ...hold,
      schemeId
    }
  }
  const eventPublisher = new EventPublisher(messageConfig.eventsTopic)
  await eventPublisher.publishEvent(event)
}

module.exports = {
  sendHoldEvent
}
