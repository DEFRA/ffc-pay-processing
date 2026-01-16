const { Op } = require('sequelize')
const db = require('../app/data')
const {
  MILLISECONDS_PER_DAY,
  DAYS_PER_WEEK,
  DAYS_PER_MONTH
} = require('../app/constants/time')
const {
  FIRST_DAY_OF_MONTH,
  YEAR_START_MONTH,
  END_OF_DAY_HOUR,
  END_OF_DAY_MINUTE,
  END_OF_DAY_SECOND,
  END_OF_DAY_MILLISECOND,
  MONTH_INDEX_OFFSET,
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

const DEFAULT_YEARS_TO_CALCULATE = 3
const getSchemeNameById = (schemeId) => {
  const schemeEntry = Object.entries(schemes).find(([, id]) => id === schemeId)
  return schemeEntry ? schemeEntry[0] : null
}

const getDateRangeForAll = () => ({
  startDate: null,
  endDate: null,
  useSchemeYear: false
})

const getDateRangeForYTD = (now) => ({
  startDate: new Date(now.getFullYear(), YEAR_START_MONTH, FIRST_DAY_OF_MONTH),
  endDate: now,
  useSchemeYear: false
})

const getDateRangeForYear = () => ({
  startDate: null,
  endDate: null,
  useSchemeYear: true
})

const getDateRangeForMonthInYear = (schemeYear, month) => {
  if (!schemeYear || !month) {
    throw new Error('schemeYear and month are required for monthInYear period')
  }
  return {
    startDate: new Date(schemeYear, month - MONTH_INDEX_OFFSET, FIRST_DAY_OF_MONTH),
    endDate: new Date(schemeYear, month, 0, END_OF_DAY_HOUR, END_OF_DAY_MINUTE, END_OF_DAY_SECOND, END_OF_DAY_MILLISECOND),
    useSchemeYear: true
  }
}

const getDateRangeForRelativePeriod = (now, days) => ({
  startDate: new Date(now.getTime() - days * MILLISECONDS_PER_DAY),
  endDate: now,
  useSchemeYear: false
})

const calculateDateRange = (period, schemeYear = null, month = null) => {
  const now = new Date()

  if (period === PERIOD_ALL) {
    return getDateRangeForAll()
  }
  if (period === PERIOD_YTD) {
    return getDateRangeForYTD(now)
  }
  if (period === PERIOD_YEAR) {
    return getDateRangeForYear()
  }
  if (period === PERIOD_MONTH_IN_YEAR) {
    return getDateRangeForMonthInYear(schemeYear, month)
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

const buildWhereClauseForDateRange = (period, startDate, endDate, useSchemeYear) => {
  const whereClause = {}

  if (!useSchemeYear && startDate && endDate) {
    whereClause.received = {
      [Op.gte]: startDate,
      [Op.lt]: endDate
    }
  }

  if (period === PERIOD_MONTH_IN_YEAR && startDate && endDate) {
    whereClause.received = {
      [Op.gte]: startDate,
      [Op.lte]: endDate
    }
  }

  return whereClause
}

const buildQueryWhereClausesAndReplacements = (schemeWhereClause, useSchemeYear, schemeYear) => {
  const whereClauses = []
  const replacements = {}

  if (schemeWhereClause.received) {
    whereClauses.push(
      'pr."received" >= :startDate',
      'pr."received" < :endDate'
    )
    replacements.startDate = schemeWhereClause.received[Op.gte]
    replacements.endDate = schemeWhereClause.received[Op.lt] || schemeWhereClause.received[Op.lte]
  }

  if (useSchemeYear && schemeYear) {
    whereClauses.push('pr."marketingYear" = :schemeYear')
    replacements.schemeYear = schemeYear
  }

  return { whereClauses, replacements }
}

const buildMetricsQuery = (whereSQL) => {
  return `
    SELECT 
      pr."schemeId",
      COUNT(pr."paymentRequestId") as "totalPayments",
      COALESCE(SUM(pr."value"), 0) as "totalValue",
      
      -- Pending: no completed schedule
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
      
      -- Processed: has completed schedule
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
      
      -- Settled: has completedPaymentRequest with lastSettlement
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
    GROUP BY pr."schemeId"
  `
}

const fetchMetricsData = async (whereClause, useSchemeYear, schemeYear) => {
  const schemeWhereClause = useSchemeYear && schemeYear
    ? { ...whereClause, marketingYear: schemeYear }
    : whereClause

  const { whereClauses, replacements } = buildQueryWhereClausesAndReplacements(schemeWhereClause, useSchemeYear, schemeYear)
  const whereSQL = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : ''
  const metricsQuery = buildMetricsQuery(whereSQL)

  return db.sequelize.query(metricsQuery, {
    replacements,
    type: db.sequelize.QueryTypes.SELECT,
    raw: true
  })
}

const fetchHoldsData = async (whereClause, useSchemeYear, schemeYear) => {
  const schemeWhereClause = useSchemeYear && schemeYear
    ? { ...whereClause, marketingYear: schemeYear }
    : whereClause

  const holdsQuery = `
        SELECT 
            pr."schemeId",
            COUNT(DISTINCT pr."paymentRequestId") as "paymentsOnHold",
            COALESCE(SUM(pr."value"), 0) as "valueOnHold"
        FROM "paymentRequests" pr
        INNER JOIN "holds" h ON pr."frn" = h."frn"
        INNER JOIN "holdCategories" hc ON h."holdCategoryId" = hc."holdCategoryId"
        WHERE h."closed" IS NULL
          AND hc."schemeId" = pr."schemeId"
          ${schemeWhereClause.received ? 'AND pr."received" >= :startDate AND pr."received" < :endDate' : ''}
          ${useSchemeYear && schemeYear ? 'AND pr."marketingYear" = :schemeYear' : ''}
        GROUP BY pr."schemeId"
    `

  const replacements = {}
  if (schemeWhereClause.received) {
    replacements.startDate = schemeWhereClause.received[Op.gte]
    replacements.endDate = schemeWhereClause.received[Op.lt] || schemeWhereClause.received[Op.lte]
  }
  if (useSchemeYear && schemeYear) {
    replacements.schemeYear = schemeYear
  }

  return db.sequelize.query(holdsQuery, {
    replacements,
    type: db.sequelize.QueryTypes.SELECT,
    raw: true
  })
}

const mergeMetricsWithHolds = (metricsResults, holdsResults) => {
  const holdsMap = new Map(holdsResults.map(h => [h.schemeId, h]))

  return metricsResults.map(metric => {
    const holdData = holdsMap.get(metric.schemeId)
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

const createMetricRecord = (result, period, snapshotDate, startDate, endDate, schemeYear) => {
  const schemeName = getSchemeNameById(result.schemeId)

  return {
    snapshotDate,
    periodType: period,
    schemeName,
    schemeYear: schemeYear || null,
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

const saveMetrics = async (results, period, snapshotDate, startDate, endDate, schemeYear = null) => {
  for (const result of results) {
    const metricRecord = createMetricRecord(result, period, snapshotDate, startDate, endDate, schemeYear)
    const existing = await db.metric.findOne({
      where: {
        snapshotDate: metricRecord.snapshotDate,
        periodType: metricRecord.periodType,
        schemeName: metricRecord.schemeName,
        schemeYear: metricRecord.schemeYear
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

const calculateMetricsForPeriod = async (period, schemeYear = null, month = null) => {
  const { startDate, endDate, useSchemeYear } = calculateDateRange(period, schemeYear, month)
  const snapshotDate = new Date().toISOString().split('T')[0]
  const whereClause = buildWhereClauseForDateRange(period, startDate, endDate, useSchemeYear)
  const metricsResults = await fetchMetricsData(whereClause, useSchemeYear, schemeYear)
  const holdsResults = await fetchHoldsData(whereClause, useSchemeYear, schemeYear)
  const combinedResults = mergeMetricsWithHolds(metricsResults, holdsResults)

  await saveMetrics(combinedResults, period, snapshotDate, startDate, endDate, schemeYear)
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

const calculateHistoricalMetrics = async (currentYear, yearsToCalculate) => {
  for (let i = 0; i <= yearsToCalculate; i++) {
    const year = currentYear - i
    await calculateYearlyMetrics(year)
  }
}

const calculateAllMetrics = async () => {
  console.log('Starting metrics calculation...')

  const currentYear = new Date().getFullYear()
  const yearsToCalculate = Number.parseInt(process.env.METRICS_CALCULATION_YEARS || String(DEFAULT_YEARS_TO_CALCULATE))

  try {
    await calculateBasicPeriods()
    await calculateHistoricalMetrics(currentYear, yearsToCalculate)
    console.log('✓ All metrics calculated successfully')
  } catch (error) {
    console.error('✗ Error calculating metrics:', error)
    throw error
  }
}

module.exports = {
  calculateAllMetrics,
  calculateMetricsForPeriod
}
