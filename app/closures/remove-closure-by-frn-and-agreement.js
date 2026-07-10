const db = require('../data')

const removeClosureByFRNAndAgreement = async (frn, agreementNumber) => {
  await db.frnAgreementClosed.destroy({ where: { frn, agreementNumber } })
}

module.exports = {
  removeClosureByFRNAndAgreement
}
