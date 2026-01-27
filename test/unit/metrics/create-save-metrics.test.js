jest.mock('../../../app/data')
jest.mock('../../../app/metrics/get-metrics-data', () => ({
  getSchemeNameById: jest.fn()
}))
const db = require('../../../app/data')
const { getSchemeNameById } = require('../../../app/metrics/get-metrics-data')
const { parseIntOrZero, createMetricRecord, saveMetrics } = require('../../../app/metrics/create-save-metrics')

describe('Create Save Metrics', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    getSchemeNameById.mockReturnValue('SFI')
    db.metric = {
      findOne: jest.fn().mockResolvedValue(null),
      update: jest.fn().mockResolvedValue([1]),
      create: jest.fn().mockResolvedValue({ id: 1 })
    }
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
    test('should create new metric if not exists', async () => {
      const results = [{}]
      await saveMetrics(results, 'period', '2023-01-01', null, null, 2023, 1)
      expect(db.metric.create).toHaveBeenCalled()
    })

    test('should update existing metric', async () => {
      db.metric.findOne.mockResolvedValue({ id: 1 })
      const results = [{}]
      await saveMetrics(results, 'period', '2023-01-01', null, null, 2023, 1)
      expect(db.metric.update).toHaveBeenCalled()
    })
  })
})
