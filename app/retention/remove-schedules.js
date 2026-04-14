const db = require('../data')

const removeSchedules = async (paymentRequestIds, transaction) => {
  await db.schedule.destroy({
    where: { paymentRequestId: paymentRequestIds },
    transaction
  })
}

module.exports = {
  removeSchedules
}
