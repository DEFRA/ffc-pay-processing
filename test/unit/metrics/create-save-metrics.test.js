jest.mock('ffc-pay-schemes', () => ({
  getSchemeNameFromSchemeId: jest.fn()
}))

const { createKnexMock } = require('../../helpers/mock-knex')

const mockDb = createKnexMock(['metric'])

jest.mock('../../../app/database', () => ({
  client: mockDb.knex,
  transaction: mockDb.transaction,
  close: mockDb.close,
  ...mockDb.tables
}))

const { getSchemeNameFromSchemeId } = require('ffc-pay-schemes')
const {
  parseIntOrZero,
  createMetricRecord,
  saveMetrics
} = require('../../../app/metrics/create-save-metrics')

describe('create-save-metrics', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    getSchemeNameFromSchemeId.mockReturnValue('SFI')
    mockDb.builder.resolves(undefined)
  })

  describe('parseIntOrZero', () => {
    test('parses a valid integer', () => {
      expect(parseIntOrZero('10')).toBe(10)
      expect(parseIntOrZero('10.5')).toBe(10)
    })

    test('returns zero for invalid or empty values', () => {
      expect(parseIntOrZero('abc')).toBe(0)
      expect(parseIntOrZero(null)).toBe(0)
      expect(parseIntOrZero(undefined)).toBe(0)
      expect(parseIntOrZero('')).toBe(0)
    })
  })

  describe('createMetricRecord', () => {
    test('creates a metric record with parsed values and metadata', () => {
      const result = createMetricRecord(
        {
          schemeId: 1,
          totalPayments: '10',
          totalValue: '1000',
          pendingPayments: '2',
          pendingValue: '200',
          processedPayments: '3',
          processedValue: '300',
          settledPayments: '4',
          settledValue: '400',
          paymentsOnHold: '1',
          valueOnHold: '100'
        },
        'MONTH',
        '2023-01-31',
        '2023-01-01',
        '2023-01-31',
        2023,
        1
      )

      expect(getSchemeNameFromSchemeId).toHaveBeenCalledWith(1)
      expect(result).toEqual({
        snapshotDate: '2023-01-31',
        periodType: 'MONTH',
        schemeName: 'SFI',
        schemeYear: 2023,
        monthInYear: 1,
        totalPayments: 10,
        totalValue: 1000,
        pendingPayments: 2,
        pendingValue: 200,
        processedPayments: 3,
        processedValue: 300,
        settledPayments: 4,
        settledValue: 400,
        paymentsOnHold: 1,
        valueOnHold: 100,
        dataStartDate: '2023-01-01',
        dataEndDate: '2023-01-31'
      })
    })

    test('uses defaults and zero for missing values', () => {
      const result = createMetricRecord(
        { schemeId: 2 },
        'YEAR',
        '2023-12-31',
        null,
        null,
        undefined
      )

      expect(result.schemeYear).toBeNull()
      expect(result.monthInYear).toBeNull()
      expect(result.totalPayments).toBe(0)
      expect(result.totalValue).toBe(0)
      expect(result.paymentsOnHold).toBe(0)
    })

    test('uses the returned scheme name', () => {
      getSchemeNameFromSchemeId.mockReturnValue(null)

      const result = createMetricRecord(
        { schemeId: 99 },
        'YEAR',
        '2023-12-31',
        null,
        null
      )

      expect(result.schemeName).toBeNull()
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

    test('saves every result', async () => {
      await saveMetrics([{}, {}], 'period', '2023-01-01', null, null, 2023, 1)
      expect(mockDb.tables.metric).toHaveBeenCalledTimes(4)
    })
  })
})
