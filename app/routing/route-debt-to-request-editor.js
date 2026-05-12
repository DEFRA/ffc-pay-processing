const db = require('../data')
const { messageConfig } = require('../config')
const { sendMessage } = require('../messaging/send-message')
const { getHoldCategoryId, holdAndReschedule } = require('../auto-hold')
const { ROUTED_DEBT } = require('../constants/messages')
const { AWAITING_DEBT_ENRICHMENT } = require('../constants/hold-categories-names')

const routeDebtToRequestEditor = async (paymentRequest) => {
  const transaction = await db.sequelize.transaction()
  try {
    await sendMessage(paymentRequest, ROUTED_DEBT, messageConfig.debtTopic)
    console.log('Payment request routed to request editor:', { frn: paymentRequest.frn, sbi: paymentRequest.sbi, invoiceNumber: paymentRequest.invoiceNumber })
    const holdCategoryId = await getHoldCategoryId(paymentRequest.schemeId, AWAITING_DEBT_ENRICHMENT, transaction)
    await holdAndReschedule(paymentRequest, holdCategoryId, transaction)
    await transaction.commit()
  } catch (error) {
    await transaction.rollback()
    throw (error)
  }
}

module.exports = {
  routeDebtToRequestEditor
}
