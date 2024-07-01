module.exports = (sequelize, DataTypes) => {
  const paymentRequest = sequelize.define('paymentRequest', {
    paymentRequestId: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    schemeId: DataTypes.INTEGER,
    sourceSystem: DataTypes.STRING,
    batch: DataTypes.STRING,
    deliveryBody: DataTypes.STRING,
    invoiceNumber: DataTypes.STRING,
    frn: DataTypes.BIGINT,
    sbi: DataTypes.INTEGER,
    vendor: DataTypes.STRING,
    trader: DataTypes.STRING,
    ledger: DataTypes.STRING,
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
    received: DataTypes.DATE,
    referenceId: DataTypes.UUID,
    correlationId: DataTypes.UUID,
    paymentType: DataTypes.INTEGER,
    pillar: DataTypes.STRING,
    exchangeRate: DataTypes.STRING,
    eventDate: DataTypes.STRING,
    claimDate: DataTypes.STRING,
    sentToTracking: DataTypes.BOOLEAN
  },
  {
    tableName: 'paymentRequests',
    freezeTableName: true,
    timestamps: false
  })
  paymentRequest.associate = (models) => {
    paymentRequest.belongsTo(models.scheme, {
      foreignKey: 'schemeId',
      as: 'scheme'
    })
    paymentRequest.hasMany(models.invoiceLine, {
      foreignKey: 'paymentRequestId',
      as: 'invoiceLines'
    })
    paymentRequest.hasMany(models.schedule, {
      foreignKey: 'paymentRequestId',
      as: 'schedules'
    })
    paymentRequest.hasMany(models.completedPaymentRequest, {
      foreignKey: 'paymentRequestId',
      as: 'completedPaymentRequests'
    })
  }
  return paymentRequest
}
