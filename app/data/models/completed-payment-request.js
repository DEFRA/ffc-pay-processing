module.exports = (sequelize, DataTypes) => {
  const completedPaymentRequest = sequelize.define('completedPaymentRequest', {
    completedPaymentRequestId: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    paymentRequestId: DataTypes.INTEGER,
    schemeId: DataTypes.INTEGER,
    batch: DataTypes.STRING,
    ledger: DataTypes.STRING,
    sourceSystem: DataTypes.STRING,
    deliveryBody: DataTypes.STRING,
    invoiceNumber: DataTypes.STRING,
    frn: DataTypes.BIGINT,
    sbi: DataTypes.INTEGER,
    vendor: DataTypes.STRING,
    trader: DataTypes.STRING,
    marketingYear: DataTypes.INTEGER,
    agreementNumber: DataTypes.STRING,
    contractNumber: DataTypes.STRING,
    paymentRequestNumber: DataTypes.INTEGER,
    currency: DataTypes.STRING,
    schedule: DataTypes.STRING,
    dueDate: DataTypes.STRING,
    debtType: DataTypes.STRING,
    recoveryDate: DataTypes.STRING,
    originalSettlementDate: DataTypes.STRING,
    originalInvoiceNumber: DataTypes.STRING,
    invoiceCorrectionReference: DataTypes.STRING,
    value: DataTypes.INTEGER,
    submitted: DataTypes.DATE,
    acknowledged: DataTypes.DATE,
    lastSettlement: DataTypes.DATE,
    settledValue: DataTypes.INTEGER,
    invalid: { type: DataTypes.BOOLEAN, defaultValue: false },
    referenceId: DataTypes.UUID,
    correlationId: DataTypes.UUID,
    paymentType: DataTypes.INTEGER,
    pillar: DataTypes.STRING,
    exchangeRate: DataTypes.STRING,
    eventDate: DataTypes.STRING,
    claimDate: DataTypes.STRING,
    fesCode: DataTypes.STRING,
    annualValue: DataTypes.DECIMAL,
    remmittanceDescription: DataTypes.STRING
  },
  {
    tableName: 'completedPaymentRequests',
    freezeTableName: true,
    timestamps: false
  })
  completedPaymentRequest.associate = (models) => {
    completedPaymentRequest.belongsTo(models.paymentRequest, {
      foreignKey: 'paymentRequestId',
      as: 'paymentRequest'
    })
    completedPaymentRequest.hasMany(models.completedInvoiceLine, {
      foreignKey: 'completedPaymentRequestId',
      as: 'invoiceLines'
    })
    completedPaymentRequest.belongsTo(models.schedule, {
      foreignKey: 'schemeId',
      as: 'scheme'
    })
  }
  return completedPaymentRequest
}
