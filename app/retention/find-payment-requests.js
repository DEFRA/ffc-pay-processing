const db = require('../data')

const findPaymentRequests = async (agreementNumber, frn, schemeId, usesContractNumber, transaction) => {
  const where = { agreementNumber, frn, schemeId }
  if (usesContractNumber) {
    delete where.agreementNumber
    where.contractNumber = agreementNumber
  }
  return db.paymentRequest.findAll({
    attributes: ['paymentRequestId'],
    where,
    transaction
  })
}

module.exports = {
  findPaymentRequests
}
