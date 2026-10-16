const METRIC_COLUMNS = {
  id: 'id',
  snapshotDate: 'snapshot_date',
  periodType: 'period_type',
  schemeName: 'scheme_name',
  schemeYear: 'scheme_year',
  monthInYear: 'month_in_year',
  totalPayments: 'total_payments',
  totalValue: 'total_value',
  pendingPayments: 'pending_payments',
  pendingValue: 'pending_value',
  processedPayments: 'processed_payments',
  processedValue: 'processed_value',
  settledPayments: 'settled_payments',
  settledValue: 'settled_value',
  paymentsOnHold: 'payments_on_hold',
  valueOnHold: 'value_on_hold',
  calculatedAt: 'calculated_at',
  dataStartDate: 'data_start_date',
  dataEndDate: 'data_end_date'
}

const toMetricColumns = (values) => {
  return Object.fromEntries(
    Object.entries(values)
      .filter(([key]) => METRIC_COLUMNS[key])
      .map(([key, value]) => [METRIC_COLUMNS[key], value])
  )
}

module.exports = {
  METRIC_COLUMNS,
  toMetricColumns
}
