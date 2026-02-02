const db = require('../../app/data')
const { getSchemeNameById } = require('./get-metrics-data')

const parseIntOrZero = (value) => {
  return Number.parseInt(value) || 0
}

const createMetricRecord = (result, period, snapshotDate, startDate, endDate, year, month = null) => {
  const schemeName = getSchemeNameById(result.schemeId)
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
  for (const result of results) {
    const metricRecord = createMetricRecord(result, period, snapshotDate, startDate, endDate, year, month)

    const existing = await db.metric.findOne({
      where: {
        periodType: metricRecord.periodType,
        schemeName: metricRecord.schemeName,
        schemeYear: metricRecord.schemeYear,
        monthInYear: metricRecord.monthInYear
      }
    })
    if (existing) {
      await db.metric.update(metricRecord, {
        where: {
          id: existing.id
        }
      })
    } else {
      await db.metric.create(metricRecord)
    }
  }
}

module.exports = {
  parseIntOrZero,
  createMetricRecord,
  saveMetrics
}
