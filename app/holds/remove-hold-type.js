const db = require('../database')

const removeHoldType = async (holdCategoryId, transaction) => {
  await db.holdCategory(transaction ?? undefined)
    .where({ holdCategoryId })
    .del()
}

module.exports = { removeHoldType }
