const db = require('../database')

const updateScheme = async (schemeId, active) => {
  await db.scheme().where({ schemeId }).update({ active })
}

module.exports = {
  updateScheme
}
