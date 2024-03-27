const { autoHold } = require('../config').processingConfig
const { TOP_UP, RECOVERY } = require('../constants/adjustment-types')
const { getTotalValue } = require('./get-total-value')
const { applyHold } = require('./apply-hold')

const applyAutoHold = async (paymentRequests) => {
  if (!autoHold.topUp && !autoHold.recovery) {
    return false
  }

  if (paymentRequests[0].paymentRequestNumber === 1) {
    return false
  }

  const totalValue = getTotalValue(paymentRequests)

  if (autoHold.topUp && totalValue >= 0) {
    await applyHold(paymentRequests[0].schemeId, paymentRequests[0].paymentRequestId, paymentRequests[0].frn, paymentRequests[0].marketingYear, TOP_UP)
    return true
  }

  if (autoHold.recovery && totalValue < 0) {
    await applyHold(paymentRequests[0].schemeId, paymentRequests[0].paymentRequestId, paymentRequests[0].frn, paymentRequests[0].marketingYear, RECOVERY)
    return true
  }

  return false
}

module.exports = {
  applyAutoHold
}
