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

  switch (period) {
    case PERIOD_ALL:
      return getDateRangeForAll()
    case PERIOD_YTD:
      return getDateRangeForYTD(now)
    case PERIOD_YEAR:
      return getDateRangeForYear()
    case PERIOD_MONTH_IN_YEAR:
      return getDateRangeForMonthInYear(schemeYear, month)
    case PERIOD_MONTH:
      return getDateRangeForRelativePeriod(now, DAYS_PER_MONTH)
    case PERIOD_WEEK:
      return getDateRangeForRelativePeriod(now, DAYS_PER_WEEK)
    case PERIOD_DAY:
      return getDateRangeForRelativePeriod(now, 1)
    default:
      throw new Error(`Unknown period type: ${period}`)
  }
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

const buildQueryAttributes = () => [
  'schemeId',
  [db.sequelize.fn('COUNT', db.sequelize.col('paymentRequest.paymentRequestId')), 'totalPayments'],
  [db.sequelize.fn('SUM', db.sequelize.col('paymentRequest.value')), 'totalValue'],

  // Pending: paymentRequests with no completed schedule
  [db.sequelize.literal('COUNT(CASE WHEN "schedules"."completed" IS NULL THEN 1 END)'), 'pendingPayments'],
  [db.sequelize.literal('COALESCE(SUM(CASE WHEN "schedules"."completed" IS NULL THEN "paymentRequest"."value" ELSE 0 END), 0)'), 'pendingValue'],

  // Processed: has completed schedule (creates completedPaymentRequest)
  [db.sequelize.literal('COUNT(CASE WHEN "schedules"."completed" IS NOT NULL THEN 1 END)'), 'processedPayments'],
  [db.sequelize.literal('COALESCE(SUM(CASE WHEN "schedules"."completed" IS NOT NULL THEN "paymentRequest"."value" ELSE 0 END), 0)'), 'processedValue'],

  // Settled: completedPaymentRequest has lastSettlement
  [db.sequelize.literal('COUNT(CASE WHEN "completedPaymentRequests"."lastSettlement" IS NOT NULL THEN 1 END)'), 'settledPayments'],
  [db.sequelize.literal('COALESCE(SUM(CASE WHEN "completedPaymentRequests"."lastSettlement" IS NOT NULL THEN "completedPaymentRequests"."settledValue" ELSE 0 END), 0)'), 'settledValue']
]

const buildScheduleInclude = () => ({
  model: db.schedule,
  as: 'schedules',
  attributes: [],
  required: false
})

const buildCompletedPaymentRequestInclude = () => ({
  model: db.completedPaymentRequest,
  as: 'completedPaymentRequests',
  attributes: [],
  required: false,
  where: {
    invalid: false
  }
})

const fetchMetricsData = async (whereClause, useSchemeYear, schemeYear) => {
  const schemeWhereClause = useSchemeYear && schemeYear
    ? { ...whereClause, marketingYear: schemeYear }
    : whereClause

  return db.paymentRequest.findAll({
    attributes: buildQueryAttributes(),
    include: [
      buildScheduleInclude(),
      buildCompletedPaymentRequestInclude()
    ],
    where: schemeWhereClause,
    group: ['paymentRequest.schemeId'],
    raw: true
  })
}

const fetchHoldsData = async (whereClause, useSchemeYear, schemeYear) => {
  const schemeWhereClause = useSchemeYear && schemeYear
    ? { ...whereClause, marketingYear: schemeYear }
    : whereClause

  // Get all FRNs with active holds by scheme
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

const createMetricRecord = (result, period, snapshotDate, startDate, endDate, schemeYear) => {
  const schemeName = getSchemeNameById(result.schemeId)

  return {
    snapshotDate,
    periodType: period,
    schemeName,
    schemeYear: schemeYear || null,
    totalPayments: Number.parseInt(result.totalPayments) || 0,
    totalValue: Number.parseInt(result.totalValue) || 0,
    pendingPayments: Number.parseInt(result.pendingPayments) || 0,
    pendingValue: Number.parseInt(result.pendingValue) || 0,
    processedPayments: Number.parseInt(result.processedPayments) || 0,
    processedValue: Number.parseInt(result.processedValue) || 0,
    settledPayments: Number.parseInt(result.settledPayments) || 0,
    settledValue: Number.parseInt(result.settledValue) || 0,
    paymentsOnHold: Number.parseInt(result.paymentsOnHold) || 0,
    valueOnHold: Number.parseInt(result.valueOnHold) || 0,
    dataStartDate: startDate,
    dataEndDate: endDate
  }
}

const saveMetrics = async (results, period, snapshotDate, startDate, endDate, schemeYear = null) => {
  for (const result of results) {
    const metricRecord = createMetricRecord(result, period, snapshotDate, startDate, endDate, schemeYear)
    await db.metric.upsert(metricRecord)
  }
}

const calculateMetricsForPeriod = async (period, schemeYear = null, month = null) => {
  const { startDate, endDate, useSchemeYear } = calculateDateRange(period, schemeYear, month)
  const snapshotDate = new Date().toISOString().split('T')[0]

  const whereClause = buildWhereClauseForDateRange(period, startDate, endDate, useSchemeYear)

  // Fetch payment metrics
  const metricsResults = await fetchMetricsData(whereClause, useSchemeYear, schemeYear)

  // Fetch holds metrics separately
  const holdsResults = await fetchHoldsData(whereClause, useSchemeYear, schemeYear)

  // Merge the results
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
