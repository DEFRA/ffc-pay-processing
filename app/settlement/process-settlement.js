const { updateSettlementStatus } = require('./update-settlement-status')
const { getSettlementFilter } = require('./get-settlement-filter')
const { sendProcessingReturnEvent } = require('../event')

const processSettlement = async (settlement) => {
  if (settlement.settled) {
    const filter = getSettlementFilter(settlement)
    const settledPaymentRequest = await updateSettlementStatus(settlement, filter)
    if (settledPaymentRequest) {
      try {
        await sendProcessingReturnEvent({ ...settlement, ...settledPaymentRequest })
      } catch (error) {
        console.error('Failed to send processing return event:', error)
      }
      return true
    }
  }

  try {
    await sendProcessingReturnEvent(settlement, true)
  } catch (error) {
    console.error('Failed to send processing return event for unsettled settlement:', error)
  }
  return false
}

module.exports = {
  processSettlement
}
