const db = require('../data')

const removeCompletedInvoiceLines = async (completedPaymentRequestIds, transaction) => {
  await db.completedInvoiceLine.destroy({
    where: {
      completedPaymentRequestId: { [db.Sequelize.Op.in]: completedPaymentRequestIds }
    },
    transaction
  })
}

module.exports = {
  removeCompletedInvoiceLines
}
