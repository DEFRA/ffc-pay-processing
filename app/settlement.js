const db = require('./data')

const updateSettlementStatus = async (returnData) => {
  if (returnData.settled) {
    await db.completedPaymentRequest.update({ lastSettlement: returnData.settlementDate, settledValue: db.Sequelize.literal(`COALESCE("settledValue", 0) + ${returnData.value}`) }, { where: { invoiceNumber: returnData.invoiceNumber } })
  }
  // TODO: if not settled assume BACS rejection.  To be confirmed and handled.
}

module.exports = updateSettlementStatus
