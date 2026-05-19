const db = require('../data')

const removeOutbox = async (completedPaymentRequestIds, transaction) => {
  await db.outbox.destroy({
    where: {
      completedPaymentRequestId: { [db.Sequelize.Op.in]: completedPaymentRequestIds }
    },
    transaction
  })
}

module.exports = {
  removeOutbox
}
