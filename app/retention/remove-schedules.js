const db = require('../data')

const removeSchedules = async (paymentRequestIds, transaction) => {
  await db.schedule.destroy({
    where: {
      paymentRequestId: { [db.Sequelize.Op.in]: paymentRequestIds }
    },
    transaction
  })
}

module.exports = {
  removeSchedules
}
