const db = require('../../app/data')
const { getDateRangeForAll, getDateRangeForYTD, getDateRangeForYear, getDateRangeForMonthInYear, getDateRangeForRelativePeriod, fetchMetricsData, fetchHoldsData, mergeMetricsWithHolds } = require('./get-metrics-data')
const { buildWhereClauseForDateRange } = require('./build-metrics')
const { saveMetrics } = require('./create-save-metrics')
const {
  DAYS_PER_WEEK,
  DAYS_PER_MONTH
} = require('../../app/constants/time')
const {
  MONTHS_PER_YEAR
} = require('../../app/constants/date')
const {
  PERIOD_ALL,
  PERIOD_YTD,
  PERIOD_YEAR,
  PERIOD_MONTH_IN_YEAR,
  PERIOD_MONTH,
  PERIOD_WEEK,
  PERIOD_DAY
} = require('../../app/constants/periods')

const validateParams = (period, year, month) => {
  if (period === PERIOD_YEAR && !year) {
    throw new Error('Year is required for yearly metrics')
  }
  if (period === PERIOD_MONTH_IN_YEAR && (!year || !month)) {
    throw new Error('Year and month are required for monthInYear metrics')
  }
}

const calculateDateRange = (period, year = null, month = null) => {
  const now = new Date()
  validateParams(period, year, month)
  switch (period) {
    case PERIOD_ALL:
      return getDateRangeForAll()
    case PERIOD_YTD:
      return getDateRangeForYTD(now)
    case PERIOD_YEAR:
      return getDateRangeForYear(year)
    case PERIOD_MONTH_IN_YEAR:
      return getDateRangeForMonthInYear(year, month)
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
  calculateBasicPeriods,
  calculateYearlyMetrics
}
