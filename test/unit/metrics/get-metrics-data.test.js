jest.mock('../../../app/data', () => {
  const Op = {
    gte: Symbol('gte'),
    lt: Symbol('lt')
  }

  return {
    sequelize: {
      query: jest.fn(),
      QueryTypes: {
        SELECT: 'SELECT'
      }
    },
    Sequelize: { Op }
  }
})

jest.mock('../../../app/metrics/build-metrics', () => ({
  buildMetricsQuery: jest.fn(),
  buildQueryWhereClausesAndReplacements: jest.fn()
}))

const db = require('../../../app/data')
const {
  buildMetricsQuery,
  buildQueryWhereClausesAndReplacements
} = require('../../../app/metrics/build-metrics')

const {
  getDateRangeForAll,
  getDateRangeForYTD,
  getDateRangeForYear,
  getDateRangeForMonthInYear,
  getDateRangeForRelativePeriod,
  fetchMetricsData,
  fetchHoldsData,
  mergeMetricsWithHolds
} = require('../../../app/metrics/get-metrics-data')

describe('get metrics data', () => {
  const metricsResults = [{
    schemeId: 1,
    year: 2023,
    month: 1,
    payments: 100,
    value: 1000
  }]

  const holdsResults = [{
    schemeId: 1,
    year: 2023,
    month: 1,
    paymentsOnHold: '5',
    valueOnHold: '500'
  }]

  beforeEach(() => {
    jest.clearAllMocks()

    buildQueryWhereClausesAndReplacements.mockReturnValue({
      whereClauses: [],
      replacements: {}
    })
    buildMetricsQuery.mockReturnValue('SELECT * FROM metrics')
    db.sequelize.query.mockResolvedValue(metricsResults)
  })

  describe('date ranges', () => {
    test('returns no range for all periods', () => {
      expect(getDateRangeForAll()).toEqual({
        startDate: null,
        endDate: null
      })
    })

    test('returns the year-to-date range', () => {
      expect(getDateRangeForYTD(new Date(2023, 5, 15))).toEqual({
        startDate: new Date(2023, 0, 1),
        endDate: null
      })
    })

    test('returns a year range', () => {
      expect(getDateRangeForYear(2023)).toEqual({
        startDate: new Date(2023, 0, 1),
        endDate: new Date(2024, 0, 1),
        year: 2023
      })
    })

    test('returns a month range', () => {
      expect(getDateRangeForMonthInYear(2023, 6)).toEqual({
        startDate: new Date(2023, 5, 1),
        endDate: new Date(2023, 6, 1),
        year: 2023,
        month: 6
      })
    })

    test('returns the correct range for December', () => {
      expect(getDateRangeForMonthInYear(2023, 12)).toEqual({
        startDate: new Date(2023, 11, 1),
        endDate: new Date(2024, 0, 1),
        year: 2023,
        month: 12
      })
    })

    test('returns a relative date range', () => {
      const now = new Date(2023, 5, 15)
      const result = getDateRangeForRelativePeriod(now, 7)

      expect(result.startDate).toEqual(new Date(2023, 5, 8))
      expect(result.endDate).toBeNull()
    })
  })

  describe('fetchMetricsData', () => {
    test('fetches all-period data without grouping', async () => {
      await fetchMetricsData({}, null, null, 'all')

      expect(buildMetricsQuery).toHaveBeenCalledWith('', false, false)
      expect(db.sequelize.query).toHaveBeenCalledWith(
        'SELECT * FROM metrics',
        {
          replacements: {},
          type: 'SELECT',
          raw: true
        }
      )
    })

    test('fetches year-period data grouped by year only', async () => {
      await fetchMetricsData({}, null, null, 'year')

      expect(buildMetricsQuery).toHaveBeenCalledWith('', true, false)
    })

    test('fetches default-period data grouped by year and month', async () => {
      await fetchMetricsData({})

      expect(buildMetricsQuery).toHaveBeenCalledWith('', true, true)
    })

    test('adds where clauses and replacements', async () => {
      buildQueryWhereClausesAndReplacements.mockReturnValue({
        whereClauses: ['schemeId = :schemeId', 'year = :year'],
        replacements: {
          schemeId: 1,
          year: 2023
        }
      })

      await fetchMetricsData({ schemeId: 1, year: 2023 }, null, null, 'year')

      expect(buildMetricsQuery).toHaveBeenCalledWith(
        'WHERE schemeId = :schemeId AND year = :year',
        true,
        false
      )
      expect(db.sequelize.query).toHaveBeenCalledWith(
        'SELECT * FROM metrics',
        expect.objectContaining({
          replacements: {
            schemeId: 1,
            year: 2023
          },
          type: 'SELECT',
          raw: true
        })
      )
    })

    test('returns the query result', async () => {
      db.sequelize.query.mockResolvedValue(metricsResults)

      await expect(fetchMetricsData({})).resolves.toBe(metricsResults)
    })
  })

  describe('fetchHoldsData', () => {
    test('fetches holds without date filters', async () => {
      db.sequelize.query.mockResolvedValue(holdsResults)

      await expect(fetchHoldsData({})).resolves.toBe(holdsResults)

      expect(db.sequelize.query).toHaveBeenCalledWith(
        expect.not.stringContaining('pr."received" >= :startDate'),
        expect.objectContaining({
          replacements: {},
          type: 'SELECT',
          raw: true
        })
      )
    })

    test('fetches holds with start and end date filters', async () => {
      const startDate = new Date(2023, 0, 1)
      const endDate = new Date(2023, 1, 1)
      const whereClause = {
        received: {
          [db.Sequelize.Op.gte]: startDate,
          [db.Sequelize.Op.lt]: endDate
        }
      }

      db.sequelize.query.mockResolvedValue(holdsResults)

      await fetchHoldsData(whereClause)

      const [query, options] = db.sequelize.query.mock.calls[0]

      expect(query).toContain('pr."received" >= :startDate')
      expect(query).toContain('pr."received" < :endDate')
      expect(options.replacements).toEqual({
        startDate,
        endDate
      })
    })
  })

  describe('mergeMetricsWithHolds', () => {
    test('merges matching hold data and converts values to numbers', () => {
      expect(mergeMetricsWithHolds(metricsResults, holdsResults)).toEqual([{
        ...metricsResults[0],
        paymentsOnHold: 5,
        valueOnHold: 500
      }])
    })

    test('uses zero values when no matching hold exists', () => {
      expect(mergeMetricsWithHolds(metricsResults, [])).toEqual([{
        ...metricsResults[0],
        paymentsOnHold: 0,
        valueOnHold: 0
      }])
    })
  })
})
