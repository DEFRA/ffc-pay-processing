const db = require('../data')

const getCompletedPaymentRequestIds = async (paymentRequestIds, transaction) => {
  const completedPaymentRequests = db.paymentRequest.findAll({
    where: {
      paymentRequestId: {
        [db.Sequelize.Op.in]: paymentRequestIds
      }
    },
    attributes: ['completedPaymentRequestId'],
    transaction
  })

  return completedPaymentRequests.map((completedPaymentRequest) => {
    return completedPaymentRequest.completedPaymentRequestId
  })
}

module.exports = {
  getCompletedPaymentRequestIds
}
