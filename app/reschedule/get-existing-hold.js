const db = require('../database')

const getExistingHold = async (holdCategoryId, frn, transaction) => {
  return (await db.hold(transaction ?? undefined)
    .where({ holdCategoryId, frn, closed: null })
    .first()) ?? null
}

module.exports = {
  getExistingHold
}
