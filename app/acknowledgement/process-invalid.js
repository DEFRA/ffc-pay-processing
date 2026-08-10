const db = require('../data')
const { resetPaymentRequestById } = require('../reset')
const { getHoldCategoryName } = require('./get-hold-category-name')
const { getHoldCategoryId } = require('../holds')
const { holdAndReschedule } = require('../reschedule')
const { sendAcknowledgementErrorEvent } = require('../event')

const processInvalid = async (paymentRequest, acknowledgement) => {
  const transaction = await db.sequelize.transaction()
  try {
    const { schemeId, paymentRequestId, frn } = paymentRequest
    await resetPaymentRequestById(paymentRequestId, transaction)
    const holdCategoryName = getHoldCategoryName(acknowledgement.message)
    const holdCategoryId = await getHoldCategoryId(schemeId, holdCategoryName, transaction)
    await holdAndReschedule(paymentRequestId, holdCategoryId, frn, transaction)
    await sendAcknowledgementErrorEvent(holdCategoryName, acknowledgement, paymentRequest)

    await transaction.commit()
  } catch (error) {
    await transaction.rollback()
    throw (error)
  }
}

module.exports = {
  processInvalid
}
