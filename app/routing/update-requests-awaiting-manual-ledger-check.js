const db = require('../database')
const { getScheduleId } = require('./get-schedule-id')
const { transformPaymentRequest } = require('./transform-payment-request')
const { mapAccountCodes } = require('../processing/account-codes')
const { completePaymentRequests } = require('../processing/complete-payment-requests')
const { removeAutoHold } = require('../auto-hold')
const { sendProcessingRouteEvent } = require('../event')
const { AWAITING_LEDGER_CHECK } = require('../constants/hold-categories-names')

const updateRequestsAwaitingManualLedgerCheck = async (manualLedgerCheckResult) => {
  const originalPaymentRequest = manualLedgerCheckResult.paymentRequest

  const checkPaymentRequest = (await db.paymentRequest().where({ invoiceNumber: originalPaymentRequest.invoiceNumber }).first()) ?? null
  if (!checkPaymentRequest) {
    throw new Error(`No payment request matching invoice number: ${manualLedgerCheckResult.invoiceNumber}`)
  }

  const paymentRequestId = checkPaymentRequest.paymentRequestId
  const schedule = await getScheduleId(paymentRequestId)

  if (schedule) {
    const scheduleId = schedule.scheduleId
    const paymentRequests = await transformPaymentRequest(originalPaymentRequest, manualLedgerCheckResult.paymentRequests)

    // Mapping account codes need to be re-calculated on processing of a manual ledger check
    for (const paymentRequestItem of paymentRequests) {
      mapAccountCodes(paymentRequestItem)
    }

    const updatedPaymentRequests = paymentRequests.map(x => {
      x.correlationId = checkPaymentRequest.correlationId
      x.paymentRequestId = paymentRequestId
      return x
    })

    await completePaymentRequests(scheduleId, updatedPaymentRequests)
    await removeAutoHold(checkPaymentRequest, AWAITING_LEDGER_CHECK)

    for (const paymentRequestItem of updatedPaymentRequests) {
      await sendProcessingRouteEvent(paymentRequestItem, 'manual-ledger', 'response')
    }
  }
}

module.exports = {
  updateRequestsAwaitingManualLedgerCheck
}
