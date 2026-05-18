const db = require('../data')

const removeFRNAgreementClosed = async (agreementNumber, frn, schemeId, transaction) => {
  await db.frnAgreementClosed.destroy({
    where: { agreementNumber, frn, schemeId },
    transaction
  })
}

module.exports = {
  removeFRNAgreementClosed
}
