const db = require('../data')

const removeInvoiceLines = async (paymentRequestIds, transaction) => {
  await db.invoiceLine.destroy({
    where: {
      paymentRequestId: { [db.Sequelize.Op.in]: paymentRequestIds }
    },
    transaction
  })
}

module.exports = {
  removeInvoiceLines
}
