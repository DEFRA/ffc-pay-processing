const { processingConfig, messageConfig } = require('../config')
const { EventPublisher } = require('ffc-pay-event-publisher')
const { SOURCE } = require('../constants/source')
const { HOLD_PREFIX } = require('../constants/events')
const { getSchemeId } = require('../holds/get-scheme-id')

const sendHoldEvent = async (hold, status) => {
  if (processingConfig.useV2Events) {
    await sendV2HoldEvent(hold, status)
  }
}

const sendV2HoldEvent = async (hold, status) => {
  const holdCategoryId = hold.holdCategoryId ?? hold.autoHoldCategoryId
  const schemeId = await getSchemeId(holdCategoryId)
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
