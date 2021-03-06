module.exports = (sequelize, DataTypes) => {
  const paymentRequest = sequelize.define('paymentRequest', {
    paymentRequestId: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    schemeId: DataTypes.INTEGER,
    sourceSystem: DataTypes.STRING,
    deliveryBody: DataTypes.STRING,
    invoiceNumber: DataTypes.STRING,
    frn: DataTypes.BIGINT,
    sbi: DataTypes.STRING,
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
    value: DataTypes.INTEGER,
    received: DataTypes.DATE,
    referenceId: DataTypes.UUID,
    correlationId: DataTypes.STRING
  },
  {
    tableName: 'paymentRequests',
    freezeTableName: true,
    timestamps: false
  })
  paymentRequest.associate = function (models) {
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
