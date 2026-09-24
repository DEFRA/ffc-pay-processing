const db = require('../database')

const getHoldCategoryId = async (schemeId, name, transaction) => {
  const holdCategory = await db.autoHoldCategory(transaction ?? undefined).where({ schemeId, name }).first()
  return holdCategory?.autoHoldCategoryId
}

module.exports = {
  getHoldCategoryId
}
