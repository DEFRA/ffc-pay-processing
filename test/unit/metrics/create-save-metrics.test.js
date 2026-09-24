const { createKnexMock } = require('../../helpers/mock-knex')

const mockDb = createKnexMock(['metric'])

jest.mock('../../../app/database', () => ({
  client: mockDb.knex,
  transaction: mockDb.transaction,
  close: mockDb.close,
  ...mockDb.tables
}))
jest.mock('../../../app/metrics/get-metrics-data', () => ({
  getSchemeNameById: jest.fn()
}))
const { getSchemeNameById } = require('../../../app/metrics/get-metrics-data')
const { parseIntOrZero, createMetricRecord, saveMetrics } = require('../../../app/metrics/create-save-metrics')

describe('Create Save Metrics', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    getSchemeNameById.mockReturnValue('SFI')
    mockDb.builder.resolves(undefined)
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
      const result = createMetricRecord({}, 'period', '2023-01-01', null, null, 2023, 1)
      expect(result.schemeName).toBe('SFI')
      expect(result.periodType).toBe('period')
      expect(result.schemeYear).toBe(2023)
      expect(result.monthInYear).toBe(1)
    })

    test('should create metric record with unknown scheme', () => {
      getSchemeNameById.mockReturnValue(null)
      const result = createMetricRecord({}, 'period', '2023-01-01', null, null, 2023, 1)
      expect(result.schemeName).toBe(null)
    })

    test('should handle invalid numbers', () => {
      const result = createMetricRecord({ totalPayments: 'abc' }, 'period', '2023-01-01', null, null, 2023, 1)
      expect(result.totalPayments).toBe(0)
    })
  })

  describe('saveMetrics', () => {
    test('should look up an existing metric by snake case columns', async () => {
      await saveMetrics([{}], 'period', '2023-01-01', null, null, 2023, 1)
      expect(mockDb.builder.where).toHaveBeenCalledWith({
        period_type: 'period',
        scheme_name: 'SFI',
        scheme_year: 2023,
        month_in_year: 1
      })
      expect(mockDb.builder.first).toHaveBeenCalledTimes(1)
    })

    test('should insert new metric with snake case columns if not exists', async () => {
      await saveMetrics([{ totalPayments: '3' }], 'period', '2023-01-01', null, null, 2023, 1)
      expect(mockDb.builder.insert).toHaveBeenCalledWith(expect.objectContaining({
        snapshot_date: '2023-01-01',
        period_type: 'period',
        scheme_name: 'SFI',
        scheme_year: 2023,
        month_in_year: 1,
        total_payments: 3
      }))
      expect(mockDb.builder.update).not.toHaveBeenCalled()
    })

    test('should update existing metric', async () => {
      mockDb.builder.resolves({ id: 1 })
      await saveMetrics([{}], 'period', '2023-01-01', null, null, 2023, 1)
      expect(mockDb.builder.where).toHaveBeenCalledWith({ id: 1 })
      expect(mockDb.builder.update).toHaveBeenCalledWith(expect.objectContaining({ period_type: 'period' }))
      expect(mockDb.builder.insert).not.toHaveBeenCalled()
    })
  })
})
