const db = require('../data')

const removeOutbox = async (completedPaymentRequestIds, transaction) => {
  await db.outbox.destroy({
    where: { completedPaymentRequestId: completedPaymentRequestIds },
    transaction
  })
}

module.exports = {
  removeOutbox
}
