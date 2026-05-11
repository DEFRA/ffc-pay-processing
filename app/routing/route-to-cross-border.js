const db = require('../data')
const { messageConfig } = require('../config')
const { sendMessage } = require('../messaging/send-message')
const { getHoldCategoryId, holdAndReschedule } = require('../auto-hold')
const { CROSS_BORDER } = require('../constants/messages')
const { CROSS_BORDER: CROSS_BORDER_HOLD } = require('../constants/hold-categories-names')

const routeToCrossBorder = async (paymentRequest) => {
  const transaction = await db.sequelize.transaction()
  try {
    await sendMessage(paymentRequest, CROSS_BORDER, messageConfig.xbTopic)
    console.log('Payment request routed to Cross Border:', { frn: paymentRequest.frn, sbi: paymentRequest.sbi, invoiceNumber: paymentRequest.invoiceNumber })
    const holdCategoryId = await getHoldCategoryId(paymentRequest.schemeId, CROSS_BORDER_HOLD, transaction)
    await holdAndReschedule(paymentRequest, holdCategoryId, transaction)
    await transaction.commit()
  } catch (error) {
    await transaction.rollback()
    throw (error)
  }
}

module.exports = {
  routeToCrossBorder
}
