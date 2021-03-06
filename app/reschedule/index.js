const { addHold } = require('../holds')
const ensureScheduled = require('./ensure-scheduled')
const getExistingHold = require('./get-existing-hold.js')

const holdAndReschedule = async (schemeId, paymentRequestId, holdCategoryId, frn, transaction) => {
  const existingHold = await getExistingHold(holdCategoryId, frn, transaction)
  if (!existingHold) {
    await addHold(frn, holdCategoryId, transaction)
  }
  await ensureScheduled(paymentRequestId, schemeId, transaction)
}

module.exports = holdAndReschedule
