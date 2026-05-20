const db = require('../data')
const { findCompletedPaymentRequests } = require('./find-completed-payment-requests')
const { findPaymentRequests } = require('./find-payment-requests')
const { removeCompletedInvoiceLines } = require('./remove-completed-invoice-lines')
const { removeCompletedPaymentRequests } = require('./remove-completed-payment-requests')
const { removeFRNAgreementClosed } = require('./remove-frn-agreement-closed')
const { removeInvoiceLines } = require('./remove-invoice-lines')
const { removeOutbox } = require('./remove-outbox')
const { removePaymentRequests } = require('./remove-payment-requests')
const { removeSchedules } = require('./remove-schedules')

const removeAgreementData = async (retentionData) => {
  const transaction = await db.sequelize.transaction()
  try {
    const { agreementNumber, frn, schemeId, usesContractNumber } = retentionData

    await removeFRNAgreementClosed(agreementNumber, frn, schemeId, transaction)

    const paymentRequests = await findPaymentRequests(agreementNumber, frn, schemeId, usesContractNumber, transaction)
    const paymentRequestIds = paymentRequests.map(pr => pr.paymentRequestId)
    if (paymentRequests.length === 0) {
      console.log('No payment request related agreement data to remove')
      await transaction.commit()
      return
    }

    const completedPaymentRequests = await findCompletedPaymentRequests(paymentRequestIds, transaction)
    const completedPaymentRequestIds = completedPaymentRequests.map(cpr => cpr.completedPaymentRequestId)
    if (completedPaymentRequestIds.length > 0) {
      await removeOutbox(completedPaymentRequestIds, transaction)
      await removeCompletedInvoiceLines(completedPaymentRequestIds, transaction)
      await removeCompletedPaymentRequests(completedPaymentRequestIds, transaction)
    }

    await removeSchedules(paymentRequestIds, transaction)
    await removeInvoiceLines(paymentRequestIds, transaction)
    await removePaymentRequests(paymentRequestIds, transaction)

    await transaction.commit()
  } catch (err) {
    await transaction.rollback()
    throw err
  }
}

module.exports = {
  removeAgreementData
}
