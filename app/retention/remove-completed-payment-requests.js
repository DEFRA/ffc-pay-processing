const db = require('../data')

const removeCompletedPaymentRequests = async (completedPaymentRequestIds, transaction) => {
  await db.completedPaymentRequest.destroy({
    where: {
      completedPaymentRequestId: { [db.Sequelize.Op.in]: completedPaymentRequestIds }
    },
    transaction
  })
}

module.exports = {
  removeCompletedPaymentRequests
}
