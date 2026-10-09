const db = require('../database')
const { AWAITING_DEBT_ENRICHMENT } = require('../constants/hold-categories-names')
const { removeAutoHold } = require('../auto-hold')

const prepareForReprocessing = async (paymentRequest, debtType, recoveryDate) => {
  await db.paymentRequest()
    .where({ paymentRequestId: paymentRequest.paymentRequestId })
    .update({
      debtType,
      recoveryDate
    })
  await removeAutoHold(paymentRequest, AWAITING_DEBT_ENRICHMENT)
}

module.exports = {
  prepareForReprocessing
}
