jest.mock('../../../app/data')
jest.mock('../../../app/metrics/get-metrics-data', () => ({
  getDateRangeForAll: jest.fn(),
  getDateRangeForYTD: jest.fn(),
  getDateRangeForYear: jest.fn(),
  getDateRangeForMonthInYear: jest.fn(),
  getDateRangeForRelativePeriod: jest.fn(),
  fetchMetricsData: jest.fn(),
  fetchHoldsData: jest.fn(),
  mergeMetricsWithHolds: jest.fn()
}))
jest.mock('../../../app/metrics/build-metrics', () => ({
  buildWhereClauseForDateRange: jest.fn()
}))
jest.mock('../../../app/metrics/create-save-metrics', () => ({
  saveMetrics: jest.fn()
}))
const db = require('../../../app/data')
const { getDateRangeForAll, getDateRangeForYTD, getDateRangeForYear, getDateRangeForMonthInYear, getDateRangeForRelativePeriod, fetchMetricsData, fetchHoldsData, mergeMetricsWithHolds } = require('../../../app/metrics/get-metrics-data')
const { buildWhereClauseForDateRange } = require('../../../app/metrics/build-metrics')
const { saveMetrics } = require('../../../app/metrics/create-save-metrics')
const { calculateDateRange, calculateMetricsForPeriod, calculateBasicPeriods, calculateYearlyMetrics, calculateAllMetrics } = require('../../../app/metrics/metrics-calculator')

