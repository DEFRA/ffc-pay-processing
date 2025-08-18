const db = require('../data')

const getPaymentRequestIdsByAgreement = async (schemeId, frn, agreementNumber, transaction) => {
  const paymentRequests = db.paymentRequest.findAll({
    where: {
      schemeId,
      frn,
      agreementNumber
    },
    attributes: ['paymentRequestId'],
    transaction
  })

  return paymentRequests.map((paymentRequest) => {
    return paymentRequest.paymentRequestId
  })
}

module.exports = {
  getPaymentRequestIdsByAgreement
}
