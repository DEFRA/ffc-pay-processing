const db = require('../database')

const getHoldCategories = async () => {
  return db.holdCategory()
    .leftJoin('schemes', 'holdCategories.schemeId', 'schemes.schemeId')
    .select(
      'holdCategories.holdCategoryId',
      'holdCategories.name',
      'schemes.schemeId',
      { schemeName: 'schemes.name' }
    )
}

module.exports = {
  getHoldCategories
}
