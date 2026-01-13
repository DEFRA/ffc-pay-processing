const db = require('../../data')
const { HTTP_OK, HTTP_BAD_REQUEST, HTTP_INTERNAL_SERVER_ERROR } = require('../../../app/constants/http-status-codes')
const { metricsQueue } = require('../../metrics-queue')
const { PERIOD_ALL, PERIOD_YTD, PERIOD_YEAR, PERIOD_MONTH_IN_YEAR, PERIOD_MONTH, PERIOD_WEEK, PERIOD_DAY } = require('../../../app/constants/periods')
const VALID_PERIODS = [PERIOD_ALL, PERIOD_YTD, PERIOD_YEAR, PERIOD_MONTH_IN_YEAR, PERIOD_MONTH, PERIOD_WEEK, PERIOD_DAY]
const MIN_YEAR = 2000
const FUTURE_YEAR_OFFSET = 10
const MIN_MONTH = 1
const MAX_MONTH = 12
const METRICS_CALCULATION_FAILED = 'Metrics calculation failed'

const validatePeriod = (period) => {
  if (!VALID_PERIODS.includes(period)) {
    return {
      error: 'Invalid period type',
      message: `Period must be one of: ${VALID_PERIODS.join(', ')}`
    }
  }
  return null
}

const validateMonthInYearParams = (schemeYear, month) => {
  // Check if parameters exist first, but allow 0 for month to validate range
  if (schemeYear === null || schemeYear === undefined || month === null || month === undefined) {
    return {
      error: 'Missing required parameters',
      message: 'schemeYear and month are required for monthInYear period'
    }
  }

  if (month < MIN_MONTH || month > MAX_MONTH) {
    return {
      error: 'Invalid month',
      message: `Month must be between ${MIN_MONTH} and ${MAX_MONTH}`
    }
  }

  const currentYear = new Date().getFullYear()
  const maxYear = currentYear + FUTURE_YEAR_OFFSET
  if (schemeYear < MIN_YEAR || schemeYear > maxYear) {
    return {
      error: 'Invalid schemeYear',
      message: `schemeYear must be between ${MIN_YEAR} and ${maxYear}`
    }
  }

  return null
}

const validateYearParams = (period, schemeYear) => {
  if (period === 'year' && !schemeYear) {
    return {
      error: 'Missing required parameter',
      message: 'schemeYear is required for year period'
    }
  }
  return null
}

const handleMonthInYearCalculation = async (schemeYear, month) => {
  try {
    await metricsQueue.enqueue('monthInYear', schemeYear, month)
  } catch (err) {
    console.error('Error calculating monthInYear metrics:', err)
    const error = new Error(METRICS_CALCULATION_FAILED)
    error.statusCode = HTTP_INTERNAL_SERVER_ERROR
    error.details = {
      error: METRICS_CALCULATION_FAILED,
      message: err.message
    }
    throw error
  }
}

const calculateTotals = (schemeMetrics) => {
  return schemeMetrics.reduce((acc, m) => ({
    totalPayments: acc.totalPayments + m.totalPayments,
    totalValue: acc.totalValue + Number.parseInt(m.totalValue),
    pendingPayments: acc.pendingPayments + m.pendingPayments,
    pendingValue: acc.pendingValue + Number.parseInt(m.pendingValue),
    processedPayments: acc.processedPayments + m.processedPayments,
    processedValue: acc.processedValue + Number.parseInt(m.processedValue),
    settledPayments: acc.settledPayments + m.settledPayments,
    settledValue: acc.settledValue + Number.parseInt(m.settledValue),
    paymentsOnHold: acc.paymentsOnHold + m.paymentsOnHold,
    valueOnHold: acc.valueOnHold + Number.parseInt(m.valueOnHold)
  }), {
    totalPayments: 0,
    totalValue: 0,
    pendingPayments: 0,
    pendingValue: 0,
    processedPayments: 0,
    processedValue: 0,
    settledPayments: 0,
    settledValue: 0,
    paymentsOnHold: 0,
    valueOnHold: 0
  })
}

const aggregateByScheme = (metrics) => {
  const schemeMap = new Map()

  metrics.forEach(m => {
    const existing = schemeMap.get(m.schemeName)

    if (existing) {
      existing.totalPayments += m.totalPayments
      existing.totalValue += Number.parseInt(m.totalValue)
      existing.pendingPayments += m.pendingPayments
      existing.pendingValue += Number.parseInt(m.pendingValue)
      existing.processedPayments += m.processedPayments
      existing.processedValue += Number.parseInt(m.processedValue)
      existing.settledPayments += m.settledPayments
      existing.settledValue += Number.parseInt(m.settledValue)
      existing.paymentsOnHold += m.paymentsOnHold
      existing.valueOnHold += Number.parseInt(m.valueOnHold)
    } else {
      schemeMap.set(m.schemeName, {
        schemeName: m.schemeName,
        schemeYear: null,
        totalPayments: m.totalPayments,
        totalValue: Number.parseInt(m.totalValue),
        pendingPayments: m.pendingPayments,
        pendingValue: Number.parseInt(m.pendingValue),
        processedPayments: m.processedPayments,
        processedValue: Number.parseInt(m.processedValue),
        settledPayments: m.settledPayments,
        settledValue: Number.parseInt(m.settledValue),
        paymentsOnHold: m.paymentsOnHold,
        valueOnHold: Number.parseInt(m.valueOnHold)
      })
    }
  })

  return Array.from(schemeMap.values())
}

