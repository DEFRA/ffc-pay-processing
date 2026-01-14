const {
  DEFAULT_VALUE,
  PERIOD_TYPE_MAX_LENGTH,
  SCHEME_NAME_MAX_LENGTH
} = require('../../constants/metric-defaults')

function defineIdentificationColumns (DataTypes) {
  return {
    id: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      autoIncrement: true
    },
    snapshotDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      field: 'snapshot_date'
    },
    periodType: {
      type: DataTypes.STRING(PERIOD_TYPE_MAX_LENGTH),
      allowNull: false,
      field: 'period_type'
    },
    schemeName: {
      type: DataTypes.STRING(SCHEME_NAME_MAX_LENGTH),
      allowNull: true,
      field: 'scheme_name'
    },
    schemeYear: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'scheme_year'
    }
  }
}

function definePaymentStatusColumns (DataTypes) {
  return {
    totalPayments: {
      type: DataTypes.INTEGER,
      defaultValue: DEFAULT_VALUE,
      field: 'total_payments'
    },
    totalValue: {
      type: DataTypes.BIGINT,
      defaultValue: DEFAULT_VALUE,
      field: 'total_value'
    },
    pendingPayments: {
      type: DataTypes.INTEGER,
      defaultValue: DEFAULT_VALUE,
      field: 'pending_payments'
    },
    pendingValue: {
      type: DataTypes.BIGINT,
      defaultValue: DEFAULT_VALUE,
      field: 'pending_value'
    },
    processedPayments: {
      type: DataTypes.INTEGER,
      defaultValue: DEFAULT_VALUE,
      field: 'processed_payments'
    },
    processedValue: {
      type: DataTypes.BIGINT,
      defaultValue: DEFAULT_VALUE,
      field: 'processed_value'
    },
    settledPayments: {
      type: DataTypes.INTEGER,
      defaultValue: DEFAULT_VALUE,
      field: 'settled_payments'
    },
    settledValue: {
      type: DataTypes.BIGINT,
      defaultValue: DEFAULT_VALUE,
      field: 'settled_value'
    },
    paymentsOnHold: {
      type: DataTypes.INTEGER,
      defaultValue: DEFAULT_VALUE,
      field: 'payments_on_hold'
    },
    valueOnHold: {
      type: DataTypes.BIGINT,
      defaultValue: DEFAULT_VALUE,
      field: 'value_on_hold'
    }
  }
}

function defineTimestampColumns (DataTypes) {
  return {
    calculatedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      field: 'calculated_at'
    },
    dataStartDate: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'data_start_date'
    },
    dataEndDate: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'data_end_date'
    }
  }
}

function defineMetricColumns (DataTypes) {
  return {
    ...defineIdentificationColumns(DataTypes),
    ...definePaymentStatusColumns(DataTypes),
    ...defineTimestampColumns(DataTypes)
  }
}

function defineMetricOptions () {
  return {
    tableName: 'metrics',
    timestamps: false,
    indexes: [
      {
        unique: true,
        fields: ['snapshot_date', 'period_type', 'scheme_name', 'scheme_year']
      },
      {
        fields: ['snapshot_date', 'period_type']
      },
      {
        fields: ['scheme_year', 'period_type']
      }
    ]
  }
}

function metric (sequelize, DataTypes) {
  const columns = defineMetricColumns(DataTypes)
  const options = defineMetricOptions()
  return sequelize.define('metric', columns, options)
}

module.exports = metric