describe('Metrics Calculator', () => {
  let consoleLogSpy
  let consoleErrorSpy

  beforeEach(() => {
    jest.clearAllMocks()
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation()
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation()

    db.sequelize = {
      query: jest.fn().mockResolvedValue([{ year: 2023 }]),
      QueryTypes: { SELECT: 'SELECT' }
    }

    getDateRangeForAll.mockReturnValue({ startDate: null, endDate: null })
    getDateRangeForYTD.mockReturnValue({ startDate: new Date(), endDate: new Date() })
    getDateRangeForYear.mockReturnValue({ startDate: new Date(2023, 0, 1), endDate: new Date(2024, 0, 1), year: 2023 })
    getDateRangeForMonthInYear.mockReturnValue({ startDate: new Date(2023, 0, 1), endDate: new Date(2023, 1, 1), year: 2023, month: 1 })
    getDateRangeForRelativePeriod.mockReturnValue({ startDate: new Date(), endDate: new Date() })
    buildWhereClauseForDateRange.mockReturnValue({})
    fetchMetricsData.mockResolvedValue([])
    fetchHoldsData.mockResolvedValue([])
    mergeMetricsWithHolds.mockReturnValue([])
    saveMetrics.mockResolvedValue()
  })

  afterEach(() => {
    consoleLogSpy.mockRestore()
    consoleErrorSpy.mockRestore()
  })

  describe('calculateDateRange', () => {
    test('should return correct range for all', () => {
      const result = calculateDateRange('all')
      expect(getDateRangeForAll).toHaveBeenCalled()
      expect(result).toEqual({ startDate: null, endDate: null })
    })

    test('should return correct range for ytd', () => {
      const result = calculateDateRange('ytd')
      expect(getDateRangeForYTD).toHaveBeenCalled()
      expect(result).toEqual({ startDate: expect.any(Date), endDate: expect.any(Date) })
    })

    test('should return correct range for year', () => {
      const result = calculateDateRange('year', 2023)
      expect(getDateRangeForYear).toHaveBeenCalledWith(2023)
      expect(result).toEqual({ startDate: new Date(2023, 0, 1), endDate: new Date(2024, 0, 1), year: 2023 })
    })

    test('should throw for year without year param', () => {
      expect(() => calculateDateRange('year')).toThrow('Year is required for yearly metrics')
    })

    test('should return correct range for monthInYear', () => {
      const result = calculateDateRange('monthInYear', 2023, 1)
      expect(getDateRangeForMonthInYear).toHaveBeenCalledWith(2023, 1)
      expect(result).toEqual({ startDate: new Date(2023, 0, 1), endDate: new Date(2023, 1, 1), year: 2023, month: 1 })
    })

    test('should throw for monthInYear without year', () => {
      expect(() => calculateDateRange('monthInYear', null, 1)).toThrow('Year and month are required for monthInYear metrics')
    })

    test('should throw for monthInYear without month', () => {
      expect(() => calculateDateRange('monthInYear', 2023, null)).toThrow('Year and month are required for monthInYear metrics')
    })

    test('should return correct range for month', () => {
      const result = calculateDateRange('month')
      expect(getDateRangeForRelativePeriod).toHaveBeenCalled()
      expect(result).toEqual({ startDate: expect.any(Date), endDate: expect.any(Date) })
    })

    test('should return correct range for week', () => {
      const result = calculateDateRange('week')
      expect(getDateRangeForRelativePeriod).toHaveBeenCalled()
      expect(result).toEqual({ startDate: expect.any(Date), endDate: expect.any(Date) })
    })

    test('should return correct range for day', () => {
      const result = calculateDateRange('day')
      expect(getDateRangeForRelativePeriod).toHaveBeenCalled()
      expect(result).toEqual({ startDate: expect.any(Date), endDate: expect.any(Date) })
    })

    test('should throw for unknown period', () => {
      expect(() => calculateDateRange('unknown')).toThrow('Unknown period type: unknown')
    })
  })

  describe('calculateMetricsForPeriod', () => {
    test('should calculate metrics for period all', async () => {
      await calculateMetricsForPeriod('all')
      expect(getDateRangeForAll).toHaveBeenCalled()
      expect(buildWhereClauseForDateRange).toHaveBeenCalledWith(null, null)
      expect(fetchMetricsData).toHaveBeenCalledWith({}, null, null, 'all')
      expect(fetchHoldsData).toHaveBeenCalledWith({})
      expect(mergeMetricsWithHolds).toHaveBeenCalledWith([], [])
      expect(saveMetrics).toHaveBeenCalledWith([], 'all', expect.any(String), null, null, null, null)
    })

    test('should calculate metrics for period year', async () => {
      await calculateMetricsForPeriod('year', 2023)
      expect(getDateRangeForYear).toHaveBeenCalledWith(2023)
      expect(buildWhereClauseForDateRange).toHaveBeenCalled()
      expect(fetchMetricsData).toHaveBeenCalledWith({}, 2023, null, 'year')
      expect(fetchHoldsData).toHaveBeenCalled()
      expect(mergeMetricsWithHolds).toHaveBeenCalled()
      expect(saveMetrics).toHaveBeenCalledWith([], 'year', expect.any(String), expect.any(Date), expect.any(Date), 2023, null)
    })

    test('should calculate metrics for period monthInYear', async () => {
      await calculateMetricsForPeriod('monthInYear', 2023, 1)
      expect(getDateRangeForMonthInYear).toHaveBeenCalledWith(2023, 1)
      expect(buildWhereClauseForDateRange).toHaveBeenCalled()
      expect(fetchMetricsData).toHaveBeenCalledWith({}, 2023, 1, 'monthInYear')
      expect(fetchHoldsData).toHaveBeenCalled()
      expect(mergeMetricsWithHolds).toHaveBeenCalled()
      expect(saveMetrics).toHaveBeenCalledWith([], 'monthInYear', expect.any(String), expect.any(Date), expect.any(Date), 2023, 1)
    })
  })

  describe('calculateBasicPeriods', () => {
    test('should calculate basic periods', async () => {
      await calculateBasicPeriods()
      expect(fetchMetricsData).toHaveBeenCalledTimes(5)
      expect(fetchMetricsData).toHaveBeenCalledWith({}, null, null, 'all')
      expect(fetchMetricsData).toHaveBeenCalledWith({}, null, null, 'ytd')
      expect(fetchMetricsData).toHaveBeenCalledWith({}, null, null, 'month')
      expect(fetchMetricsData).toHaveBeenCalledWith({}, null, null, 'week')
      expect(fetchMetricsData).toHaveBeenCalledWith({}, null, null, 'day')
    })
  })

  describe('calculateYearlyMetrics', () => {
    test('should calculate yearly metrics', async () => {
      await calculateYearlyMetrics(2023)
      expect(fetchMetricsData).toHaveBeenCalledTimes(13)
      expect(fetchMetricsData).toHaveBeenCalledWith({}, 2023, null, 'year')
      for (let month = 1; month <= 12; month++) {
        expect(fetchMetricsData).toHaveBeenCalledWith({}, 2023, month, 'monthInYear')
      }
    })
  })

  describe('calculateAllMetrics', () => {
    test('should calculate all metrics successfully', async () => {
      db.sequelize.query.mockResolvedValue([{ year: 2023 }, { year: 2024 }])
      await calculateAllMetrics()
      expect(console.log).toHaveBeenCalledWith('Starting metrics calculation...')
      expect(fetchMetricsData).toHaveBeenCalledTimes(5 + 2 * 13) // 31
      expect(db.sequelize.query).toHaveBeenCalledWith(
        'SELECT DISTINCT EXTRACT(YEAR FROM "received") AS year FROM "paymentRequests" ORDER BY year DESC',
        { type: db.sequelize.QueryTypes.SELECT }
      )
      expect(console.log).toHaveBeenCalledWith('✓ All metrics calculated successfully')
    })

    test('should handle error in calculating metrics', async () => {
      db.sequelize.query.mockRejectedValue(new Error('DB error'))
      await expect(calculateAllMetrics()).rejects.toThrow('DB error')
      expect(fetchMetricsData).toHaveBeenCalledTimes(5)
      expect(console.error).toHaveBeenCalledWith('✗ Error calculating metrics:', expect.any(Error))
    })

    test('should skip null year', async () => {
      db.sequelize.query.mockResolvedValue([{ year: null }, { year: 2023 }])
      await calculateAllMetrics()
      expect(fetchMetricsData).toHaveBeenCalledTimes(5 + 13) // 18
    })
  })
})
