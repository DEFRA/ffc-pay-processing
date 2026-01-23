jest.mock('../../app/data')
jest.mock('../../app/constants/schemes', () => ({}))

jest.mock('sequelize', () => {
  const Op = { gte: Symbol('gte'), lt: Symbol('lt') }
  return { Op }
})
const { Op } = require('sequelize')
const db = require('../../app/data')
const schemes = require('../../app/constants/schemes')
const { calculateAllMetrics, calculateMetricsForPeriod, calculateDateRange, createMetricRecord, saveMetrics, getSchemeNameById, buildWhereClauseForDateRange, buildQueryWhereClausesAndReplacements, buildMetricsQuery, fetchMetricsData, fetchHoldsData, mergeMetricsWithHolds, parseIntOrZero, calculateBasicPeriods, calculateYearlyMetrics } = require('../../app/metrics-calculator')

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
        year: 2023,
        month: 1,
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
    db.sequelize.query.mockResolvedValue([])

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

  describe('getSchemeNameById', () => {
    test('should return scheme name for valid id', () => {
      expect(getSchemeNameById(1)).toBe('SFI')
      expect(getSchemeNameById(2)).toBe('DP')
      expect(getSchemeNameById(3)).toBe('CSHTR')
    })

    test('should return null for invalid id', () => {
      expect(getSchemeNameById(999)).toBe(null)
    })
  })

  describe('calculateDateRange', () => {
    test('should return correct range for all', () => {
      const result = calculateDateRange('all')
      expect(result).toEqual({ startDate: null, endDate: null })
    })

    test('should return correct range for ytd', () => {
      const now = new Date()
      const result = calculateDateRange('ytd')
      expect(result.startDate.getFullYear()).toBe(now.getFullYear())
      expect(result.startDate.getMonth()).toBe(0)
      expect(result.startDate.getDate()).toBe(1)
      expect(result.endDate).toEqual(now)
    })

    test('should return correct range for year', () => {
      const result = calculateDateRange('year', 2023)
      expect(result.startDate).toEqual(new Date(2023, 0, 1))
      expect(result.endDate).toEqual(new Date(2024, 0, 1))
      expect(result.year).toBe(2023)
    })

    test('should throw for year without year param', () => {
      expect(() => calculateDateRange('year')).toThrow('Year is required for yearly metrics')
    })

    test('should return correct range for monthInYear', () => {
      const result = calculateDateRange('monthInYear', 2023, 1)
      expect(result.startDate).toEqual(new Date(2023, 0, 1))
      expect(result.endDate.getFullYear()).toBe(2023)
      expect(result.endDate.getMonth()).toBe(1)
      expect(result.endDate.getDate()).toBe(1)
      expect(result.year).toBe(2023)
      expect(result.month).toBe(1)
    })

    test('should throw for monthInYear without year', () => {
      expect(() => calculateDateRange('monthInYear', null, 1)).toThrow('Year and month are required for monthInYear metrics')
    })

    test('should throw for monthInYear without month', () => {
      expect(() => calculateDateRange('monthInYear', 2023, null)).toThrow('Year and month are required for monthInYear metrics')
    })

    test('should return correct range for month', () => {
      const now = new Date()
      const result = calculateDateRange('month')
      expect(result.startDate.getTime()).toBeLessThan(now.getTime())
      expect(result.endDate).toEqual(now)
    })

    test('should return correct range for week', () => {
      const now = new Date()
      const result = calculateDateRange('week')
      expect(result.startDate.getTime()).toBe(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      expect(result.endDate).toEqual(now)
    })

    test('should return correct range for day', () => {
      const now = new Date()
      const result = calculateDateRange('day')
      expect(result.startDate.getTime()).toBe(now.getTime() - 24 * 60 * 60 * 1000)
      expect(result.endDate).toEqual(now)
    })

    test('should throw for unknown period', () => {
      expect(() => calculateDateRange('unknown')).toThrow('Unknown period type: unknown')
    })
  })

  describe('buildWhereClauseForDateRange', () => {
    test('should build where clause with dates', () => {
      const start = new Date(2023, 0, 1)
      const end = new Date(2024, 0, 1)
      const result = buildWhereClauseForDateRange(start, end)
      expect(result.received[Op.gte]).toEqual(start)
      expect(result.received[Op.lt]).toEqual(end)
    })

    test('should build empty where clause without dates', () => {
      const result = buildWhereClauseForDateRange(null, null)
      expect(result).toEqual({})
    })
  })

  describe('buildQueryWhereClausesAndReplacements', () => {
    test('should build clauses and replacements with received', () => {
      const start = new Date(2023, 0, 1)
      const end = new Date(2024, 0, 1)
      const schemeWhereClause = { received: { [Op.gte]: start, [Op.lt]: end } }
      const result = buildQueryWhereClausesAndReplacements(schemeWhereClause)
      expect(result.whereClauses).toEqual(['pr."received" >= :startDate', 'pr."received" < :endDate'])
      expect(result.replacements.startDate).toEqual(start)
      expect(result.replacements.endDate).toEqual(end)
    })

    test('should build empty clauses without received', () => {
      const schemeWhereClause = {}
      const result = buildQueryWhereClausesAndReplacements(schemeWhereClause)
      expect(result.whereClauses).toEqual([])
      expect(result.replacements).toEqual({})
    })
  })

  describe('buildMetricsQuery', () => {
    test('should build query with year and month', () => {
      const query = buildMetricsQuery('WHERE pr."received" >= :startDate', true)
      expect(query).toContain('EXTRACT(YEAR FROM pr."received") AS "year"')
      expect(query).toContain('EXTRACT(MONTH FROM pr."received") AS "month"')
      expect(query).toContain('GROUP BY "year", "month", pr."schemeId"')
    })

    test('should build query without year and month for all', () => {
      const query = buildMetricsQuery('', false)
      expect(query).not.toContain('EXTRACT(YEAR FROM pr."received") AS "year"')
      expect(query).not.toContain('EXTRACT(MONTH FROM pr."received") AS "month"')
      expect(query).toContain('GROUP BY pr."schemeId"')
    })
  })

  describe('fetchMetricsData', () => {
    test('should fetch metrics data', async () => {
      db.sequelize.query.mockResolvedValue(mockMetricsResults)
      const whereClause = {}
      const result = await fetchMetricsData(whereClause, null, null, 'all')
      expect(db.sequelize.query).toHaveBeenCalled()
      expect(result).toEqual(mockMetricsResults)
    })
  })

  describe('fetchHoldsData', () => {
    test('should fetch holds data', async () => {
      db.sequelize.query.mockResolvedValue(mockHoldsResults)
      const whereClause = {}
      const result = await fetchHoldsData(whereClause)
      expect(db.sequelize.query).toHaveBeenCalled()
      expect(result).toEqual(mockHoldsResults)
    })
  })

  describe('mergeMetricsWithHolds', () => {
    test('should merge metrics with holds', () => {
      const metrics = [{ schemeId: 1, year: 2023, month: 1, totalPayments: 10 }]
      const holds = [{ schemeId: 1, year: 2023, month: 1, paymentsOnHold: 1, valueOnHold: 100 }]
      const result = mergeMetricsWithHolds(metrics, holds)
      expect(result[0].paymentsOnHold).toBe(1)
      expect(result[0].valueOnHold).toBe(100)
    })

    test('should handle no matching holds', () => {
      const metrics = [{ schemeId: 1, year: 2023, month: 1, totalPayments: 10 }]
      const holds = []
      const result = mergeMetricsWithHolds(metrics, holds)
      expect(result[0].paymentsOnHold).toBe(0)
      expect(result[0].valueOnHold).toBe(0)
    })
  })

  describe('parseIntOrZero', () => {
    test('should parse valid number', () => {
      expect(parseIntOrZero('10')).toBe(10)
    })

    test('should return zero for invalid', () => {
      expect(parseIntOrZero('abc')).toBe(0)
      expect(parseIntOrZero(null)).toBe(0)
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
      db.sequelize.query.mockImplementation((query) => {
        if (query.includes('holds')) return Promise.resolve(mockHoldsResults)
        return Promise.resolve(mockMetricsResults)
      })
      await calculateMetricsForPeriod('all')
      expect(db.sequelize.query).toHaveBeenCalledTimes(2)
      expect(db.metric.create).toHaveBeenCalled()
    })
  })

  describe('calculateBasicPeriods', () => {
    test('should calculate basic periods', async () => {
      await calculateBasicPeriods()
      expect(db.sequelize.query).toHaveBeenCalledTimes(10)
    })
  })

  describe('calculateYearlyMetrics', () => {
    test('should calculate yearly and monthly metrics', async () => {
      await calculateYearlyMetrics(2023)
      expect(db.sequelize.query).toHaveBeenCalledTimes(26)
    })
  })

  describe('calculateAllMetrics', () => {
    test('should calculate all metrics successfully', async () => {
      db.sequelize.query.mockImplementation((query) => {
        if (query.includes('DISTINCT EXTRACT')) {
          return Promise.resolve([{ year: 2023 }, { year: 2022 }])
        }
        if (query.includes('holds')) {
          return Promise.resolve(mockHoldsResults)
        }
        return Promise.resolve(mockMetricsResults)
      })

      await calculateAllMetrics()

      expect(db.sequelize.query).toHaveBeenCalledWith(
        'SELECT DISTINCT EXTRACT(YEAR FROM "received") AS year FROM "paymentRequests" ORDER BY year DESC',
        { type: db.sequelize.QueryTypes.SELECT }
      )
      expect(db.sequelize.query).toHaveBeenCalledTimes(63)
      expect(consoleLogSpy).toHaveBeenCalledWith('Starting metrics calculation...')
      expect(consoleLogSpy).toHaveBeenCalledWith('✓ All metrics calculated successfully')
    })

    test('should handle errors and log them', async () => {
      db.sequelize.query.mockRejectedValue(new Error('Query error'))

      await expect(calculateAllMetrics()).rejects.toThrow('Query error')

      expect(consoleErrorSpy).toHaveBeenCalledWith('✗ Error calculating metrics:', expect.any(Error))
    })

    test('should skip null years', async () => {
      db.sequelize.query.mockImplementation((query) => {
        if (query.includes('DISTINCT EXTRACT')) {
          return Promise.resolve([{ year: 2023 }, { year: null }])
        }
        if (query.includes('holds')) {
          return Promise.resolve(mockHoldsResults)
        }
        return Promise.resolve(mockMetricsResults)
      })

      await calculateAllMetrics()

      expect(db.sequelize.query).toHaveBeenCalledTimes(37)
    })
  })
})
