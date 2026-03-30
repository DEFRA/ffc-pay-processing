const { MANUAL, ES, IMPS, FC, BPS, FPTT } = require('../constants/schemes')
const { completePaymentRequests } = require('./complete-payment-requests')
const { isCrossBorder } = require('./is-cross-border')
const { transformPaymentRequest } = require('./transform-payment-request')
const { applyAutoHold } = require('../auto-hold')
const { requiresDebtData } = require('./requires-debt-data')
const {
  routeDebtToRequestEditor,
  routeManualLedgerToRequestEditor,
  routeToCrossBorder
} = require('../routing')
const { sendProcessingRouteEvent } = require('../event')
const { requiresManualLedgerCheck } = require('./requires-manual-ledger-check')
const { mapAccountCodes } = require('./account-codes')
const { isAgreementClosed } = require('./is-agreement-closed')
const { suppressARPaymentRequests } = require('./suppress-ar-payment-requests')
const config = require('../config/processing')

const noCalculationsRequired = schemeId => [MANUAL, ES, IMPS, FC, FPTT].includes(schemeId)

const isBPSCrossBorder = paymentRequest => {
  return (
    paymentRequest.schemeId === BPS &&
    isCrossBorder(paymentRequest.invoiceLines)
  )
}

const handleCrossBorder = async paymentRequest => {
  await sendProcessingRouteEvent(paymentRequest, 'cross-border', 'request')
  await routeToCrossBorder(paymentRequest)
}

const checkAgreementClosure = async paymentRequest => {
  return config.handleSchemeClosures ? isAgreementClosed(paymentRequest) : false
}

const handleAgreementClosure = async (paymentRequest, paymentRequests) => {
  paymentRequests.completedPaymentRequests = await suppressARPaymentRequests(
    paymentRequest,
    paymentRequests.completedPaymentRequests
  )
}

const handleDebtData = async paymentRequest => {
  await sendProcessingRouteEvent(paymentRequest, 'debt', 'request')
  await routeDebtToRequestEditor(paymentRequest)
}

const handleManualLedger = async (paymentRequest, paymentRequests) => {
  await sendProcessingRouteEvent(paymentRequest, 'manual-ledger', 'request')
  await routeManualLedgerToRequestEditor(paymentRequests)
}

const validatePayment = async (paymentRequests, agreementIsClosed) => {
  if (await applyAutoHold(paymentRequests.completedPaymentRequests)) {
    return true
  }

  return (
    !agreementIsClosed &&
    requiresDebtData(paymentRequests.completedPaymentRequests)
  )
}

const checkManualLedger = async (
  _paymentRequest,
  paymentRequests,
  agreementIsClosed
) => {
  if (paymentRequests.deltaPaymentRequest && !agreementIsClosed) {
    return requiresManualLedgerCheck(paymentRequests.deltaPaymentRequest)
  }
  return false
}

const finalizePayment = async (scheduleId, completedPaymentRequests) => {
  for (const completedPaymentRequest of completedPaymentRequests) {
    mapAccountCodes(completedPaymentRequest)
  }
  await completePaymentRequests(scheduleId, completedPaymentRequests)
}

const processPaymentRequest = async scheduledPaymentRequest => {
  const { scheduleId, paymentRequest } = scheduledPaymentRequest

  if (noCalculationsRequired(paymentRequest.schemeId)) {
    await completePaymentRequests(scheduleId, [paymentRequest])
    return
  }

  if (isBPSCrossBorder(paymentRequest)) {
    await handleCrossBorder(paymentRequest)
    return
  }

  const paymentRequests = await transformPaymentRequest(paymentRequest)
  const agreementIsClosed = await checkAgreementClosure(paymentRequest)

  if (agreementIsClosed) {
    await handleAgreementClosure(paymentRequest, paymentRequests)
  }

  if (await validatePayment(paymentRequests, agreementIsClosed)) {
    await handleDebtData(paymentRequest)
    return
  }

  if (
    await checkManualLedger(paymentRequest, paymentRequests, agreementIsClosed)
  ) {
    await handleManualLedger(paymentRequest, paymentRequests)
    return
  }

  await finalizePayment(scheduleId, paymentRequests.completedPaymentRequests)
}

module.exports = {
  processPaymentRequest
}
