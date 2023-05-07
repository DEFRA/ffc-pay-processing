const { MANUAL } = require('../../constants/schemes')
const { getMap } = require('./maps')
const { selectLineCode } = require('./select-line-code')
const { getLineCode } = require('./get-line-code')
const { getCodesForLine } = require('./get-codes-for-line')

const mapAccountCodes = async (paymentRequest) => {
  if (paymentRequest.schemeId === MANUAL) {
    return
  }

  const accountCodeMap = getMap(paymentRequest.schemeId)

  for (const invoiceLine of paymentRequest.invoiceLines) {
    const lineCode = getLineCode(invoiceLine.description)
    const accountCodesForLine = getCodesForLine(paymentRequest.schemeId, lineCode, invoiceLine.schemeCode, accountCodeMap)
    invoiceLine.accountCode = selectLineCode(accountCodesForLine, paymentRequest.ledger, paymentRequest.debtType)
  }
}

module.exports = {
  mapAccountCodes
}
