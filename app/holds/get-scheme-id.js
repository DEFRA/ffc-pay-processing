const db = require('../database')

const getSchemeId = async (holdCategoryId, autoHoldCategoryId, transaction) => {
  if (holdCategoryId) {
    const holdCategory = await db.holdCategory(transaction ?? undefined).where({ holdCategoryId }).first()
    return holdCategory?.schemeId
  }
  const holdCategory = await db.autoHoldCategory(transaction ?? undefined).where({ autoHoldCategoryId }).first()
  return holdCategory?.schemeId
}

module.exports = {
  getSchemeId
}
