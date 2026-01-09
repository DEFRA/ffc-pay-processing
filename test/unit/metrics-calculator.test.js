const { calculateAllMetrics, calculateMetricsForPeriod } = require('../../app/metrics-calculator')

jest.mock('../../app/data')
jest.mock('../../app/constants/schemes')

const db = require('../../app/data')
const schemes = require('../../app/constants/schemes')

const {
  PERIOD_ALL,
  PERIOD_YTD,
  PERIOD_YEAR,
  PERIOD_MONTH_IN_YEAR,
  PERIOD_MONTH,
  PERIOD_WEEK,
  PERIOD_DAY
} = require('../../app/constants/periods')

describe('Metrics Calculator', () => {
  let mockPaymentRequests
  let mockHoldsResults
  let consoleLogSpy
  let consoleErrorSpy

  beforeEach(() => {
    jest.clearAllMocks()
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation()
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation()

    schemes.SFI = 1
    schemes.BPS = 2
    schemes.FDMR = 3

    mockPaymentRequests = [
      {
        schemeId: 1,
        totalPayments: '10',
        totalValue: '1000',
        pendingPayments: '5',
        pendingValue: '500',
        processedPayments: '3',
        processedValue: '300',
        settledPayments: '2',
        settledValue: '200'
      }
    ]

    mockHoldsResults = [
      {
        schemeId: 1,
        paymentsOnHold: '1',
        valueOnHold: '100'
      }
    ]

    db.sequelize = {
      fn: jest.fn((fn, col) => `${fn}(${col})`),
      col: jest.fn(col => col),
      literal: jest.fn(str => str),
      query: jest.fn().mockResolvedValue(mockHoldsResults),
      QueryTypes: { SELECT: 'SELECT' }
    }

    db.paymentRequest = {
      findAll: jest.fn().mockResolvedValue(mockPaymentRequests)
    }

    db.schedule = {}
    db.completedPaymentRequest = {}

    db.metric = {
      upsert: jest.fn().mockResolvedValue([{}, true])
    }
  })

  afterEach(() => {
    consoleLogSpy.mockRestore()
    consoleErrorSpy.mockRestore()
  })

  describe('calculateMetricsForPeriod', () => {
    test('should calculate metrics for all period', async () => {
      await calculateMetricsForPeriod(PERIOD_ALL)

      expect(db.paymentRequest.findAll).toHaveBeenCalled()
      expect(db.sequelize.query).toHaveBeenCalled()
      expect(db.metric.upsert).toHaveBeenCalled()
    })

    test('should calculate metrics for ytd period', async () => {
      await calculateMetricsForPeriod(PERIOD_YTD)

      expect(db.paymentRequest.findAll).toHaveBeenCalled()
      expect(db.metric.upsert).toHaveBeenCalled()
    })

    test('should calculate metrics for year period with schemeYear', async () => {
      await calculateMetricsForPeriod(PERIOD_YEAR, 2023)

      expect(db.paymentRequest.findAll).toHaveBeenCalled()
      expect(db.metric.upsert).toHaveBeenCalled()
    })

    test('should calculate metrics for month in year period', async () => {
      await calculateMetricsForPeriod(PERIOD_MONTH_IN_YEAR, 2023, 6)

      expect(db.paymentRequest.findAll).toHaveBeenCalled()
      expect(db.metric.upsert).toHaveBeenCalled()
    })

    test('should throw error for month in year without schemeYear', async () => {
      await expect(calculateMetricsForPeriod(PERIOD_MONTH_IN_YEAR, null, 6))
        .rejects.toThrow('schemeYear and month are required for monthInYear period')
    })

    test('should throw error for month in year without month', async () => {
      await expect(calculateMetricsForPeriod(PERIOD_MONTH_IN_YEAR, 2023, null))
        .rejects.toThrow('schemeYear and month are required for monthInYear period')
    })

    test('should calculate metrics for month period', async () => {
      await calculateMetricsForPeriod(PERIOD_MONTH)

      expect(db.paymentRequest.findAll).toHaveBeenCalled()
      expect(db.metric.upsert).toHaveBeenCalled()
    })

    test('should calculate metrics for week period', async () => {
      await calculateMetricsForPeriod(PERIOD_WEEK)

      expect(db.paymentRequest.findAll).toHaveBeenCalled()
      expect(db.metric.upsert).toHaveBeenCalled()
    })

    test('should calculate metrics for day period', async () => {
      await calculateMetricsForPeriod(PERIOD_DAY)

      expect(db.paymentRequest.findAll).toHaveBeenCalled()
      expect(db.metric.upsert).toHaveBeenCalled()
    })

    test('should throw error for unknown period type', async () => {
      await expect(calculateMetricsForPeriod('invalid'))
        .rejects.toThrow('Unknown period type: invalid')
    })

    test('should merge metrics with holds data', async () => {
      await calculateMetricsForPeriod(PERIOD_ALL)

      const upsertCall = db.metric.upsert.mock.calls[0][0]
      expect(upsertCall.paymentsOnHold).toBe(1)
      expect(upsertCall.valueOnHold).toBe(100)
    })

    test('should handle metrics without holds data', async () => {
      db.sequelize.query.mockResolvedValue([])

      await calculateMetricsForPeriod(PERIOD_ALL)

      const upsertCall = db.metric.upsert.mock.calls[0][0]
      expect(upsertCall.paymentsOnHold).toBe(0)
      expect(upsertCall.valueOnHold).toBe(0)
    })

    test('should handle multiple schemes', async () => {
      mockPaymentRequests = [
        {
          schemeId: 1,
          totalPayments: '10',
          totalValue: '1000',
          pendingPayments: '5',
          pendingValue: '500',
          processedPayments: '3',
          processedValue: '300',
          settledPayments: '2',
          settledValue: '200'
        },
        {
          schemeId: 2,
          totalPayments: '20',
          totalValue: '2000',
          pendingPayments: '10',
          pendingValue: '1000',
          processedPayments: '6',
          processedValue: '600',
          settledPayments: '4',
          settledValue: '400'
        }
      ]
      db.paymentRequest.findAll.mockResolvedValue(mockPaymentRequests)

      await calculateMetricsForPeriod(PERIOD_ALL)

      expect(db.metric.upsert).toHaveBeenCalledTimes(2)
    })

    test('should set null schemeYear for non-year periods', async () => {
      await calculateMetricsForPeriod(PERIOD_ALL)

      const upsertCall = db.metric.upsert.mock.calls[0][0]
      expect(upsertCall.schemeYear).toBeNull()
    })

    test('should set schemeYear for year period', async () => {
      await calculateMetricsForPeriod(PERIOD_YEAR, 2023)

      const upsertCall = db.metric.upsert.mock.calls[0][0]
      expect(upsertCall.schemeYear).toBe(2023)
    })
  })

  describe('calculateAllMetrics', () => {
    test('should calculate all metrics successfully', async () => {
      await calculateAllMetrics()

      expect(consoleLogSpy).toHaveBeenCalledWith('Starting metrics calculation...')
      expect(consoleLogSpy).toHaveBeenCalledWith('✓ All metrics calculated successfully')
      expect(db.paymentRequest.findAll).toHaveBeenCalled()
      expect(db.metric.upsert).toHaveBeenCalled()
    })

    test('should calculate basic periods', async () => {
      await calculateAllMetrics()

      const findAllCalls = db.paymentRequest.findAll.mock.calls
      expect(findAllCalls.length).toBeGreaterThan(5)
    })

    test('should calculate yearly metrics for multiple years', async () => {
      process.env.METRICS_CALCULATION_YEARS = '2'

      await calculateAllMetrics()

      expect(db.paymentRequest.findAll).toHaveBeenCalled()
      expect(db.metric.upsert).toHaveBeenCalled()

      delete process.env.METRICS_CALCULATION_YEARS
    })

    test('should use default years when env not set', async () => {
      delete process.env.METRICS_CALCULATION_YEARS

      await calculateAllMetrics()

      expect(db.paymentRequest.findAll).toHaveBeenCalled()
      expect(db.metric.upsert).toHaveBeenCalled()
    })

    test('should handle errors and log them', async () => {
      const error = new Error('Database error')
      db.paymentRequest.findAll.mockRejectedValue(error)

      await expect(calculateAllMetrics()).rejects.toThrow('Database error')

      expect(consoleLogSpy).toHaveBeenCalledWith('Starting metrics calculation...')
      expect(consoleErrorSpy).toHaveBeenCalledWith('✗ Error calculating metrics:', error)
    })

    test('should calculate monthly metrics for each year', async () => {
      process.env.METRICS_CALCULATION_YEARS = '0'

      await calculateAllMetrics()

      const yearCalls = db.paymentRequest.findAll.mock.calls.filter(call => {
        const whereClause = call[0].where
        return whereClause && whereClause.marketingYear
      })

      expect(yearCalls.length).toBeGreaterThan(0)

      delete process.env.METRICS_CALCULATION_YEARS
    })
  })

  describe('metric record creation', () => {
    test('should create metric record with all fields', async () => {
      await calculateMetricsForPeriod(PERIOD_ALL)

      const upsertCall = db.metric.upsert.mock.calls[0][0]
      expect(upsertCall).toHaveProperty('snapshotDate')
      expect(upsertCall).toHaveProperty('periodType')
      expect(upsertCall).toHaveProperty('schemeName')
      expect(upsertCall).toHaveProperty('schemeYear')
      expect(upsertCall).toHaveProperty('totalPayments')
      expect(upsertCall).toHaveProperty('totalValue')
      expect(upsertCall).toHaveProperty('pendingPayments')
      expect(upsertCall).toHaveProperty('pendingValue')
      expect(upsertCall).toHaveProperty('processedPayments')
      expect(upsertCall).toHaveProperty('processedValue')
      expect(upsertCall).toHaveProperty('settledPayments')
      expect(upsertCall).toHaveProperty('settledValue')
      expect(upsertCall).toHaveProperty('paymentsOnHold')
      expect(upsertCall).toHaveProperty('valueOnHold')
      expect(upsertCall).toHaveProperty('dataStartDate')
      expect(upsertCall).toHaveProperty('dataEndDate')
    })

    test('should handle null values in metrics', async () => {
      mockPaymentRequests = [
        {
          schemeId: 1,
          totalPayments: null,
          totalValue: null,
          pendingPayments: null,
          pendingValue: null,
          processedPayments: null,
          processedValue: null,
          settledPayments: null,
          settledValue: null
        }
      ]
      db.paymentRequest.findAll.mockResolvedValue(mockPaymentRequests)

      await calculateMetricsForPeriod(PERIOD_ALL)

      const upsertCall = db.metric.upsert.mock.calls[0][0]
      expect(upsertCall.totalPayments).toBe(0)
      expect(upsertCall.totalValue).toBe(0)
      expect(upsertCall.pendingPayments).toBe(0)
      expect(upsertCall.pendingValue).toBe(0)
    })

    test('should get scheme name from scheme ID', async () => {
      await calculateMetricsForPeriod(PERIOD_ALL)

      const upsertCall = db.metric.upsert.mock.calls[0][0]
      expect(upsertCall.schemeName).toBe('SFI')
    })

    test('should handle unknown scheme ID', async () => {
      mockPaymentRequests = [
        {
          schemeId: 999,
          totalPayments: '10',
          totalValue: '1000',
          pendingPayments: '5',
          pendingValue: '500',
          processedPayments: '3',
          processedValue: '300',
          settledPayments: '2',
          settledValue: '200'
        }
      ]
      db.paymentRequest.findAll.mockResolvedValue(mockPaymentRequests)

      await calculateMetricsForPeriod(PERIOD_ALL)

      const upsertCall = db.metric.upsert.mock.calls[0][0]
      expect(upsertCall.schemeName).toBeNull()
    })
  })

  describe('date range calculations', () => {
    test('should set null dates for all period', async () => {
      await calculateMetricsForPeriod(PERIOD_ALL)

      const upsertCall = db.metric.upsert.mock.calls[0][0]
      expect(upsertCall.dataStartDate).toBeNull()
      expect(upsertCall.dataEndDate).toBeNull()
    })

    test('should set dates for ytd period', async () => {
      await calculateMetricsForPeriod(PERIOD_YTD)

      const upsertCall = db.metric.upsert.mock.calls[0][0]
      expect(upsertCall.dataStartDate).toBeDefined()
      expect(upsertCall.dataEndDate).toBeDefined()
    })

    test('should set dates for month in year period', async () => {
      await calculateMetricsForPeriod(PERIOD_MONTH_IN_YEAR, 2023, 6)

      const upsertCall = db.metric.upsert.mock.calls[0][0]
      expect(upsertCall.dataStartDate).toBeDefined()
      expect(upsertCall.dataEndDate).toBeDefined()
    })
  })

  describe('query construction', () => {
    test('should include where clause for date range', async () => {
      await calculateMetricsForPeriod(PERIOD_MONTH)

      const findAllCall = db.paymentRequest.findAll.mock.calls[0][0]
      expect(findAllCall.where).toBeDefined()
      expect(findAllCall.where.received).toBeDefined()
    })

    test('should include marketing year for year period', async () => {
      await calculateMetricsForPeriod(PERIOD_YEAR, 2023)

      const findAllCall = db.paymentRequest.findAll.mock.calls[0][0]
      expect(findAllCall.where.marketingYear).toBe(2023)
    })

    test('should include holds query with date filters', async () => {
      await calculateMetricsForPeriod(PERIOD_MONTH)

      expect(db.sequelize.query).toHaveBeenCalled()
      const queryCall = db.sequelize.query.mock.calls[0]
      expect(queryCall[0]).toContain('paymentRequests')
      expect(queryCall[0]).toContain('holds')
    })

    test('should include holds query with scheme year', async () => {
      await calculateMetricsForPeriod(PERIOD_YEAR, 2023)

      expect(db.sequelize.query).toHaveBeenCalled()
      const queryCall = db.sequelize.query.mock.calls[0]
      expect(queryCall[1].replacements.schemeYear).toBe(2023)
    })
  })
})
