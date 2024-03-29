module.exports = (sequelize, DataTypes) => {
  const invoiceLine = sequelize.define('invoiceLine', {
    invoiceLineId: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    paymentRequestId: DataTypes.INTEGER,
    schemeCode: DataTypes.STRING,
    accountCode: DataTypes.STRING,
    fundCode: DataTypes.STRING,
    agreementNumber: DataTypes.STRING,
    description: DataTypes.STRING,
    value: DataTypes.INTEGER,
    convergence: DataTypes.BOOLEAN,
    deliveryBody: DataTypes.STRING,
    marketingYear: DataTypes.INTEGER,
    stateAid: DataTypes.BOOLEAN,
    invalid: DataTypes.BOOLEAN
  },
  {
    tableName: 'invoiceLines',
    freezeTableName: true,
    timestamps: false
  })
  invoiceLine.associate = (models) => {
    invoiceLine.belongsTo(models.paymentRequest, {
      foreignKey: 'paymentRequestId',
      as: 'paymentRequest'
    })
  }
  return invoiceLine
}
