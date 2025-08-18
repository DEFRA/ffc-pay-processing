const db = require('../../data')

const deleteInvoiceLines = async (paymentRequestIds, transaction) => {
  await db.invoiceLine.destroy({
    where: {
      paymentRequestId: {
        [db.Sequelize.Op.in]: paymentRequestIds
      }
    },
    transaction
  })
}

module.exports = {
  deleteInvoiceLines
}
