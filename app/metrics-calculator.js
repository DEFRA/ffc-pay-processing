const { Op } = require('sequelize')
const db = require('../app/data')
const {
  MILLISECONDS_PER_DAY,
  DAYS_PER_WEEK,
  DAYS_PER_MONTH
} = require('../app/constants/time')
const {
  FIRST_DAY_OF_MONTH,
  END_OF_DAY_HOUR,
  END_OF_DAY_MINUTE,
  END_OF_DAY_SECOND,
  END_OF_DAY_MILLISECOND,
  MONTHS_PER_YEAR
} = require('../app/constants/date')
const {
  PERIOD_ALL,
  PERIOD_YTD,
  PERIOD_YEAR,
  PERIOD_MONTH_IN_YEAR,
  PERIOD_MONTH,
  PERIOD_WEEK,
  PERIOD_DAY
} = require('../app/constants/periods')
const schemes = require('../app/constants/schemes')

const getSchemeNameById = (schemeId) => {
  const schemeEntry = Object.entries(schemes).find(([, id]) => id === schemeId)
  return schemeEntry ? schemeEntry[0] : null
}

const getDateRangeForAll = () => ({
  startDate: null,
  endDate: null
})

const getDateRangeForYTD = (now) => ({
  startDate: new Date(now.getFullYear(), 0, FIRST_DAY_OF_MONTH),
  endDate: now
})

const getDateRangeForYear = (year) => ({
  startDate: new Date(year, 0, 1),
  endDate: new Date(year + 1, 0, 1),
  year
})

const getDateRangeForMonthInYear = (year, month) => ({
  startDate: new Date(year, month - 1, 1),
  endDate: new Date(year, month, 1, END_OF_DAY_HOUR, END_OF_DAY_MINUTE, END_OF_DAY_SECOND, END_OF_DAY_MILLISECOND),
  year,
  month
})

const getDateRangeForRelativePeriod = (now, days) => ({
  startDate: new Date(now.getTime() - days * MILLISECONDS_PER_DAY),
  endDate: now
})

const calculateDateRange = (period, year = null, month = null) => {
  const now = new Date()
  if (period === PERIOD_ALL) {
    return getDateRangeForAll()
  }
  if (period === PERIOD_YTD) {
    return getDateRangeForYTD(now)
  }
  if (period === PERIOD_YEAR) {
    if (!year) throw new Error('Year is required for yearly metrics')
    return getDateRangeForYear(year)
  }
  if (period === PERIOD_MONTH_IN_YEAR) {
    if (!year || !month) throw new Error('Year and month are required for monthInYear metrics')
    return getDateRangeForMonthInYear(year, month)
  }
  if (period === PERIOD_MONTH) {
    return getDateRangeForRelativePeriod(now, DAYS_PER_MONTH)
  }
  if (period === PERIOD_WEEK) {
    return getDateRangeForRelativePeriod(now, DAYS_PER_WEEK)
  }
  if (period === PERIOD_DAY) {
    return getDateRangeForRelativePeriod(now, 1)
  }
  throw new Error(`Unknown period type: ${period}`)
}

const buildWhereClauseForDateRange = (startDate, endDate) => {
  const whereClause = {}
  if (startDate && endDate) {
    whereClause.received = {
      [Op.gte]: startDate,
      [Op.lt]: endDate
    }
  }
  return whereClause
}

const buildQueryWhereClausesAndReplacements = (schemeWhereClause) => {
  const whereClauses = []
  const replacements = {}
  if (schemeWhereClause.received) {
    whereClauses.push(
      'pr."received" >= :startDate',
      'pr."received" < :endDate'
    )
    replacements.startDate = schemeWhereClause.received[Op.gte]
    replacements.endDate = schemeWhereClause.received[Op.lt]
  }
  return { whereClauses, replacements }
}

