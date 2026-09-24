jest.mock('ffc-pay-schemes', () => ({
  getSchemeNameFromSchemeId: jest.fn()
}))

jest.mock('../../../app/data', () => ({
  metric: {
    findOne: jest.fn(),
    update: jest.fn(),
    create: jest.fn()
  }
}))

const { getSchemeNameFromSchemeId } = require('ffc-pay-schemes')
const db = require('../../../app/data')
const {
  parseIntOrZero,
  createMetricRecord,
  saveMetrics
} = require('../../../app/metrics/create-save-metrics')

describe('create-save-metrics', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    getSchemeNameFromSchemeId.mockReturnValue('SFI')
    db.metric.findOne.mockResolvedValue(null)
    db.metric.update.mockResolvedValue([1])
    db.metric.create.mockResolvedValue({ id: 1 })
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
    test('creates a metric when no existing record is found', async () => {
      const results = [{ schemeId: 1, totalPayments: '10' }]

      await saveMetrics(
        results,
        'MONTH',
        '2023-01-31',
        '2023-01-01',
        '2023-01-31',
        2023,
        1
      )

      expect(db.metric.findOne).toHaveBeenCalledWith({
        where: {
          periodType: 'MONTH',
          schemeName: 'SFI',
          schemeYear: 2023,
          monthInYear: 1
        }
      })
      expect(db.metric.create).toHaveBeenCalledWith(
        expect.objectContaining({
          schemeName: 'SFI',
          totalPayments: 10
        })
      )
      expect(db.metric.update).not.toHaveBeenCalled()
    })

    test('updates an existing metric', async () => {
      db.metric.findOne.mockResolvedValue({ id: 123 })

      await saveMetrics(
        [{ schemeId: 1 }],
        'YEAR',
        '2023-12-31',
        null,
        null,
        2023
      )

      expect(db.metric.update).toHaveBeenCalledWith(
        expect.objectContaining({
          periodType: 'YEAR',
          schemeName: 'SFI',
          schemeYear: 2023,
          monthInYear: null
        }),
        { where: { id: 123 } }
      )
      expect(db.metric.create).not.toHaveBeenCalled()
    })

    test('saves every result', async () => {
      await saveMetrics(
        [{ schemeId: 1 }, { schemeId: 2 }],
        'YEAR',
        '2023-12-31'
      )

      expect(db.metric.findOne).toHaveBeenCalledTimes(2)
      expect(db.metric.create).toHaveBeenCalledTimes(2)
    })
  })
})
