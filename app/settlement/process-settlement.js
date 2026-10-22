const { updateSettlementStatus } = require('./update-settlement-status')
const { getSettlementFilter } = require('./get-settlement-filter')
const { getSettlementPaymentRequest } = require('./get-settlement-payment-request')
const { sendProcessingReturnEvent } = require('../event')

const getUnsettledPaymentRequest = async (filter) => {
  try {
    return await getSettlementPaymentRequest(filter)
  } catch (error) {
    console.error('Failed to get payment request for unsettled settlement:', error)
    return undefined
  }
}

const processSettlement = async (settlement) => {
  const filter = getSettlementFilter(settlement)
  if (settlement.settled) {
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

  const paymentRequest = settlement.settled ? undefined : await getUnsettledPaymentRequest(filter)

  try {
    await sendProcessingReturnEvent(settlement, true, paymentRequest)
  } catch (error) {
    console.error('Failed to send processing return event for unsettled settlement:', error)
  }
  return false
}

module.exports = {
  processSettlement
}
