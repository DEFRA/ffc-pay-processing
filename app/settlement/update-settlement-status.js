const { GBP } = require('../constants/currency')
const { BPS } = require('../constants/schemes')
const db = require('../data')

const updateSettlementStatus = async (settlement, filter) => {
  const completedPaymentRequest = await db.completedPaymentRequest.findOne({
    where: {
      ...filter
    }
  })

  if (!completedPaymentRequest) {
    return undefined
  }

  if ([BPS].includes(completedPaymentRequest.schemeId) && completedPaymentRequest.marketingYear <= 2020 && settlement.currency === GBP) {
    settlement.value = completedPaymentRequest.value
  }

  await db.completedPaymentRequest.update({
    lastSettlement: settlement.settlementDate,
    settledValue: settlement.value
  }, {
    where: {
      ...filter,
      [db.Sequelize.Op.or]:
        [{
          lastSettlement: {
            [db.Sequelize.Op.is]: null
          }
        }, {
          lastSettlement: {
            [db.Sequelize.Op.lt]: settlement.settlementDate
          }
        }]
    }
  })
  return { frn: parseInt(completedPaymentRequest.frn), invoiceNumber: completedPaymentRequest.invoiceNumber }
}

module.exports = {
  updateSettlementStatus
}
