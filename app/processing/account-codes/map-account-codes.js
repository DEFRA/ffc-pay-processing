const { getAccountCodeMap, getSchemeIds } = require('ffc-pay-schemes')
const { getLineCodeFromDescription } = require('./get-line-code-from-description')
const { getCodesForLine } = require('./get-codes-for-line')
const { selectLineCode } = require('./select-line-code')

const { MANUAL } = getSchemeIds()

const mapAccountCodes = (paymentRequest) => {
  if (paymentRequest.schemeId === MANUAL) {
    return
  }

  const accountCodeMap = getAccountCodeMap(paymentRequest.schemeId)

  for (const invoiceLine of paymentRequest.invoiceLines) {
    const lineCode = getLineCodeFromDescription(invoiceLine.description)
    const accountCodesForLine = getCodesForLine(paymentRequest.schemeId, lineCode, invoiceLine, accountCodeMap)
    invoiceLine.accountCode = selectLineCode(accountCodesForLine, paymentRequest, invoiceLine)
  }
}

module.exports = {
  mapAccountCodes
}
