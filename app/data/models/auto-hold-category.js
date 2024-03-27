module.exports = (sequelize, DataTypes) => {
  const autoHoldCategory = sequelize.define('autoHoldCategory', {
    autoHoldCategoryId: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    schemeId: DataTypes.INTEGER,
    name: DataTypes.STRING
  },
  {
    tableName: 'autoHoldCategories',
    freezeTableName: true,
    timestamps: false
  })
  autoHoldCategory.associate = (models) => {
    autoHoldCategory.belongsTo(models.scheme, {
      foreignKey: 'schemeId',
      as: 'scheme'
    })
    autoHoldCategory.hasMany(models.autoHold, {
      foreignKey: 'autoHoldCategoryId',
      as: 'autoHolds'
    })
  }
  return autoHoldCategory
}
