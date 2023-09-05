const { MANUAL, ES, IMPS, FC, SFI } = require('../constants/schemes')
const { completePaymentRequests } = require('./complete-payment-requests')
const { transformPaymentRequest } = require('./transform-payment-request')
const { applyAutoHold } = require('./auto-hold')
const { requiresDebtData } = require('./requires-debt-data')
const { routeDebtToRequestEditor, routeManualLedgerToRequestEditor } = require('../routing')
const { sendProcessingRouteEvent } = require('../event')
const { requiresManualLedgerCheck } = require('./requires-manual-ledger-check')
const { mapAccountCodes } = require('./account-codes')
const { isAgreementClosed } = require('./is-agreement-closed')
const config = require('../config/processing')

const processPaymentRequest = async (scheduledPaymentRequest) => {
  const { scheduleId, paymentRequest } = scheduledPaymentRequest

  if ([MANUAL, ES, IMPS, FC].includes(paymentRequest.schemeId)) {
    await completePaymentRequests(scheduleId, [paymentRequest])
    return
  }

  let paymentRequests = await transformPaymentRequest(paymentRequest)

  // if FRN is closed, remove AR
  const agreementIsClosed = config.handleSchemeClosures ? await isAgreementClosed(paymentRequest) : false
  if (agreementIsClosed) {
    paymentRequests.completedPaymentRequests = paymentRequests.completedPaymentRequests.filter(paymentRequest => paymentRequest.ledger === 'AP')
  }

  const { deltaPaymentRequest, completedPaymentRequests } = paymentRequests

  if (await applyAutoHold(completedPaymentRequests)) {
    return
  }

  // If has AR but no debt enrichment data, then route to request editor and apply hold
  if (requiresDebtData(completedPaymentRequests)) {
    await sendProcessingRouteEvent(paymentRequest, 'debt', 'request')
    await routeDebtToRequestEditor(paymentRequest)
    return
  }

  if (deltaPaymentRequest && !agreementIsClosed) {
    const sendToManualLedgerCheck = await requiresManualLedgerCheck(deltaPaymentRequest)

    if (sendToManualLedgerCheck) {
      await sendProcessingRouteEvent(paymentRequest, 'manual-ledger', 'request')
      await routeManualLedgerToRequestEditor(paymentRequests)
      return
    }
  }
  for (const completedPaymentRequest of completedPaymentRequests) {
    await mapAccountCodes(completedPaymentRequest)
  }
  await completePaymentRequests(scheduleId, completedPaymentRequests)
}

module.exports = {
  processPaymentRequest
}
