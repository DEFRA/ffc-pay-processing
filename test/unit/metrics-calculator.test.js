jest.mock('../../app/data')
jest.mock('../../app/constants/schemes')

const db = require('../../app/data')
const schemes = require('../../app/constants/schemes')
const { calculateAllMetrics, calculateMetricsForPeriod, calculateDateRange, createMetricRecord, saveMetrics } = require('../../app/metrics-calculator')

describe('Metrics Calculator', () => {
  let mockMetricsResults
  let mockHoldsResults
  let consoleLogSpy
  let consoleErrorSpy

  beforeEach(() => {
    jest.clearAllMocks()
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation()
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation()

    schemes.SFI = 1
    schemes.DP = 2
    schemes.CSHTR = 3

    mockMetricsResults = [
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
        totalPayments: '5',
        totalValue: '500',
        pendingPayments: '2',
        pendingValue: '200',
        processedPayments: '2',
        processedValue: '200',
        settledPayments: '1',
        settledValue: '100'
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
      query: jest.fn(),
      QueryTypes: { SELECT: 'SELECT' },
      fn: jest.fn(),
      col: jest.fn()
    }

    db.paymentRequest = {
      findAll: jest.fn()
    }

    db.sequelize.query.mockImplementation((query) => {
      if (query.includes('holds')) {
        return Promise.resolve(mockHoldsResults)
      }
      return Promise.resolve(mockMetricsResults)
    })

    db.metric = {
      findOne: jest.fn().mockResolvedValue(null),
      update: jest.fn().mockResolvedValue([1]),
      create: jest.fn().mockResolvedValue({ id: 1 })
    }
  })

  afterEach(() => {
    consoleLogSpy.mockRestore()
    consoleErrorSpy.mockRestore()
  })

  describe('calculateAllMetrics', () => {
    test('should calculate all metrics successfully', async () => {
      db.paymentRequest.findAll.mockResolvedValue([{ year: 2023 }, { year: null }, { year: 2022 }])

      await calculateAllMetrics()

      expect(db.paymentRequest.findAll).toHaveBeenCalledWith({
        attributes: [[db.sequelize.fn('DISTINCT', db.sequelize.col('marketingYear')), 'year']],
        order: [['marketingYear', 'DESC']],
        raw: true
      })
      expect(consoleLogSpy).toHaveBeenCalledWith('Starting metrics calculation...')
      expect(consoleLogSpy).toHaveBeenCalledWith('✓ All metrics calculated successfully')
      expect(db.metric.create).toHaveBeenCalledTimes(62)
      const createCalls = db.metric.create.mock.calls
      expect(createCalls.some(call => call[0].paymentsOnHold === 1)).toBe(true)
      expect(createCalls.some(call => call[0].paymentsOnHold === 0)).toBe(true)
    })

    test('should calculate basic periods', async () => {
      db.paymentRequest.findAll.mockResolvedValue([])

      await calculateAllMetrics()

      expect(db.sequelize.query).toHaveBeenCalledTimes(10) // 5 periods * 2 queries each
    })

    test('should calculate yearly metrics for distinct marketing years', async () => {
      db.paymentRequest.findAll.mockResolvedValue([{ year: 2023 }, { year: 2022 }])

      await calculateAllMetrics()

      expect(db.paymentRequest.findAll).toHaveBeenCalledWith({
        attributes: [[db.sequelize.fn('DISTINCT', db.sequelize.col('marketingYear')), 'year']],
        order: [['marketingYear', 'DESC']],
        raw: true
      })
    })

    test('should handle errors and log them', async () => {
      db.sequelize.query.mockRejectedValue(new Error('Query error'))

      await expect(calculateAllMetrics()).rejects.toThrow('Query error')

      expect(consoleErrorSpy).toHaveBeenCalledWith('✗ Error calculating metrics:', expect.any(Error))
    })

    test('should calculate monthly metrics for each year', async () => {
      db.paymentRequest.findAll.mockResolvedValue([{ year: 2023 }])

      await calculateAllMetrics()

      expect(db.sequelize.query).toHaveBeenCalledTimes(36)
    })
  })

  describe('calculateDateRange', () => {
    test('should return correct range for all', () => {
      const result = calculateDateRange('all')
      expect(result).toEqual({ startDate: null, endDate: null, useSchemeYear: false })
    })

    test('should return correct range for ytd', () => {
      const now = new Date()
      const result = calculateDateRange('ytd')
      expect(result.startDate.getFullYear()).toBe(now.getFullYear())
      expect(result.startDate.getMonth()).toBe(0)
      expect(result.startDate.getDate()).toBe(1)
      expect(result.endDate).toEqual(now)
      expect(result.useSchemeYear).toBe(false)
    })

    test('should return correct range for year', () => {
      const result = calculateDateRange('year')
      expect(result).toEqual({ startDate: null, endDate: null, useSchemeYear: true })
    })

    test('should return correct range for monthInYear', () => {
      const result = calculateDateRange('monthInYear', 2023, 1)
      expect(result.startDate).toEqual(new Date(2023, 0, 1))
      expect(result.endDate.getFullYear()).toBe(2023)
      expect(result.endDate.getMonth()).toBe(0)
      expect(result.endDate.getDate()).toBe(31)
      expect(result.useSchemeYear).toBe(true)
    })

    test('should return correct range for month', () => {
      const now = new Date()
      const result = calculateDateRange('month')
      expect(result.startDate.getTime()).toBeLessThan(now.getTime())
      expect(result.endDate).toEqual(now)
      expect(result.useSchemeYear).toBe(false)
    })

    test('should return correct range for week', () => {
      const now = new Date()
      const result = calculateDateRange('week')
      expect(result.startDate.getTime()).toBe(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      expect(result.endDate).toEqual(now)
      expect(result.useSchemeYear).toBe(false)
    })

    test('should return correct range for day', () => {
      const now = new Date()
      const result = calculateDateRange('day')
      expect(result.startDate.getTime()).toBe(now.getTime() - 24 * 60 * 60 * 1000)
      expect(result.endDate).toEqual(now)
      expect(result.useSchemeYear).toBe(false)
    })

    test('should throw for unknown period', () => {
      expect(() => calculateDateRange('unknown')).toThrow('Unknown period type: unknown')
    })

    test('should throw for monthInYear without schemeYear', () => {
      expect(() => calculateDateRange('monthInYear', null, 1)).toThrow('schemeYear and month are required for monthInYear period')
    })

    test('should throw for monthInYear without month', () => {
      expect(() => calculateDateRange('monthInYear', 2023, null)).toThrow('schemeYear and month are required for monthInYear period')
    })
  })

  describe('createMetricRecord', () => {
    test('should create metric record with valid scheme', () => {
      const result = { schemeId: 1, totalPayments: '10', totalValue: '1000', pendingPayments: '5', pendingValue: '500', processedPayments: '3', processedValue: '300', settledPayments: '2', settledValue: '200', paymentsOnHold: 1, valueOnHold: 100 }
      const record = createMetricRecord(result, 'all', '2023-01-01', null, null, null)
      expect(record.schemeName).toBe('SFI')
      expect(record.totalPayments).toBe(10)
      expect(record.totalValue).toBe(1000)
      expect(record.pendingPayments).toBe(5)
      expect(record.pendingValue).toBe(500)
      expect(record.processedPayments).toBe(3)
      expect(record.processedValue).toBe(300)
      expect(record.settledPayments).toBe(2)
      expect(record.settledValue).toBe(200)
      expect(record.paymentsOnHold).toBe(1)
      expect(record.valueOnHold).toBe(100)
      expect(record.periodType).toBe('all')
      expect(record.snapshotDate).toBe('2023-01-01')
      expect(record.schemeYear).toBe(null)
      expect(record.monthInYear).toBe(null)
      expect(record.dataStartDate).toBe(null)
      expect(record.dataEndDate).toBe(null)
    })

    test('should create metric record with unknown scheme', () => {
      const result = { schemeId: 999, totalPayments: '10', totalValue: '1000', pendingPayments: '5', pendingValue: '500', processedPayments: '3', processedValue: '300', settledPayments: '2', settledValue: '200', paymentsOnHold: 0, valueOnHold: 0 }
      const record = createMetricRecord(result, 'monthInYear', '2023-01-01', new Date(), new Date(), 2023, 1)
      expect(record.schemeName).toBe(null)
      expect(record.periodType).toBe('monthInYear')
      expect(record.schemeYear).toBe(2023)
      expect(record.monthInYear).toBe(1)
    })

    test('should handle invalid numbers', () => {
      const result = { schemeId: 1, totalPayments: 'abc', totalValue: null, pendingPayments: '5', pendingValue: '500', processedPayments: '3', processedValue: '300', settledPayments: '2', settledValue: '200', paymentsOnHold: 0, valueOnHold: 0 }
      const record = createMetricRecord(result, 'all', '2023-01-01', null, null, null)
      expect(record.totalPayments).toBe(0)
      expect(record.totalValue).toBe(0)
    })
  })

  describe('saveMetrics', () => {
    test('should create new metric if not exists', async () => {
      db.metric.findOne.mockResolvedValue(null)
      const results = [{ schemeId: 1, totalPayments: '10', totalValue: '1000', pendingPayments: '5', pendingValue: '500', processedPayments: '3', processedValue: '300', settledPayments: '2', settledValue: '200', paymentsOnHold: 0, valueOnHold: 0 }]
      await saveMetrics(results, 'all', '2023-01-01', null, null)
      expect(db.metric.findOne).toHaveBeenCalled()
      expect(db.metric.create).toHaveBeenCalled()
      expect(db.metric.update).not.toHaveBeenCalled()
    })

    test('should update existing metric', async () => {
      db.metric.findOne.mockResolvedValue({ id: 1 })
      const results = [{ schemeId: 1, totalPayments: '10', totalValue: '1000', pendingPayments: '5', pendingValue: '500', processedPayments: '3', processedValue: '300', settledPayments: '2', settledValue: '200', paymentsOnHold: 0, valueOnHold: 0 }]
      await saveMetrics(results, 'all', '2023-01-01', null, null)
      expect(db.metric.findOne).toHaveBeenCalled()
      expect(db.metric.update).toHaveBeenCalled()
      expect(db.metric.create).not.toHaveBeenCalled()
    })
  })

  describe('calculateMetricsForPeriod', () => {
    test('should calculate metrics for a period', async () => {
      await calculateMetricsForPeriod('all')
      expect(db.sequelize.query).toHaveBeenCalledTimes(2) // Metrics and holds queries
      expect(db.metric.create).toHaveBeenCalled()
    })
  })
})
