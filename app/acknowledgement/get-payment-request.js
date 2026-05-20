const db = require('../data')

const getPaymentRequest = async (invoiceNumber) => {
  return db.completedPaymentRequest.findOne({
    where: { invoiceNumber },
    include: [{ model: db.completedInvoiceLine, as: 'invoiceLines' }],
    raw: false
  })
}

module.exports = {
  getPaymentRequest
}
