const db = require('../database')
const { ADDED } = require('../constants/hold-statuses')
const { sendHoldEvent, sendPaymentHoldEvents } = require('../event')
const { getSchemeId } = require('./get-scheme-id')
const { getHeldPaymentRequests } = require('./get-held-payment-requests')

const addHold = async (frn, holdCategoryId, transaction) => {
  const schemeId = await getSchemeId(holdCategoryId, undefined, transaction)
  const alreadyHeld = await getHeldPaymentRequests(frn, schemeId, { transaction })
  const [hold] = await db.hold(transaction ?? undefined).insert({ frn, holdCategoryId, added: new Date() }).returning('*')
  await sendHoldEvent(hold, ADDED)
  if (!alreadyHeld.length) {
    await sendPaymentHoldEvents(await getHeldPaymentRequests(frn, schemeId, { transaction }))
  }
}

module.exports = { addHold }
