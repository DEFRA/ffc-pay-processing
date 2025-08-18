const db = require('../../data')

const deletePaymentRequests = async (paymentRequestIds, transaction) => {
  await db.paymentRequest.destroy({
    where: {
      paymentRequestId: {
        [db.Sequelize.Op.in]: paymentRequestIds
      }
    },
    transaction
  })
}

module.exports = {
  deletePaymentRequests
}
