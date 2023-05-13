const db = require('../data')
const { VALIDATION } = require('../constants/errors')
const { prepareForReprocessing } = require('./prepare-for-reprocessing')

const updateRequestsAwaitingDebtData = async (paymentRequest) => {
  if (!paymentRequest.debtType) {
    const error = new Error(`Payment request does not include debt data: ${paymentRequest.invoiceNumber}`)
    error.category = VALIDATION
    throw error
  }

  const originalPaymentRequest = await db.paymentRequest.findOne({ where: { invoiceNumber: paymentRequest.invoiceNumber } })

  if (!originalPaymentRequest) {
    const error = new Error(`No payment request matching invoice number: ${paymentRequest.invoiceNumber}`)
    error.category = VALIDATION
    throw error
  }
  await prepareForReprocessing(originalPaymentRequest, paymentRequest.debtType, paymentRequest.recoveryDate)
}

module.exports = {
  updateRequestsAwaitingDebtData
}
