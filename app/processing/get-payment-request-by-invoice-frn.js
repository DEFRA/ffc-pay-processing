const db = require('../data')

const getPaymentRequestByInvoiceAndFrn = async (invoiceNumber, frn) => {
  return db.completedPaymentRequest.findOne({
    where: { invoiceNumber, frn },
    include: [{ model: db.completedInvoiceLine, as: 'invoiceLines' }],
    raw: false
  })
}

module.exports = {
  getPaymentRequestByInvoiceAndFrn
}
