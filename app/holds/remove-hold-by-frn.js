const db = require('../database')
const { getHoldCategoryId } = require('./get-hold-category-id')
const { sendHoldEvent } = require('../event')
const { REMOVED } = require('../constants/hold-statuses')

const removeHoldByFrn = async (schemeId, frn, holdCategoryName) => {
  const holdCategoryId = await getHoldCategoryId(schemeId, holdCategoryName)
  const hold = (await db.hold().where({ frn, holdCategoryId, closed: null }).first()) ?? null
  if (hold) {
    const holdClosed = new Date()
    await db.hold().where({ frn, holdCategoryId, closed: null }).update({ closed: holdClosed })
    await sendHoldEvent({ ...hold, closed: holdClosed }, REMOVED)
  }
}

module.exports = {
  removeHoldByFrn
}