const mapSchemeMetrics = (schemeMetrics) => {
  return schemeMetrics.map(m => ({
    schemeName: m.schemeName,
    schemeYear: m.schemeYear,
    totalPayments: m.totalPayments,
    totalValue: Number.parseInt(m.totalValue),
    pendingPayments: m.pendingPayments,
    pendingValue: Number.parseInt(m.pendingValue),
    processedPayments: m.processedPayments,
    processedValue: Number.parseInt(m.processedValue),
    settledPayments: m.settledPayments,
    settledValue: Number.parseInt(m.settledValue),
    paymentsOnHold: m.paymentsOnHold,
    valueOnHold: Number.parseInt(m.valueOnHold)
  }))
}

const buildPaymentTotals = (totals) => ({
  totalPayments: totals?.totalPayments || 0,
  totalValue: totals?.totalValue || 0,
  totalPendingPayments: totals?.pendingPayments || 0,
  totalPendingValue: totals?.pendingValue || 0,
  totalProcessedPayments: totals?.processedPayments || 0,
  totalProcessedValue: totals?.processedValue || 0
})

const buildSettlementTotals = (totals) => ({
  totalSettledPayments: totals?.settledPayments || 0,
  totalSettledValue: totals?.settledValue || 0,
  totalPaymentsOnHold: totals?.paymentsOnHold || 0,
  totalValueOnHold: totals?.valueOnHold || 0
})

const buildTotalsObject = (totals) => ({
  ...buildPaymentTotals(totals),
  ...buildSettlementTotals(totals)
})

const formatMetricsResponse = (totals, schemeMetrics) => {
  return {
    ...buildTotalsObject(totals),
    paymentsByScheme: mapSchemeMetrics(schemeMetrics)
  }
}

const fetchMetrics = async (period, schemeYear) => {
  const whereCondition = schemeYear
    ? { periodType: period, schemeYear }
    : { periodType: period }

  const mostRecentSnapshot = await db.metric.findOne({
    attributes: [[db.sequelize.fn('MAX', db.sequelize.col('snapshot_date')), 'maxDate']],
    where: whereCondition,
    raw: true
  })

  console.log('Most recent snapshot:', mostRecentSnapshot)

  if (!mostRecentSnapshot?.maxDate) {
    return []
  }

  const whereClause = {
    snapshotDate: mostRecentSnapshot.maxDate,
    periodType: period,
    ...(schemeYear && { schemeYear })
  }

  console.log('Fetching with where clause:', whereClause)

  const results = await db.metric.findAll({
    where: whereClause,
    order: [['schemeName', 'ASC']]
  })

  console.log('Found records:', results.length)

  return results
}

const processMetrics = (metrics, schemeYear) => {
  const schemeMetrics = metrics.filter(m => m.schemeName !== null)
  const aggregatedSchemes = schemeYear ? schemeMetrics : aggregateByScheme(schemeMetrics)
  const totals = calculateTotals(schemeMetrics)
  return formatMetricsResponse(totals, aggregatedSchemes)
}

const handleYearCalculation = async (schemeYear) => {
  try {
    await metricsQueue.enqueue('year', schemeYear)
  } catch (err) {
    console.error('Error calculating year metrics:', err)
    const error = new Error(METRICS_CALCULATION_FAILED)
    error.statusCode = HTTP_INTERNAL_SERVER_ERROR
    error.details = {
      error: METRICS_CALCULATION_FAILED,
      message: err.message
    }
    throw error
  }
}

const handleMonthInYearPeriod = async (schemeYear, month, h) => {
  const validationError = validateMonthInYearParams(schemeYear, month)
  if (validationError) {
    return h.response(validationError).code(HTTP_BAD_REQUEST)
  }

  try {
    await handleMonthInYearCalculation(schemeYear, month)
  } catch (error) {
    return h.response(error.details).code(error.statusCode)
  }

  return null
}

const handleYearPeriod = async (period, schemeYear, h) => {
  const validationError = validateYearParams(period, schemeYear)
  if (validationError) {
    return h.response(validationError).code(HTTP_BAD_REQUEST)
  }

  if (period === PERIOD_YEAR && schemeYear) {
    try {
      await handleYearCalculation(schemeYear)
    } catch (error) {
      return h.response(error.details).code(error.statusCode)
    }
  }

  return null
}

const handleMetricsRequest = async (request, h) => {
  const period = request.query.period || PERIOD_ALL
  const schemeYear = request.query.schemeYear ? Number.parseInt(request.query.schemeYear) : null
  const month = request.query.month ? Number.parseInt(request.query.month) : null

  const validationError = validatePeriod(period)
  if (validationError) {
    return h.response(validationError).code(HTTP_BAD_REQUEST)
  }

  if (period === PERIOD_MONTH_IN_YEAR) {
    const result = await handleMonthInYearPeriod(schemeYear, month, h)
    if (result) {
      return result
    }
  }

  const yearResult = await handleYearPeriod(period, schemeYear, h)
  if (yearResult) {
    return yearResult
  }

  const yearFilter = period === PERIOD_ALL ? null : schemeYear
  const metrics = await fetchMetrics(period, yearFilter)
  const response = processMetrics(metrics, yearFilter)
  return h.response(response).code(HTTP_OK)
}

module.exports = [{
  method: 'GET',
  path: '/metrics',
  handler: async (request, h) => {
    try {
      return await handleMetricsRequest(request, h)
    } catch (error) {
      console.error('Error fetching metrics:', error)
      return h.response({
        error: 'Internal server error',
        message: 'An error occurred while fetching metrics'
      }).code(HTTP_INTERNAL_SERVER_ERROR)
    }
  }
}]
