const { getSchemeIds, getSourceSystems } = require('ffc-pay-schemes')

const { ES, FC, IMPS } = getSchemeIds()
const { ES: ES_SOURCE, FC: FC_SOURCE, IMPS: IMPS_SOURCE } = getSourceSystems()

const getSettlementFilter = (settlement) => {
  switch (settlement.sourceSystem) {
    case ES_SOURCE:
      return {
        schemeId: ES,
        agreementNumber: settlement.transactionNumber
      }
    case FC_SOURCE:
      return {
        schemeId: FC,
        frn: settlement.frn,
        contractNumber: settlement.claimNumber,
        agreementNumber: settlement.agreementNumber
      }
    case IMPS_SOURCE:
      return {
        schemeId: IMPS,
        invoiceNumber: settlement.transactionNumber
      }
    default:
      return {
        invoiceNumber: settlement.invoiceNumber
      }
  }
}

module.exports = {
  getSettlementFilter
}
