const db = require('../data')

const getExistingHold = async (autoHoldCategoryId, frn, marketingYear, transaction) => {
  return db.autoHold.findOne({
    transaction,
    where: { autoHoldCategoryId, frn, marketingYear, closed: null }
  })
}

module.exports = {
  getExistingHold
}
