const db = require('../../data')

const deleteOutbox = async (completedPaymentRequestIds, transaction) => {
  await db.outbox.destroy({
    where: {
      completedPaymentRequestId: {
        [db.Sequelize.Op.in]: completedPaymentRequestIds
      }
    },
    transaction
  })
}

module.exports = {
  deleteOutbox
}
