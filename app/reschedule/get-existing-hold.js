const db = require('../data')

const getExistingHold = async (holdCategoryId, frn, transaction) => {
  return db.hold.findOne({
    transaction,
    lock: true,
    where: { holdCategoryId, frn, closed: null }
  })
}

module.exports = {
  getExistingHold
}
