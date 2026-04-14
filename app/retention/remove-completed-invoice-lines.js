const db = require('../data')

const removeCompletedInvoiceLines = async (completedPaymentRequestIds, transaction) => {
  await db.completedInvoiceLine.destroy({
    where: { completedPaymentRequestId: completedPaymentRequestIds },
    transaction
  })
}

module.exports = {
  removeCompletedInvoiceLines
}
