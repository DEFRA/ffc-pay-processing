const { getSchemeIds } = require('ffc-pay-schemes')
const db = require('../database')

const { BPS } = getSchemeIds()

const getExistingHold = async (autoHoldCategoryId, paymentRequest, transaction) => {
  const { frn, marketingYear, agreementNumber, contractNumber, schemeId } = paymentRequest
  const where = { autoHoldCategoryId, frn, marketingYear, closed: null }
  if (schemeId !== BPS) {
    where.agreementNumber = agreementNumber
    where.contractNumber = contractNumber
  }
  return (await db.autoHold(transaction ?? undefined).where(where).first()) ?? null
}

module.exports = {
  getExistingHold
}