const buildMetricsQuery = (whereSQL, groupByYearMonth = true) => {
  return `
    SELECT 
      ${groupByYearMonth ? 'EXTRACT(YEAR FROM pr."received") AS "year",' : ''}
      ${groupByYearMonth ? 'EXTRACT(MONTH FROM pr."received") AS "month",' : ''}
      pr."schemeId",
      COUNT(pr."paymentRequestId") as "totalPayments",
      COALESCE(SUM(pr."value"), 0) as "totalValue",
      COUNT(CASE WHEN NOT EXISTS (
        SELECT 1 FROM schedule s 
        WHERE s."paymentRequestId" = pr."paymentRequestId" 
        AND s."completed" IS NOT NULL
      ) THEN 1 END) as "pendingPayments",
      COALESCE(SUM(CASE WHEN NOT EXISTS (
        SELECT 1 FROM schedule s 
        WHERE s."paymentRequestId" = pr."paymentRequestId" 
        AND s."completed" IS NOT NULL
      ) THEN pr."value" ELSE 0 END), 0) as "pendingValue",
      COUNT(CASE WHEN EXISTS (
        SELECT 1 FROM schedule s 
        WHERE s."paymentRequestId" = pr."paymentRequestId" 
        AND s."completed" IS NOT NULL
      ) THEN 1 END) as "processedPayments",
      COALESCE(SUM(CASE WHEN EXISTS (
        SELECT 1 FROM schedule s 
        WHERE s."paymentRequestId" = pr."paymentRequestId" 
        AND s."completed" IS NOT NULL
      ) THEN pr."value" ELSE 0 END), 0) as "processedValue",
      COUNT(CASE WHEN EXISTS (
        SELECT 1 FROM "completedPaymentRequests" cpr 
        WHERE cpr."paymentRequestId" = pr."paymentRequestId" 
        AND cpr."invalid" = false
        AND cpr."lastSettlement" IS NOT NULL
      ) THEN 1 END) as "settledPayments",
      COALESCE(SUM(CASE WHEN EXISTS (
        SELECT 1 FROM "completedPaymentRequests" cpr 
        WHERE cpr."paymentRequestId" = pr."paymentRequestId" 
        AND cpr."invalid" = false
        AND cpr."lastSettlement" IS NOT NULL
      ) THEN (
        SELECT cpr2."settledValue" 
        FROM "completedPaymentRequests" cpr2 
        WHERE cpr2."paymentRequestId" = pr."paymentRequestId" 
        AND cpr2."invalid" = false
        AND cpr2."lastSettlement" IS NOT NULL
        LIMIT 1
      ) ELSE 0 END), 0) as "settledValue"
    FROM "paymentRequests" pr
    ${whereSQL}
    GROUP BY ${groupByYearMonth ? '"year", "month", ' : ''}pr."schemeId"
  `
}

const fetchMetricsData = async (whereClause, year = null, month = null, period = null) => {
  const schemeWhereClause = whereClause
  const { whereClauses, replacements } = buildQueryWhereClausesAndReplacements(schemeWhereClause)
  const whereSQL = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : ''
  let groupByYearMonth = true
  if (period === PERIOD_ALL) {
    groupByYearMonth = false
  }
  const metricsQuery = buildMetricsQuery(whereSQL, groupByYearMonth)
  return db.sequelize.query(metricsQuery, {
    replacements,
    type: db.sequelize.QueryTypes.SELECT,
    raw: true
  })
}

