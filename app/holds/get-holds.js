const db = require('../data')

const getHolds = async (open = true) => {
  const where = open ? { closed: null } : {}
  const holds = await db.hold.findAll({
    where,
    include: [{
      model: db.holdCategory,
      as: 'holdCategory',
      attributes: [],
      include: [{
        model: db.scheme,
        as: 'scheme',
        attributes: []
      }]
    }],
    raw: true,
    attributes: ['holdId', 'frn', [db.Sequelize.col('holdCategory.name'), 'holdCategoryName'], [db.Sequelize.col('holdCategory.scheme.schemeId'), 'holdCategorySchemeId'], [db.Sequelize.col('holdCategory.scheme.name'), 'holdCategorySchemeName'], [db.Sequelize.col('added'), 'dateTimeAdded'], [db.Sequelize.col('closed'), 'dateTimeClosed']]
  })

  const autoHolds = await db.autoHold.findAll({
    where,
    include: [{
      model: db.autoHoldCategory,
      as: 'autoHoldCategory',
      attributes: [],
      include: [{
        model: db.scheme,
        as: 'scheme',
        attributes: []
      }]
    }],
    raw: true,
    attributes: [['autoHoldId', 'holdId'], 'frn', [db.Sequelize.col('autoHoldCategory.name'), 'holdCategoryName'], [db.Sequelize.col('autoHoldCategory.scheme.schemeId'), 'holdCategorySchemeId'], [db.Sequelize.col('autoHoldCategory.scheme.name'), 'holdCategorySchemeName'], 'marketingYear', [db.Sequelize.col('added'), 'dateTimeAdded'], [db.Sequelize.col('closed'), 'dateTimeClosed']]
  })

  const mergedHolds = holds.map(hold => ({
    ...hold,
    marketingYear: 'All'
  }))

  const mergedResults = [...mergedHolds, ...autoHolds]

  return mergedResults
}

module.exports = {
  getHolds
}
