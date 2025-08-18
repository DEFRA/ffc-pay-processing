const db = require('../../data')

const deleteCompletedInvoiceLines = async (completedPaymentRequestIds, transaction) => {
  await db.completedInvoiceLine.destroy({
    where: {
      completedPaymentRequestId: {
        [db.Sequelize.Op.in]: completedPaymentRequestIds
      }
    },
    transaction
  })
}

module.exports = {
  deleteCompletedInvoiceLines
}