const fetchHoldsData = async (whereClause) => {
  const schemeWhereClause = whereClause
  const holdsQuery = `
        SELECT 
            EXTRACT(YEAR FROM pr."received") AS "year",
            EXTRACT(MONTH FROM pr."received") AS "month",
            pr."schemeId",
            COUNT(DISTINCT pr."paymentRequestId") as "paymentsOnHold",
            COALESCE(SUM(pr."value"), 0) as "valueOnHold"
        FROM "paymentRequests" pr
        INNER JOIN "holds" h ON pr."frn" = h."frn"
        INNER JOIN "holdCategories" hc ON h."holdCategoryId" = hc."holdCategoryId"
        WHERE h."closed" IS NULL
          AND hc."schemeId" = pr."schemeId"
          ${schemeWhereClause.received ? 'AND pr."received" >= :startDate AND pr."received" < :endDate' : ''}
        GROUP BY "year", "month", pr."schemeId"
    `
  const replacements = {}
  if (schemeWhereClause.received) {
    replacements.startDate = schemeWhereClause.received[Op.gte]
    replacements.endDate = schemeWhereClause.received[Op.lt]
  }
  return db.sequelize.query(holdsQuery, {
    replacements,
    type: db.sequelize.QueryTypes.SELECT,
    raw: true
  })
}

const mergeMetricsWithHolds = (metricsResults, holdsResults) => {
  const holdsMap = new Map(holdsResults.map(h => [h.schemeId + '-' + h.year + '-' + h.month, h]))
  return metricsResults.map(metric => {
    const key = metric.schemeId + '-' + metric.year + '-' + metric.month
    const holdData = holdsMap.get(key)
    return {
      ...metric,
      paymentsOnHold: holdData ? Number.parseInt(holdData.paymentsOnHold) : 0,
      valueOnHold: holdData ? Number.parseInt(holdData.valueOnHold) : 0
    }
  })
}

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
        snapshotDate: metricRecord.snapshotDate,
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

const calculateMetricsForPeriod = async (period, year = null, month = null) => {
  const { startDate, endDate } = calculateDateRange(period, year, month)
  const snapshotDate = new Date().toISOString().split('T')[0]
  const whereClause = buildWhereClauseForDateRange(startDate, endDate)
  const metricsResults = await fetchMetricsData(whereClause, year, month, period)
  const holdsResults = await fetchHoldsData(whereClause)
  const combinedResults = mergeMetricsWithHolds(metricsResults, holdsResults)
  const monthInYear = period === PERIOD_MONTH_IN_YEAR ? month : null
  await saveMetrics(combinedResults, period, snapshotDate, startDate, endDate, year, monthInYear)
}

const calculateBasicPeriods = async () => {
  const periods = [PERIOD_ALL, PERIOD_YTD, PERIOD_MONTH, PERIOD_WEEK, PERIOD_DAY]
  for (const period of periods) {
    await calculateMetricsForPeriod(period)
  }
}

const calculateYearlyMetrics = async (year) => {
  await calculateMetricsForPeriod(PERIOD_YEAR, year)
  for (let month = 1; month <= MONTHS_PER_YEAR; month++) {
    await calculateMetricsForPeriod(PERIOD_MONTH_IN_YEAR, year, month)
  }
}

const calculateAllMetrics = async () => {
  console.log('Starting metrics calculation...')
  try {
    await calculateBasicPeriods()
    const years = await db.sequelize.query(
      'SELECT DISTINCT EXTRACT(YEAR FROM "received") AS year FROM "paymentRequests" ORDER BY year DESC',
      { type: db.sequelize.QueryTypes.SELECT }
    )
    for (const { year } of years) {
      if (year) {
        await calculateYearlyMetrics(Number(year))
      }
    }
    console.log('✓ All metrics calculated successfully')
  } catch (error) {
    console.error('✗ Error calculating metrics:', error)
    throw error
  }
}

module.exports = {
  calculateAllMetrics,
  calculateMetricsForPeriod,
  calculateDateRange,
  createMetricRecord,
  saveMetrics,
  getSchemeNameById,
  buildWhereClauseForDateRange,
  buildQueryWhereClausesAndReplacements,
  buildMetricsQuery,
  fetchMetricsData,
  fetchHoldsData,
  mergeMetricsWithHolds,
  parseIntOrZero,
  calculateBasicPeriods,
  calculateYearlyMetrics
}
