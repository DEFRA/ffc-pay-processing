const db = require('../database')
const { REMOVED } = require('../constants/hold-statuses')
const { sendHoldEvent } = require('../event')

const removeBulkHold = async (data, holdCategoryId) => {
  for (const frn of data) {
    const hold = (await db.hold().where({ frn, holdCategoryId, closed: null }).first()) ?? null
    if (hold) {
      const holdClosed = new Date()
      await db.hold().where({ frn, holdCategoryId, closed: null }).update({ closed: holdClosed })
      await sendHoldEvent({ ...hold, closed: holdClosed }, REMOVED)
    }
  }
}

module.exports = { removeBulkHold }
