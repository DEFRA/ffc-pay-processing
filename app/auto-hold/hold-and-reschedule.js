const { getExistingHold } = require('./get-existing-hold')
const { addHold } = require('./add-hold')
const { ensureScheduled } = require('../reschedule/ensure-scheduled')

const holdAndReschedule = async (paymentRequestId, holdCategoryId, frn, marketingYear, transaction) => {
  const existingHold = await getExistingHold(holdCategoryId, frn, marketingYear, transaction)
  if (!existingHold) {
    await addHold(frn, holdCategoryId, marketingYear, transaction)
  }
  await ensureScheduled(paymentRequestId, transaction)
}

module.exports = {
  holdAndReschedule
}
