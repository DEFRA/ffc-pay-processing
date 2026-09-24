const { GBP } = require('../constants/currency')
const { BPS } = require('../constants/schemes')
const db = require('../database')

const updateSettlementStatus = async (settlement, filter) => {
  const completedPaymentRequest = await db.completedPaymentRequest()
    .where({ ...filter })
    .first()

  if (!completedPaymentRequest) {
    return undefined
  }

  if ([BPS].includes(completedPaymentRequest.schemeId) && completedPaymentRequest.marketingYear <= 2020 && settlement.currency === GBP) {
    settlement.value = completedPaymentRequest.value
  }

  await db.completedPaymentRequest()
    .where({ ...filter })
    .where(function () {
      this.whereNull('lastSettlement').orWhere('lastSettlement', '<', settlement.settlementDate)
    })
    .update({
      lastSettlement: settlement.settlementDate,
      settledValue: settlement.value
    })
  return { frn: Number.parseInt(completedPaymentRequest.frn), invoiceNumber: completedPaymentRequest.invoiceNumber }
}

module.exports = {
  updateSettlementStatus
}
