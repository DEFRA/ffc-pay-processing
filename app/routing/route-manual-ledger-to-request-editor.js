const db = require('../data')
const { messageConfig } = require('../config')
const { sendMessage } = require('../messaging/send-message')
const { getHoldCategoryId, holdAndReschedule } = require('../auto-hold')
const { AWAITING_LEDGER_CHECK } = require('../constants/hold-categories-names')
const { ROUTED_LEDGER } = require('../constants/messages')

const routeManualLedgerToRequestEditor = async (deltaCalculationResult) => {
  const transaction = await db.sequelize.transaction()
  const { deltaPaymentRequest, completedPaymentRequests } = deltaCalculationResult
  try {
    const manualLedgerMessage = { paymentRequest: deltaPaymentRequest, paymentRequests: completedPaymentRequests }
    await sendMessage(manualLedgerMessage, ROUTED_LEDGER, messageConfig.manualTopic)
    console.log('Payment request routed to request editor for manual ledger check:', { frn: manualLedgerMessage.frn, sbi: manualLedgerMessage.sbi, invoiceNumber: manualLedgerMessage.invoiceNumber })
    const holdCategoryId = await getHoldCategoryId(deltaPaymentRequest.schemeId, AWAITING_LEDGER_CHECK, transaction)
    await holdAndReschedule(deltaPaymentRequest, holdCategoryId, transaction)
    await transaction.commit()
  } catch (error) {
    await transaction.rollback()
    console.log('Error routing payment request to request editor:', error)
    throw (error)
  }
}

module.exports = {
  routeManualLedgerToRequestEditor
}
