const db = require('../data')

const addHoldType = async (name, schemeId, transaction) => {
  await db.holdCategory.create({ name, schemeId }, { transaction })
}

module.exports = { addHoldType }
