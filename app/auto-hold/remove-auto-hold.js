const db = require('../data')
const { getHoldCategoryId } = require('./get-hold-category-id')
const { sendHoldEvent } = require('../event')
const { REMOVED } = require('../constants/hold-statuses')
const { BPS } = require('../constants/schemes')

const removeAutoHold = async (paymentRequest, holdCategoryName) => {
  const { schemeId, frn, marketingYear, agreementNumber, contractNumber } = paymentRequest
  const autoHoldCategoryId = await getHoldCategoryId(schemeId, holdCategoryName)
  const where = { frn, marketingYear, autoHoldCategoryId, closed: null }
  if (schemeId !== BPS) {
    where.agreementNumber = agreementNumber
    where.contractNumber = contractNumber
  }
  const hold = await db.autoHold.findOne({ where, raw: true })
  if (hold) {
    const holdClosed = new Date()
    await db.autoHold.update({ closed: holdClosed }, { where })
    await sendHoldEvent({ ...hold, closed: holdClosed }, REMOVED)
  }
}

module.exports = {
  removeAutoHold
}
