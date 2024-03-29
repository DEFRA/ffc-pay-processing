const { MANUAL } = require('../../constants/schemes')
const { getMap } = require('./maps')
const { getLineCodeFromDescription } = require('./get-line-code-from-description')
const { getCodesForLine } = require('./get-codes-for-line')
const { selectLineCode } = require('./select-line-code')

const mapAccountCodes = (paymentRequest) => {
  if (paymentRequest.schemeId === MANUAL) {
    return
  }

  const accountCodeMap = getMap(paymentRequest.schemeId)

  for (const invoiceLine of paymentRequest.invoiceLines) {
    const lineCode = getLineCodeFromDescription(invoiceLine.description)
    const accountCodesForLine = getCodesForLine(paymentRequest.schemeId, lineCode, invoiceLine, accountCodeMap)
    invoiceLine.accountCode = selectLineCode(accountCodesForLine, paymentRequest, invoiceLine)
  }
}

module.exports = {
  mapAccountCodes
}
