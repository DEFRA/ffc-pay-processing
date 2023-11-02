const db = require('../../data')
const { getScheduledPaymentRequests } = require('./get-scheduled-payment-requests')
const { removePending } = require('./remove-pending')
const { removeDuplicates } = require('./remove-duplicates')
const { restrictToBatchSize } = require('./restrict-to-batch-size')
const { updateScheduled } = require('./update-scheduled')

const getPaymentRequests = async (started = new Date()) => {
  const transaction = await db.sequelize.transaction()
  try {
    const paymentRequests = await getScheduledPaymentRequests(started, transaction)
    const paymentRequestsWithoutPending = await removePending(paymentRequests, started, transaction)
    const uniquePaymentRequests = removeDuplicates(paymentRequestsWithoutPending)
    const cappedPaymentRequests = restrictToBatchSize(uniquePaymentRequests)
    await updateScheduled(cappedPaymentRequests, started, transaction)
    await transaction.commit()
    return cappedPaymentRequests
  } catch (error) {
    await transaction.rollback()
    throw (error)
  }
}

module.exports = {
  getPaymentRequests
}
