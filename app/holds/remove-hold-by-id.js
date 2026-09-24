const db = require('../database')
const { REMOVED } = require('../constants/hold-statuses')
const { sendHoldEvent } = require('../event')

const removeHoldById = async (holdId) => {
  await db.hold().where({ holdId }).update({ closed: new Date() })
  const hold = (await db.hold().where({ holdId }).first()) ?? null
  await sendHoldEvent(hold, REMOVED)
}

module.exports = {
  removeHoldById
}
