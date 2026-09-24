const db = require('../database')
const { getHoldCategory } = require('./get-hold-category')

const getHold = async (holdId) => {
  const hold = await db.hold().where({ holdId }).first()
  if (!hold) {
    return null
  }
  hold.holdCategory = await getHoldCategory(hold.holdCategoryId)
  return hold
}

module.exports = {
  getHold
}
