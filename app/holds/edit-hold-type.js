const db = require('../database')

const editHoldType = async (name, holdCategoryId, transaction) => {
  await db.holdCategory(transaction ?? undefined)
    .where({ holdCategoryId })
    .update({ name })
}

module.exports = { editHoldType }
