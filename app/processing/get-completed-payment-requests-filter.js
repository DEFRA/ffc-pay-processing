const db = require('../data')
const { BPS, CS } = require('../constants/schemes')

const getCompletedPaymentRequestsFilter = (paymentRequest) => {
  const defaultFilter = {
    paymentRequestNumber: paymentRequest.paymentRequestNumber === 0
      ? { [db.Sequelize.Op.not]: null }
      : { [db.Sequelize.Op.lt]: paymentRequest.paymentRequestNumber },
    invalid: false
  }
  switch (paymentRequest.schemeId) {
    case BPS:
      return {
        ...defaultFilter,
        schemeId: paymentRequest.schemeId,
        frn: paymentRequest.frn,
        marketingYear: paymentRequest.marketingYear
      }
    case CS:
      return {
        ...defaultFilter,
        schemeId: paymentRequest.schemeId,
        frn: paymentRequest.frn,
        [db.Sequelize.Op.or]: [
          { contractNumber: paymentRequest.contractNumber },
          db.Sequelize.where(db.Sequelize.fn('replace', db.Sequelize.col('contractNumber'), 'A0', 'A'), paymentRequest.contractNumber?.replace('A0', 'A'))
        ]
      }
    default:
      return {
        ...defaultFilter,
        schemeId: paymentRequest.schemeId,
        frn: paymentRequest.frn,
        marketingYear: paymentRequest.marketingYear,
        agreementNumber: paymentRequest.agreementNumber
      }
  }
}

module.exports = {
  getCompletedPaymentRequestsFilter
}
