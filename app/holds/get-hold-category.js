const db = require('../database')

const getHoldCategory = async (holdCategoryId) => {
  const holdCategory = await db.holdCategory().where({ holdCategoryId }).first()
  if (!holdCategory) {
    return null
  }
  holdCategory.scheme = (await db.scheme().where({ schemeId: holdCategory.schemeId }).first()) ?? null
  return holdCategory
}

module.exports = {
  getHoldCategory
}
