const { BPS } = require('../constants/schemes')
const db = require('../data')

const getExistingHold = async (autoHoldCategoryId, paymentRequest, transaction) => {
  const { frn, marketingYear, agreementNumber, contractNumber, schemeId } = paymentRequest
  const where = { autoHoldCategoryId, frn, marketingYear, closed: null }
  if (schemeId !== BPS) {
    where.agreementNumber = agreementNumber
    where.contractNumber = contractNumber
  }
  return db.autoHold.findOne({
    transaction,
    where
  })
}

module.exports = {
  getExistingHold
}
