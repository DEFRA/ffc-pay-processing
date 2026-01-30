jest.mock('../../../app/data')
jest.mock('../../../app/constants/schemes', () => ({}))
jest.mock('../../../app/metrics/build-metrics', () => ({
  buildMetricsQuery: jest.fn(),
  buildQueryWhereClausesAndReplacements: jest.fn()
}))
jest.mock('sequelize', () => {
  const Op = { gte: Symbol('gte'), lt: Symbol('lt') }
  return { Op }
})
const db = require('../../../app/data')
const schemes = require('../../../app/constants/schemes')
const { buildMetricsQuery, buildQueryWhereClausesAndReplacements } = require('../../../app/metrics/build-metrics')
const { getSchemeNameById, getDateRangeForAll, getDateRangeForYTD, getDateRangeForYear, getDateRangeForMonthInYear, getDateRangeForRelativePeriod, fetchMetricsData, fetchHoldsData, mergeMetricsWithHolds } = require('../../../app/metrics/get-metrics-data')
const { Op } = require('sequelize')

describe('Get Metrics Data', () => {
  let mockMetricsResults
  let mockHoldsResults

  beforeEach(() => {
    jest.clearAllMocks()

    schemes.SFI = 1
    schemes.DP = 2
    schemes.CSHTR = 3

    mockMetricsResults = [
      {
        schemeId: 1,
        year: 2023,
        month: 1,
        payments: 100,
        value: 1000
      }
    ]

    mockHoldsResults = [
      {
        schemeId: 1,
        year: 2023,
        month: 1,
        paymentsOnHold: '5',
        valueOnHold: '500'
      }
    ]

    buildMetricsQuery.mockReturnValue('SELECT * FROM metrics')
    buildQueryWhereClausesAndReplacements.mockReturnValue({ whereClauses: [], replacements: {} })
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

  describe('getDateRangeForAll', () => {
    test('should return null dates', () => {
      const result = getDateRangeForAll()
      expect(result).toEqual({ startDate: null, endDate: null })
    })
  })

  describe('getDateRangeForYTD', () => {
    test('should return YTD range', () => {
      const now = new Date(2023, 5, 15)
      const result = getDateRangeForYTD(now)
      expect(result.startDate).toEqual(new Date(2023, 0, 1))
      expect(result.endDate).toBe(null)
    })
  })

  describe('getDateRangeForYear', () => {
    test('should return year range', () => {
      const result = getDateRangeForYear(2023)
      expect(result.startDate).toEqual(new Date(2023, 0, 1))
      expect(result.endDate).toEqual(new Date(2024, 0, 1))
      expect(result.year).toBe(2023)
    })
  })

  describe('getDateRangeForMonthInYear', () => {
    test('should return month range', () => {
      const result = getDateRangeForMonthInYear(2023, 6)
      expect(result.startDate).toEqual(new Date(2023, 5, 1))
      expect(result.endDate).toEqual(new Date(2023, 6, 1))
      expect(result.year).toBe(2023)
      expect(result.month).toBe(6)
    })

    test('should return month range if December', () => {
      const result = getDateRangeForMonthInYear(2023, 12)
      expect(result.startDate).toEqual(new Date(2023, 11, 1))
      expect(result.endDate).toEqual(new Date(2024, 0, 1))
      expect(result.year).toBe(2023)
      expect(result.month).toBe(12)
    })
  })

  describe('getDateRangeForRelativePeriod', () => {
    test('should return relative range', () => {
      const now = new Date()
      const days = 7
      const result = getDateRangeForRelativePeriod(now, days)
      expect(result.startDate.getTime()).toBe(now.getTime() - days * 24 * 60 * 60 * 1000)
      expect(result.endDate).toBe(null)
    })
  })

  describe('fetchMetricsData', () => {
    test('should fetch metrics data with no group by for all period', async () => {
      db.sequelize.query.mockResolvedValue(mockMetricsResults)
      const whereClause = {}
      const result = await fetchMetricsData(whereClause, null, null, 'all')
      expect(db.sequelize.query).toHaveBeenCalled()
      expect(result).toEqual(mockMetricsResults)
    })

    test('should fetch metrics data with group by for other periods', async () => {
      db.sequelize.query.mockResolvedValue(mockMetricsResults)
      const whereClause = {}
      const result = await fetchMetricsData(whereClause, null, null, 'year')
      expect(db.sequelize.query).toHaveBeenCalled()
      expect(result).toEqual(mockMetricsResults)
    })
  })

  describe('fetchHoldsData', () => {
    test('should fetch holds data without date range', async () => {
      db.sequelize.query.mockResolvedValue(mockHoldsResults)
      const whereClause = {}
      const result = await fetchHoldsData(whereClause)
      expect(db.sequelize.query).toHaveBeenCalled()
      expect(result).toEqual(mockHoldsResults)
    })

    test('should fetch holds data with date range', async () => {
      db.sequelize.query.mockResolvedValue(mockHoldsResults)
      const startDate = new Date()
      const endDate = new Date()
      const whereClause = { received: { [Op.gte]: startDate, [Op.lt]: endDate } }
      const result = await fetchHoldsData(whereClause)
      expect(db.sequelize.query).toHaveBeenCalled()
      expect(result).toEqual(mockHoldsResults)
    })
  })

  describe('mergeMetricsWithHolds', () => {
    test('should merge metrics with holds when holds exist', () => {
      const result = mergeMetricsWithHolds(mockMetricsResults, mockHoldsResults)
      expect(result[0].paymentsOnHold).toBe(5)
      expect(result[0].valueOnHold).toBe(500)
    })

    test('should merge metrics with no holds', () => {
      const result = mergeMetricsWithHolds(mockMetricsResults, [])
      expect(result[0].paymentsOnHold).toBe(0)
      expect(result[0].valueOnHold).toBe(0)
    })
  })
})
