const db = require('../data')

const removeInvoiceLines = async (paymentRequestIds, transaction) => {
  await db.invoiceLine.destroy({
    where: { paymentRequestId: paymentRequestIds },
    transaction
  })
}

module.exports = {
  removeInvoiceLines
}
