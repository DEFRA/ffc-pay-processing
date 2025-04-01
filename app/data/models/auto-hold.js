module.exports = (sequelize, DataTypes) => {
  const autoHold = sequelize.define('autoHold', {
    autoHoldId: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    autoHoldCategoryId: DataTypes.INTEGER,
    frn: DataTypes.BIGINT,
    marketingYear: DataTypes.INTEGER,
    agreementNumber: DataTypes.STRING,
    contractNumber: DataTypes.STRING,
    added: DataTypes.DATE,
    closed: DataTypes.DATE
  },
  {
    tableName: 'autoHolds',
    freezeTableName: true,
    timestamps: false
  })
  autoHold.associate = (models) => {
    autoHold.belongsTo(models.autoHoldCategory, {
      foreignKey: 'autoHoldCategoryId',
      as: 'autoHoldCategory'
    })
  }
  return autoHold
}
