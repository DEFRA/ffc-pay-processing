const db = require('../database')
const { ADDED } = require('../constants/hold-statuses')
const { sendHoldEvent } = require('../event')

const addHold = async (frn, holdCategoryId, transaction) => {
  const [hold] = await db.hold(transaction ?? undefined).insert({ frn, holdCategoryId, added: new Date() }).returning('*')
  await sendHoldEvent(hold, ADDED)
}

module.exports = { addHold }
