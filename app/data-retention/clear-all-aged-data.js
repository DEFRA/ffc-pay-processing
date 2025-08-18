const db = require('../data')
const { deleteOutbox, deleteCompletedInvoiceLines, deleteCompletedPaymentRequests, deleteSchedule, deleteInvoiceLines, deletePaymentRequests } = require('./deletion')
const { getCompletedPaymentRequestIds } = require('./get-completed-payment-request-ids')
const { getPaymentRequestIdsByAgreement } = require('./get-payment-request-ids-by-agreement')

const clearAllAgedData = async (agreement) => {
  const transaction = await db.sequelize.transaction()
  try {
    const { schemeId, frn, agreementNumber } = agreement
    const paymentRequestIds = await getPaymentRequestIdsByAgreement(schemeId, frn, agreementNumber, transaction)
    const completedPaymentRequestIds = await getCompletedPaymentRequestIds(paymentRequestIds, transaction)
    await deleteOutbox(completedPaymentRequestIds, transaction)
    await deleteCompletedInvoiceLines(completedPaymentRequestIds, transaction)
    await deleteCompletedPaymentRequests(completedPaymentRequestIds, transaction)
    await deleteSchedule(paymentRequestIds, transaction)
    await deleteInvoiceLines(paymentRequestIds, transaction)
    await deletePaymentRequests(paymentRequestIds, transaction)
    await transaction.commit()
  } catch (err) {
    console.error('Error clearing aged data:', err)
    await transaction.rollback()
  }
}

module.exports = {
  clearAllAgedData
}
