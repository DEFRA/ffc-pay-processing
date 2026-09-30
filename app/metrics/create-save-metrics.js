const { getSchemeNameFromSchemeId } = require('ffc-pay-schemes')
const db = require('../../app/database')
const { toMetricColumns } = require('./metric-columns')

const parseIntOrZero = (value) => {
  return Number.parseInt(value) || 0
}

const createMetricRecord = (result, period, snapshotDate, startDate, endDate, year, month = null) => {
  const schemeName = getSchemeNameFromSchemeId(result.schemeId)
  return {
    snapshotDate,
    periodType: period,
    schemeName,
    schemeYear: year || null,
    monthInYear: month || null,
    totalPayments: parseIntOrZero(result.totalPayments),
    totalValue: parseIntOrZero(result.totalValue),
    pendingPayments: parseIntOrZero(result.pendingPayments),
    pendingValue: parseIntOrZero(result.pendingValue),
    processedPayments: parseIntOrZero(result.processedPayments),
    processedValue: parseIntOrZero(result.processedValue),
    settledPayments: parseIntOrZero(result.settledPayments),
    settledValue: parseIntOrZero(result.settledValue),
    paymentsOnHold: parseIntOrZero(result.paymentsOnHold),
    valueOnHold: parseIntOrZero(result.valueOnHold),
    dataStartDate: startDate,
    dataEndDate: endDate
  }
}

const saveMetrics = async (results, period, snapshotDate, startDate, endDate, year = null, month = null) => {
  await Promise.all(results.map(async (result) => {
    const metricRecord = createMetricRecord(result, period, snapshotDate, startDate, endDate, year, month)

    const existing = await db.metric()
      .select('id')
      .where(toMetricColumns({
        periodType: metricRecord.periodType,
        schemeName: metricRecord.schemeName,
        schemeYear: metricRecord.schemeYear,
        monthInYear: metricRecord.monthInYear
      }))
      .first()
    if (existing) {
      await db.metric().where({ id: existing.id }).update(toMetricColumns(metricRecord))
    } else {
      await db.metric().insert(toMetricColumns(metricRecord))
    }
  }))
}

module.exports = {
  parseIntOrZero,
  createMetricRecord,
  saveMetrics
}
