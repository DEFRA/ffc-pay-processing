const { BPS, CS } = require('../constants/schemes')

const applyDefaultFilter = (query, paymentRequest) => {
  if (paymentRequest.paymentRequestNumber === 0) {
    query.whereNotNull('paymentRequestNumber')
  } else {
    query.where('paymentRequestNumber', '<', paymentRequest.paymentRequestNumber)
  }
  query.where({ invalid: false })
}

const getCompletedPaymentRequestsFilter = (paymentRequest) => {
  switch (paymentRequest.schemeId) {
    case BPS:
      return (query) => {
        applyDefaultFilter(query, paymentRequest)
        query.where({
          schemeId: paymentRequest.schemeId,
          frn: paymentRequest.frn,
          marketingYear: paymentRequest.marketingYear
        })
      }
    case CS:
      return (query) => {
        applyDefaultFilter(query, paymentRequest)
        query.where({
          schemeId: paymentRequest.schemeId,
          frn: paymentRequest.frn
        })
        query.where((contractQuery) => {
          contractQuery
            .where({ contractNumber: paymentRequest.contractNumber })
            .orWhereRaw('replace("contractNumber", \'A0\', \'A\') = ?', [paymentRequest.contractNumber?.replaceAll('A0', 'A')])
        })
      }
    default:
      return (query) => {
        applyDefaultFilter(query, paymentRequest)
        query.where({
          schemeId: paymentRequest.schemeId,
          frn: paymentRequest.frn,
          marketingYear: paymentRequest.marketingYear,
          agreementNumber: paymentRequest.agreementNumber
        })
      }
  }
}

module.exports = {
  getCompletedPaymentRequestsFilter
}
