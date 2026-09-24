const db = require('../database')

const removeFRNAgreementClosed = async (agreementNumber, frn, schemeId, transaction) => {
  await db.frnAgreementClosed(transaction ?? undefined)
    .where({ agreementNumber, frn, schemeId })
    .del()
}

module.exports = {
  removeFRNAgreementClosed
}
