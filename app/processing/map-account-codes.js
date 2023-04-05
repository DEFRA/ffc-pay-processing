const db = require('../data')
const { ADMINISTRATIVE } = require('../constants/debt-types')
const { AP } = require('../constants/ledgers')
const { CS, MANUAL_INVOICE } = require('../constants/schemes')

const mapAccountCodes = async (paymentRequest) => {
  // CS AP account codes are already included in the payment request.  No action needed until we support CS adjustments.
  // Manual Invoice account code do not require mapping.
  if (paymentRequest.schemeId === CS || paymentRequest.schemeId === MANUAL_INVOICE) {
    return
  }
  for (const invoiceLine of paymentRequest.invoiceLines) {
    const accountCodesForLineDescription = await db.accountCode.findOne({
      where: {
        schemeId: paymentRequest.schemeId,
        lineDescription: invoiceLine.description
      }
    })

    invoiceLine.accountCode = selectAccountCodeForLine(accountCodesForLineDescription, paymentRequest.ledger, paymentRequest.debtType)
  }
}

const selectAccountCodeForLine = (accountCodes, ledger, debtType) => {
  if (ledger === AP) {
    return accountCodes.accountCodeAP
  }
  return debtType === ADMINISTRATIVE ? accountCodes.accountCodeARAdm : accountCodes.accountCodeARIrr
}

module.exports = mapAccountCodes
