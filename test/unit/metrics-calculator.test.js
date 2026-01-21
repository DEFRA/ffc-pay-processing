const { calculateAllMetrics } = require('../../app/metrics-calculator')

jest.mock('../../app/data')
jest.mock('../../app/constants/schemes')

const db = require('../../app/data')
const schemes = require('../../app/constants/schemes')

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
      db.paymentRequest.findAll.mockResolvedValue([{ year: 2023 }, { year: 2022 }])

      await calculateAllMetrics()

      expect(db.paymentRequest.findAll).toHaveBeenCalledWith({
        attributes: [[db.sequelize.fn('DISTINCT', db.sequelize.col('marketingYear')), 'year']],
        order: [['marketingYear', 'DESC']],
        raw: true
      })
      expect(consoleLogSpy).toHaveBeenCalledWith('Starting metrics calculation...')
      expect(consoleLogSpy).toHaveBeenCalledWith('✓ All metrics calculated successfully')
    })

    test('should calculate basic periods', async () => {
      db.paymentRequest.findAll.mockResolvedValue([])

      await calculateAllMetrics()

      expect(db.sequelize.query).toHaveBeenCalledTimes(10)
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
})
