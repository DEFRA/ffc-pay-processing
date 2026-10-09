const db = require('../database')

const isAgreementClosed = async (paymentRequest) => {
  // if value is non-zero, we just continue as normal - so always return false.
  if (paymentRequest.value !== 0) {
    return false
  }
  const { schemeId, frn, agreementNumber } = paymentRequest
  const currentDate = new Date()
  const agreement = (await db.frnAgreementClosed().where({ schemeId, frn, agreementNumber }).first()) ?? null
  if (agreement === null) {
    return false
  }
  if (agreement.closureDate <= currentDate) {
    console.log(`Agreement number ${agreementNumber} for scheme ID ${schemeId} under FRN ${frn} has been closed. AR will be suppressed and request editor skipped.`)
    return true
  }

  return false
}

module.exports = {
  isAgreementClosed
}
