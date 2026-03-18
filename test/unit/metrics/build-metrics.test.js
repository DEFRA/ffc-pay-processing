jest.mock('../../../app/data', () => {
  const Op = { gte: Symbol('gte'), lt: Symbol('lt') }
  return {
    Sequelize: { Op }
  }
})
const db = require('../../../app/data')
const { buildWhereClauseForDateRange, buildQueryWhereClausesAndReplacements, buildMetricsQuery } = require('../../../app/metrics/build-metrics')

describe('Build Metrics', () => {
  describe('buildWhereClauseForDateRange', () => {
    test('should build where clause with dates', () => {
      const start = new Date(2023, 0, 1)
      const end = new Date(2024, 0, 1)
      const result = buildWhereClauseForDateRange(start, end)
      expect(result.received[db.Sequelize.Op.gte]).toEqual(start)
      expect(result.received[db.Sequelize.Op.lt]).toEqual(end)
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
      const schemeWhereClause = { received: { [db.Sequelize.Op.gte]: start, [db.Sequelize.Op.lt]: end } }
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

    test('should build query without year for all', () => {
      const query = buildMetricsQuery('', false)
      expect(query).not.toContain('EXTRACT(YEAR FROM pr."received") AS "year"')
      expect(query).toContain('GROUP BY "month", pr."schemeId"')
    })
  })
})
