const { getSchemeIds } = require('ffc-pay-schemes')
const db = require('../database')
const { ADDED } = require('../constants/hold-statuses')
const { sendHoldEvent } = require('../event')

const { BPS } = getSchemeIds()

const addHold = async (deltaPaymentRequest, autoHoldCategoryId, transaction) => {
  const { frn, marketingYear, agreementNumber, contractNumber, schemeId } = deltaPaymentRequest
  const fieldsToSet = { frn, autoHoldCategoryId, marketingYear, added: new Date() }
  if (schemeId !== BPS) {
    fieldsToSet.agreementNumber = agreementNumber
    fieldsToSet.contractNumber = contractNumber
  }
  const [hold] = await db.autoHold(transaction ?? undefined).insert(fieldsToSet).returning('*')
  await sendHoldEvent(hold, ADDED)
}

module.exports = { addHold }
