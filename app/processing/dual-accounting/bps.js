const { DOM00, DOM01, DOM10 } = require('../../constants/domestic-fund-codes')
const { getPreviousDomesticFund } = require('./get-previous-domestic-fund')
const { selectDomesticFundCode } = require('./select-domestic-fund-code')

const applyBPSDualAccounting = (paymentRequest, previousPaymentRequests) => {
  const previousFundCode = getPreviousDomesticFund(previousPaymentRequests)
  for (const invoiceLine of paymentRequest.invoiceLines) {
    if (paymentRequest.marketingYear >= 2020) {
      invoiceLine.fundCode = DOM10
    } else {
      invoiceLine.fundCode = selectDomesticFundCode(previousPaymentRequests, DOM00, previousFundCode, DOM01)
    }
  }
  return paymentRequest
}

module.exports = {
  applyBPSDualAccounting
}
