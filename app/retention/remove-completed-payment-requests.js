const db = require('../data')

const removeCompletedPaymentRequests = async (completedPaymentRequestIds, transaction) => {
  await db.completedPaymentRequest.destroy({
    where: { completedPaymentRequestId: completedPaymentRequestIds },
    transaction
  })
}

module.exports = {
  removeCompletedPaymentRequests
}
