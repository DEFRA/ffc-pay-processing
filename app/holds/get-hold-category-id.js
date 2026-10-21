const db = require('../database')

const getHoldCategoryId = async (schemeId, name, transaction) => {
  const holdCategory = await db.holdCategory(transaction ?? undefined).where({ schemeId, name }).first()
  return holdCategory?.holdCategoryId
}

module.exports = {
  getHoldCategoryId
}
