const db = require('../data')
const { ADDED } = require('../constants/hold-statuses')
const { sendHoldEvent } = require('../event')
const { BPS } = require('../constants/schemes')

const addHold = async (deltaPaymentRequest, autoHoldCategoryId, transaction) => {
  const { frn, marketingYear, agreementNumber, contractNumber, schemeId } = deltaPaymentRequest
  const fieldsToSet = { frn, autoHoldCategoryId, marketingYear, added: Date.now() }
  if (schemeId !== BPS) {
    fieldsToSet.agreementNumber = agreementNumber
    fieldsToSet.contractNumber = contractNumber
  }
  const hold = await db.autoHold.create(fieldsToSet, { transaction })
  await sendHoldEvent(hold.get({ plain: true }), ADDED)
}

module.exports = { addHold }
