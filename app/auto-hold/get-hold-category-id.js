const db = require('../data')

const getHoldCategoryId = async (schemeId, name, transaction) => {
  const holdCategory = await db.autoHoldCategory.findOne({ where: { schemeId, name }, transaction })
  return holdCategory?.autoHoldCategoryId
}

module.exports = {
  getHoldCategoryId
}
