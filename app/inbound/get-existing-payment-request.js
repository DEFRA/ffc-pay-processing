const db = require('../data')

const getExistingPaymentRequest = async (invoiceNumber, transaction) => {
  return db.paymentRequest.findOne({
    attributes: ['paymentRequestId', 'invoiceNumber', 'referenceId'],
    transaction,
    where: {
      invoiceNumber
    }
  })
}

module.exports = {
  getExistingPaymentRequest
}
