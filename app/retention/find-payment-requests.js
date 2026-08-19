const db = require('../data')
const { MANUAL } = require('../constants/schemes')

const findPaymentRequests = async (agreementNumber, frn, schemeId, usesContractNumber, pillar, transaction) => {
  const where = { agreementNumber, frn, schemeId }
  if (usesContractNumber) {
    delete where.agreementNumber
    where.contractNumber = agreementNumber
  }
  if (schemeId === MANUAL && pillar) {
    where.pillar = pillar
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
