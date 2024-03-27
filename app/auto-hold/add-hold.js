const db = require('../data')
const { ADDED } = require('../constants/hold-statuses')
const { sendHoldEvent } = require('../event')

const addHold = async (frn, autoHoldCategoryId, marketingYear, transaction) => {
  const hold = await db.autoHold.create({ frn, autoHoldCategoryId, marketingYear, added: Date.now() }, { transaction })
  await sendHoldEvent(hold.get({ plain: true }), ADDED)
}

module.exports = { addHold }
