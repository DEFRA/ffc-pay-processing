const db = require('../data')

const getPaymentRequestByInvoiceAndFrn = async (invoiceNumber, frn) => {
  const paymentRequest = await db.completedPaymentRequest.findOne({
    where: { invoiceNumber, frn },
    include: [{ model: db.completedInvoiceLine, as: 'invoiceLines' }],
    raw: false
  })

  return paymentRequest?.get({ plain: true })
}

module.exports = {
  getPaymentRequestByInvoiceAndFrn
}
