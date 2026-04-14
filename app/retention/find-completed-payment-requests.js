const db = require('../data')

const findCompletedPaymentRequests = async (paymentRequestIds, transaction) => {
  return db.completedPaymentRequest.findAll({
    attributes: ['completedPaymentRequestId'],
    where: { paymentRequestId: paymentRequestIds },
    transaction
  })
}

module.exports = {
  findCompletedPaymentRequests
}
