const db = require('../data')
const { getHoldCategoryId } = require('./get-hold-category-id')
const { holdAndReschedule } = require('./hold-and-reschedule')

const applyHold = async (schemeId, paymentRequestId, frn, marketingYear, category) => {
  const transaction = await db.sequelize.transaction()
  try {
    console.log(`${category} automatically held for marketing year ${marketingYear}: ${frn}`)
    const holdCategoryId = await getHoldCategoryId(schemeId, category, transaction)
    await holdAndReschedule(paymentRequestId, holdCategoryId, frn, marketingYear, transaction)
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
