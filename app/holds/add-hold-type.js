const db = require('../database')

const addHoldType = async (name, schemeId, transaction) => {
  await db.holdCategory(transaction ?? undefined).insert({ name, schemeId })
}

module.exports = { addHoldType }
