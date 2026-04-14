const db = require('../data')

const findPaymentRequests = async (agreementNumber, frn, schemeId, transaction) => {
  return db.paymentRequest.findAll({
    attributes: ['paymentRequestId'],
    where: { agreementNumber, frn, schemeId },
    transaction
  })
}

module.exports = {
  findPaymentRequests
}
