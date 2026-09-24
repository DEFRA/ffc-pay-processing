const db = require('../database')

const findPaymentRequests = async (agreementNumber, frn, schemeId, usesContractNumber, transaction) => {
  const where = { agreementNumber, frn, schemeId }
  if (usesContractNumber) {
    delete where.agreementNumber
    where.contractNumber = agreementNumber
  }
  return db.paymentRequest(transaction ?? undefined)
    .select('paymentRequestId')
    .where(where)
}

module.exports = {
  findPaymentRequests
}
