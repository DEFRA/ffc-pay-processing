const db = require('../data')
const { getHoldCategoryId } = require('./get-hold-category-id')
const { holdAndReschedule } = require('./hold-and-reschedule')

const applyHold = async (paymentRequest, category) => {
  const transaction = await db.sequelize.transaction()
  const { schemeId, frn, marketingYear, agreementNumber, contractNumber } = paymentRequest
  try {
    console.log(`${category} automatically held for FRN ${frn}, with marketing year ${marketingYear}, agreement number ${agreementNumber} and contract number ${contractNumber}`)
    const holdCategoryId = await getHoldCategoryId(schemeId, category, transaction)
    await holdAndReschedule(paymentRequest, holdCategoryId, transaction)
    await transaction.commit()
  } catch (error) {
    console.error('An error occurred whilst applying hold:', error)
    await transaction.rollback()
    throw (error)
  }
}

module.exports = {
  applyHold
}
