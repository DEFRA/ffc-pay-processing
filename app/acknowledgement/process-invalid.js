const db = require('../data')
const { getHoldCategoryId } = require('../holds')
const getHoldCategoryName = require('./get-hold-category-name')
const holdAndReschedule = require('../reschedule')
const { resetPaymentRequestById } = require('../reset')
const { sendAckowledgementErrorEvent } = require('../event')

const config = require('../config')

const processInvalid = async (schemeId, paymentRequestId, frn, acknowledgement) => {
  const transaction = await db.sequelize.transaction()
  try {
    await resetPaymentRequestById(paymentRequestId, schemeId, transaction)
    const holdCategoryName = getHoldCategoryName(acknowledgement.message)
    const holdCategoryId = await getHoldCategoryId(schemeId, holdCategoryName, transaction)
    await holdAndReschedule(schemeId, paymentRequestId, holdCategoryId, frn, transaction)
    if (config.isAlerting && !acknowledgement.success) {
      sendAckowledgementErrorEvent(holdCategoryName, acknowledgement, frn)
    }
    await transaction.commit()
  } catch (error) {
    await transaction.rollback()
    throw (error)
  }
}

module.exports = processInvalid
