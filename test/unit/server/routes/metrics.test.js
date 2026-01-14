const routes = require('../../../../app/server/routes/metrics')
const handler = routes[0].handler

jest.mock('../../../../app/data')
jest.mock('../../../../app/metrics-queue')

const db = require('../../../../app/data')
const { metricsQueue } = require('../../../../app/metrics-queue')

const { PERIOD_ALL, PERIOD_YTD, PERIOD_YEAR, PERIOD_MONTH_IN_YEAR, PERIOD_MONTH, PERIOD_WEEK, PERIOD_DAY } = require('../../../../app/constants/periods')
const { HTTP_OK, HTTP_BAD_REQUEST, HTTP_INTERNAL_SERVER_ERROR } = require('../../../../app/constants/http-status-codes')

describe('Metrics Route Handler', () => {
  let mockRequest
  let mockH
  let mockResponse
  let consoleLogSpy
  let consoleErrorSpy

  beforeEach(() => {
    jest.clearAllMocks()
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation()
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation()

    mockResponse = {
      code: jest.fn().mockReturnThis()
    }
    mockH = {
      response: jest.fn().mockReturnValue(mockResponse)
    }
    mockRequest = {
      query: {}
    }

    db.sequelize = {
      fn: jest.fn(),
      col: jest.fn()
    }

    db.metric = {
      findOne: jest.fn(),
      findAll: jest.fn()
    }

    metricsQueue.enqueue = jest.fn().mockResolvedValue()
  })

  afterEach(() => {
    consoleLogSpy.mockRestore()
    consoleErrorSpy.mockRestore()
  })

  describe('Period Validation', () => {
    test('should return bad request for invalid period', async () => {
      mockRequest.query.period = 'invalid'

      await handler(mockRequest, mockH)

      expect(mockH.response).toHaveBeenCalledWith({
        error: 'Invalid period type',
        message: `Period must be one of: ${[PERIOD_ALL, PERIOD_YTD, PERIOD_YEAR, PERIOD_MONTH_IN_YEAR, PERIOD_MONTH, PERIOD_WEEK, PERIOD_DAY].join(', ')}`
      })
      expect(mockResponse.code).toHaveBeenCalledWith(HTTP_BAD_REQUEST)
    })

    test('should accept valid period all', async () => {
      mockRequest.query.period = PERIOD_ALL
      db.metric.findOne.mockResolvedValue(null)

      await handler(mockRequest, mockH)

      expect(mockH.response).toHaveBeenCalledWith({
        totalPayments: 0,
        totalValue: 0,
        totalPendingPayments: 0,
        totalPendingValue: 0,
        totalProcessedPayments: 0,
        totalProcessedValue: 0,
        totalSettledPayments: 0,
        totalSettledValue: 0,
        totalPaymentsOnHold: 0,
        totalValueOnHold: 0,
        paymentsByScheme: []
      })
      expect(mockResponse.code).toHaveBeenCalledWith(HTTP_OK)
    })

    test('should accept valid period ytd', async () => {
      mockRequest.query.period = PERIOD_YTD
      db.metric.findOne.mockResolvedValue({ maxDate: '2023-01-01' })
      db.metric.findAll.mockResolvedValue([])

      await handler(mockRequest, mockH)

      expect(db.metric.findOne).toHaveBeenCalledWith({
        attributes: [[db.sequelize.fn('MAX', db.sequelize.col('snapshot_date')), 'maxDate']],
        where: { periodType: PERIOD_YTD },
        raw: true
      })
      expect(mockResponse.code).toHaveBeenCalledWith(HTTP_OK)
    })

    test('should accept valid period month', async () => {
      mockRequest.query.period = PERIOD_MONTH
      db.metric.findOne.mockResolvedValue({ maxDate: '2023-01-01' })
      db.metric.findAll.mockResolvedValue([])

      await handler(mockRequest, mockH)

      expect(mockResponse.code).toHaveBeenCalledWith(HTTP_OK)
    })

    test('should accept valid period week', async () => {
      mockRequest.query.period = PERIOD_WEEK
      db.metric.findOne.mockResolvedValue({ maxDate: '2023-01-01' })
      db.metric.findAll.mockResolvedValue([])

      await handler(mockRequest, mockH)

      expect(mockResponse.code).toHaveBeenCalledWith(HTTP_OK)
    })

    test('should accept valid period day', async () => {
      mockRequest.query.period = PERIOD_DAY
      db.metric.findOne.mockResolvedValue({ maxDate: '2023-01-01' })
      db.metric.findAll.mockResolvedValue([])

      await handler(mockRequest, mockH)

      expect(mockResponse.code).toHaveBeenCalledWith(HTTP_OK)
    })

    test('should default to all period when not specified', async () => {
      db.metric.findOne.mockResolvedValue({ maxDate: '2023-01-01' })
      db.metric.findAll.mockResolvedValue([])

      await handler(mockRequest, mockH)

      expect(db.metric.findOne).toHaveBeenCalledWith({
        attributes: [[db.sequelize.fn('MAX', db.sequelize.col('snapshot_date')), 'maxDate']],
        where: { periodType: PERIOD_ALL },
        raw: true
      })
      expect(mockResponse.code).toHaveBeenCalledWith(HTTP_OK)
    })
  })

  describe('Year Parameter Validation', () => {
    test('should return bad request for year period without schemeYear', async () => {
      mockRequest.query.period = PERIOD_YEAR

      await handler(mockRequest, mockH)

      expect(mockH.response).toHaveBeenCalledWith({
        error: 'Missing required parameter',
        message: 'schemeYear is required for year period'
      })
      expect(mockResponse.code).toHaveBeenCalledWith(HTTP_BAD_REQUEST)
    })

    test('should accept year period with schemeYear', async () => {
      mockRequest.query.period = PERIOD_YEAR
      mockRequest.query.schemeYear = '2023'
      metricsQueue.enqueue.mockResolvedValue()
      db.metric.findOne.mockResolvedValue({ maxDate: '2023-01-01' })
      db.metric.findAll.mockResolvedValue([])

      await handler(mockRequest, mockH)

      expect(metricsQueue.enqueue).toHaveBeenCalledWith('year', 2023)
      expect(mockResponse.code).toHaveBeenCalledWith(HTTP_OK)
    })

    test('should handle error in year calculation', async () => {
      mockRequest.query.period = PERIOD_YEAR
      mockRequest.query.schemeYear = '2023'
      metricsQueue.enqueue.mockRejectedValue(new Error('Calc error'))

      await handler(mockRequest, mockH)

      expect(mockH.response).toHaveBeenCalledWith({
        error: 'Metrics calculation failed',
        message: 'Calc error'
      })
      expect(mockResponse.code).toHaveBeenCalledWith(HTTP_INTERNAL_SERVER_ERROR)
      expect(consoleErrorSpy).toHaveBeenCalledWith('Error calculating year metrics:', expect.any(Error))
    })
  })

  describe('MonthInYear Parameter Validation', () => {
    test('should return bad request for monthInYear without schemeYear', async () => {
      mockRequest.query.period = PERIOD_MONTH_IN_YEAR
      mockRequest.query.month = '1'

      await handler(mockRequest, mockH)

      expect(mockH.response).toHaveBeenCalledWith({
        error: 'Missing required parameters',
        message: 'schemeYear and month are required for monthInYear period'
      })
      expect(mockResponse.code).toHaveBeenCalledWith(HTTP_BAD_REQUEST)
    })

    test('should return bad request for monthInYear without month', async () => {
      mockRequest.query.period = PERIOD_MONTH_IN_YEAR
      mockRequest.query.schemeYear = '2023'

      await handler(mockRequest, mockH)

      expect(mockH.response).toHaveBeenCalledWith({
        error: 'Missing required parameters',
        message: 'schemeYear and month are required for monthInYear period'
      })
      expect(mockResponse.code).toHaveBeenCalledWith(HTTP_BAD_REQUEST)
    })

    test('should return bad request for invalid month below minimum', async () => {
      mockRequest.query.period = PERIOD_MONTH_IN_YEAR
      mockRequest.query.schemeYear = '2023'
      mockRequest.query.month = '0'

      await handler(mockRequest, mockH)

      expect(mockH.response).toHaveBeenCalledWith({
        error: 'Invalid month',
        message: 'Month must be between 1 and 12'
      })
      expect(mockResponse.code).toHaveBeenCalledWith(HTTP_BAD_REQUEST)
    })

    test('should return bad request for invalid month above maximum', async () => {
      mockRequest.query.period = PERIOD_MONTH_IN_YEAR
      mockRequest.query.schemeYear = '2023'
      mockRequest.query.month = '13'

      await handler(mockRequest, mockH)

      expect(mockH.response).toHaveBeenCalledWith({
        error: 'Invalid month',
        message: 'Month must be between 1 and 12'
      })
      expect(mockResponse.code).toHaveBeenCalledWith(HTTP_BAD_REQUEST)
    })

    test('should return bad request for schemeYear below minimum', async () => {
      mockRequest.query.period = PERIOD_MONTH_IN_YEAR
      mockRequest.query.schemeYear = '1999'
      mockRequest.query.month = '1'

      await handler(mockRequest, mockH)

      expect(mockH.response).toHaveBeenCalledWith({
        error: 'Invalid schemeYear',
        message: 'schemeYear must be between 2000 and 2036'
      })
      expect(mockResponse.code).toHaveBeenCalledWith(HTTP_BAD_REQUEST)
    })

    test('should return bad request for schemeYear above maximum', async () => {
      mockRequest.query.period = PERIOD_MONTH_IN_YEAR
      mockRequest.query.schemeYear = '2050'
      mockRequest.query.month = '1'

      await handler(mockRequest, mockH)

      expect(mockH.response).toHaveBeenCalledWith({
        error: 'Invalid schemeYear',
        message: 'schemeYear must be between 2000 and 2036'
      })
      expect(mockResponse.code).toHaveBeenCalledWith(HTTP_BAD_REQUEST)
    })

    test('should accept valid monthInYear params', async () => {
      mockRequest.query.period = PERIOD_MONTH_IN_YEAR
      mockRequest.query.schemeYear = '2023'
      mockRequest.query.month = '1'
      metricsQueue.enqueue.mockResolvedValue()
      db.metric.findOne.mockResolvedValue({ maxDate: '2023-01-01' })
      db.metric.findAll.mockResolvedValue([])

      await handler(mockRequest, mockH)

      expect(metricsQueue.enqueue).toHaveBeenCalledWith('monthInYear', 2023, 1)
      expect(mockResponse.code).toHaveBeenCalledWith(HTTP_OK)
    })

    test('should accept valid monthInYear with month 12', async () => {
      mockRequest.query.period = PERIOD_MONTH_IN_YEAR
      mockRequest.query.schemeYear = '2023'
      mockRequest.query.month = '12'
      metricsQueue.enqueue.mockResolvedValue()
      db.metric.findOne.mockResolvedValue({ maxDate: '2023-01-01' })
      db.metric.findAll.mockResolvedValue([])

      await handler(mockRequest, mockH)

      expect(metricsQueue.enqueue).toHaveBeenCalledWith('monthInYear', 2023, 12)
      expect(mockResponse.code).toHaveBeenCalledWith(HTTP_OK)
    })

    test('should handle error in monthInYear calculation', async () => {
      mockRequest.query.period = PERIOD_MONTH_IN_YEAR
      mockRequest.query.schemeYear = '2023'
      mockRequest.query.month = '1'
      metricsQueue.enqueue.mockRejectedValue(new Error('Calc error'))

      await handler(mockRequest, mockH)

      expect(mockH.response).toHaveBeenCalledWith({
        error: 'Metrics calculation failed',
        message: 'Calc error'
      })
      expect(mockResponse.code).toHaveBeenCalledWith(HTTP_INTERNAL_SERVER_ERROR)
      expect(consoleErrorSpy).toHaveBeenCalledWith('Error calculating monthInYear metrics:', expect.any(Error))
    })
  })

  describe('Data Fetching and Processing', () => {
    test('should fetch metrics for all period', async () => {
      mockRequest.query.period = PERIOD_ALL
      db.metric.findOne.mockResolvedValue({ maxDate: '2023-01-01' })
      db.metric.findAll.mockResolvedValue([
        {
          schemeName: 'Scheme1',
          schemeYear: null,
          totalPayments: 10,
          totalValue: '1000',
          pendingPayments: 5,
          pendingValue: '500',
          processedPayments: 3,
          processedValue: '300',
          settledPayments: 2,
          settledValue: '200',
          paymentsOnHold: 1,
          valueOnHold: '100'
        },
        {
          schemeName: 'Scheme2',
          schemeYear: null,
          totalPayments: 20,
          totalValue: '2000',
          pendingPayments: 10,
          pendingValue: '1000',
          processedPayments: 6,
          processedValue: '600',
          settledPayments: 4,
          settledValue: '400',
          paymentsOnHold: 2,
          valueOnHold: '200'
        }
      ])

      await handler(mockRequest, mockH)

      expect(db.metric.findAll).toHaveBeenCalledWith({
        where: {
          snapshotDate: '2023-01-01',
          periodType: PERIOD_ALL
        },
        order: [['schemeName', 'ASC']]
      })
      expect(mockH.response).toHaveBeenCalledWith({
        totalPayments: 30,
        totalValue: 3000,
        totalPendingPayments: 15,
        totalPendingValue: 1500,
        totalProcessedPayments: 9,
        totalProcessedValue: 900,
        totalSettledPayments: 6,
        totalSettledValue: 600,
        totalPaymentsOnHold: 3,
        totalValueOnHold: 300,
        paymentsByScheme: [
          {
            schemeName: 'Scheme1',
            schemeYear: null,
            totalPayments: 10,
            totalValue: 1000,
            pendingPayments: 5,
            pendingValue: 500,
            processedPayments: 3,
            processedValue: 300,
            settledPayments: 2,
            settledValue: 200,
            paymentsOnHold: 1,
            valueOnHold: 100
          },
          {
            schemeName: 'Scheme2',
            schemeYear: null,
            totalPayments: 20,
            totalValue: 2000,
            pendingPayments: 10,
            pendingValue: 1000,
            processedPayments: 6,
            processedValue: 600,
            settledPayments: 4,
            settledValue: 400,
            paymentsOnHold: 2,
            valueOnHold: 200
          }
        ]
      })
      expect(mockResponse.code).toHaveBeenCalledWith(HTTP_OK)
      expect(consoleLogSpy).toHaveBeenCalledWith('Most recent snapshot:', { maxDate: '2023-01-01' })
      expect(consoleLogSpy).toHaveBeenCalledWith('Found records:', 2)
    })

    test('should aggregate by scheme when no schemeYear filter', async () => {
      mockRequest.query.period = PERIOD_ALL
      db.metric.findOne.mockResolvedValue({ maxDate: '2023-01-01' })
      db.metric.findAll.mockResolvedValue([
        {
          schemeName: 'Scheme1',
          schemeYear: 2022,
          totalPayments: 10,
          totalValue: '1000',
          pendingPayments: 5,
          pendingValue: '500',
          processedPayments: 3,
          processedValue: '300',
          settledPayments: 2,
          settledValue: '200',
          paymentsOnHold: 1,
          valueOnHold: '100'
        },
        {
          schemeName: 'Scheme1',
          schemeYear: 2023,
          totalPayments: 5,
          totalValue: '500',
          pendingPayments: 2,
          pendingValue: '200',
          processedPayments: 1,
          processedValue: '100',
          settledPayments: 1,
          settledValue: '100',
          paymentsOnHold: 0,
          valueOnHold: '0'
        }
      ])

      await handler(mockRequest, mockH)

      expect(mockH.response).toHaveBeenCalledWith({
        totalPayments: 15,
        totalValue: 1500,
        totalPendingPayments: 7,
        totalPendingValue: 700,
        totalProcessedPayments: 4,
        totalProcessedValue: 400,
        totalSettledPayments: 3,
        totalSettledValue: 300,
        totalPaymentsOnHold: 1,
        totalValueOnHold: 100,
        paymentsByScheme: [
          {
            schemeName: 'Scheme1',
            schemeYear: null,
            totalPayments: 15,
            totalValue: 1500,
            pendingPayments: 7,
            pendingValue: 700,
            processedPayments: 4,
            processedValue: 400,
            settledPayments: 3,
            settledValue: 300,
            paymentsOnHold: 1,
            valueOnHold: 100
          }
        ]
      })
    })

    test('should not aggregate when schemeYear filter is applied', async () => {
      mockRequest.query.period = PERIOD_YEAR
      mockRequest.query.schemeYear = '2023'
      metricsQueue.enqueue.mockResolvedValue()
      db.metric.findOne.mockResolvedValue({ maxDate: '2023-01-01' })
      db.metric.findAll.mockResolvedValue([
        {
          schemeName: 'Scheme1',
          schemeYear: 2023,
          totalPayments: 10,
          totalValue: '1000',
          pendingPayments: 5,
          pendingValue: '500',
          processedPayments: 3,
          processedValue: '300',
          settledPayments: 2,
          settledValue: '200',
          paymentsOnHold: 1,
          valueOnHold: '100'
        }
      ])

      await handler(mockRequest, mockH)

      expect(mockH.response).toHaveBeenCalledWith({
        totalPayments: 10,
        totalValue: 1000,
        totalPendingPayments: 5,
        totalPendingValue: 500,
        totalProcessedPayments: 3,
        totalProcessedValue: 300,
        totalSettledPayments: 2,
        totalSettledValue: 200,
        totalPaymentsOnHold: 1,
        totalValueOnHold: 100,
        paymentsByScheme: [
          {
            schemeName: 'Scheme1',
            schemeYear: 2023,
            totalPayments: 10,
            totalValue: 1000,
            pendingPayments: 5,
            pendingValue: 500,
            processedPayments: 3,
            processedValue: 300,
            settledPayments: 2,
            settledValue: 200,
            paymentsOnHold: 1,
            valueOnHold: 100
          }
        ]
      })
    })

    test('should filter by schemeYear when provided', async () => {
      mockRequest.query.period = PERIOD_YEAR
      mockRequest.query.schemeYear = '2023'
      metricsQueue.enqueue.mockResolvedValue()
      db.metric.findOne.mockResolvedValue({ maxDate: '2023-01-01' })
      db.metric.findAll.mockResolvedValue([
        {
          schemeName: 'Scheme1',
          schemeYear: 2023,
          totalPayments: 10,
          totalValue: '1000',
          pendingPayments: 5,
          pendingValue: '500',
          processedPayments: 3,
          processedValue: '300',
          settledPayments: 2,
          settledValue: '200',
          paymentsOnHold: 1,
          valueOnHold: '100'
        }
      ])

      await handler(mockRequest, mockH)

      expect(db.metric.findOne).toHaveBeenCalledWith({
        attributes: [[db.sequelize.fn('MAX', db.sequelize.col('snapshot_date')), 'maxDate']],
        where: { periodType: PERIOD_YEAR, schemeYear: 2023 },
        raw: true
      })
      expect(db.metric.findAll).toHaveBeenCalledWith({
        where: {
          snapshotDate: '2023-01-01',
          periodType: PERIOD_YEAR,
          schemeYear: 2023
        },
        order: [['schemeName', 'ASC']]
      })
    })

    test('should not filter by schemeYear for all period', async () => {
      mockRequest.query.period = PERIOD_ALL
      mockRequest.query.schemeYear = '2023'
      db.metric.findOne.mockResolvedValue({ maxDate: '2023-01-01' })
      db.metric.findAll.mockResolvedValue([])

      await handler(mockRequest, mockH)

      expect(db.metric.findOne).toHaveBeenCalledWith({
        attributes: [[db.sequelize.fn('MAX', db.sequelize.col('snapshot_date')), 'maxDate']],
        where: { periodType: PERIOD_ALL },
        raw: true
      })
      expect(db.metric.findAll).toHaveBeenCalledWith({
        where: {
          snapshotDate: '2023-01-01',
          periodType: PERIOD_ALL
        },
        order: [['schemeName', 'ASC']]
      })
    })

    test('should return empty response when no snapshot found', async () => {
      mockRequest.query.period = PERIOD_ALL
      db.metric.findOne.mockResolvedValue(null)

      await handler(mockRequest, mockH)

      expect(mockH.response).toHaveBeenCalledWith({
        totalPayments: 0,
        totalValue: 0,
        totalPendingPayments: 0,
        totalPendingValue: 0,
        totalProcessedPayments: 0,
        totalProcessedValue: 0,
        totalSettledPayments: 0,
        totalSettledValue: 0,
        totalPaymentsOnHold: 0,
        totalValueOnHold: 0,
        paymentsByScheme: []
      })
      expect(mockResponse.code).toHaveBeenCalledWith(HTTP_OK)
    })

    test('should return empty response when maxDate is null', async () => {
      mockRequest.query.period = PERIOD_ALL
      db.metric.findOne.mockResolvedValue({ maxDate: null })

      await handler(mockRequest, mockH)

      expect(mockH.response).toHaveBeenCalledWith({
        totalPayments: 0,
        totalValue: 0,
        totalPendingPayments: 0,
        totalPendingValue: 0,
        totalProcessedPayments: 0,
        totalProcessedValue: 0,
        totalSettledPayments: 0,
        totalSettledValue: 0,
        totalPaymentsOnHold: 0,
        totalValueOnHold: 0,
        paymentsByScheme: []
      })
      expect(mockResponse.code).toHaveBeenCalledWith(HTTP_OK)
    })

    test('should filter out null scheme names', async () => {
      mockRequest.query.period = PERIOD_ALL
      db.metric.findOne.mockResolvedValue({ maxDate: '2023-01-01' })
      db.metric.findAll.mockResolvedValue([
        {
          schemeName: 'Scheme1',
          schemeYear: null,
          totalPayments: 10,
          totalValue: '1000',
          pendingPayments: 5,
          pendingValue: '500',
          processedPayments: 3,
          processedValue: '300',
          settledPayments: 2,
          settledValue: '200',
          paymentsOnHold: 1,
          valueOnHold: '100'
        },
        {
          schemeName: null,
          schemeYear: null,
          totalPayments: 5,
          totalValue: '500',
          pendingPayments: 2,
          pendingValue: '200',
          processedPayments: 1,
          processedValue: '100',
          settledPayments: 1,
          settledValue: '100',
          paymentsOnHold: 0,
          valueOnHold: '0'
        }
      ])

      await handler(mockRequest, mockH)

      const response = mockH.response.mock.calls[0][0]
      expect(response.paymentsByScheme.length).toBe(1)
      expect(response.paymentsByScheme[0].schemeName).toBe('Scheme1')
      // Totals should only include Scheme1
      expect(response.totalPayments).toBe(10)
    })
  })

  describe('Error Handling', () => {
    test('should handle unexpected errors in fetching', async () => {
      mockRequest.query.period = PERIOD_ALL
      db.metric.findOne.mockRejectedValue(new Error('DB error'))

      await handler(mockRequest, mockH)

      expect(mockH.response).toHaveBeenCalledWith({
        error: 'Internal server error',
        message: 'An error occurred while fetching metrics'
      })
      expect(mockResponse.code).toHaveBeenCalledWith(HTTP_INTERNAL_SERVER_ERROR)
      expect(consoleErrorSpy).toHaveBeenCalledWith('Error fetching metrics:', expect.any(Error))
    })

    test('should handle error in findAll', async () => {
      mockRequest.query.period = PERIOD_ALL
      db.metric.findOne.mockResolvedValue({ maxDate: '2023-01-01' })
      db.metric.findAll.mockRejectedValue(new Error('Query error'))

      await handler(mockRequest, mockH)

      expect(mockH.response).toHaveBeenCalledWith({
        error: 'Internal server error',
        message: 'An error occurred while fetching metrics'
      })
      expect(mockResponse.code).toHaveBeenCalledWith(HTTP_INTERNAL_SERVER_ERROR)
    })
  })

  describe('Route Configuration', () => {
    test('should have correct method', () => {
      expect(routes[0].method).toBe('GET')
    })

    test('should have correct path', () => {
      expect(routes[0].path).toBe('/metrics')
    })

    test('should have handler function', () => {
      expect(typeof routes[0].handler).toBe('function')
    })
  })

  describe('Metrics Queue Integration', () => {
    test('should enqueue year calculation', async () => {
      mockRequest.query.period = PERIOD_YEAR
      mockRequest.query.schemeYear = '2023'
      metricsQueue.enqueue.mockResolvedValue()
      db.metric.findOne.mockResolvedValue({ maxDate: '2023-01-01' })
      db.metric.findAll.mockResolvedValue([])

      await handler(mockRequest, mockH)

      expect(metricsQueue.enqueue).toHaveBeenCalledWith('year', 2023)
    })

    test('should enqueue monthInYear calculation', async () => {
      mockRequest.query.period = PERIOD_MONTH_IN_YEAR
      mockRequest.query.schemeYear = '2023'
      mockRequest.query.month = '6'
      metricsQueue.enqueue.mockResolvedValue()
      db.metric.findOne.mockResolvedValue({ maxDate: '2023-01-01' })
      db.metric.findAll.mockResolvedValue([])

      await handler(mockRequest, mockH)

      expect(metricsQueue.enqueue).toHaveBeenCalledWith('monthInYear', 2023, 6)
    })

    test('should not enqueue for other periods', async () => {
      mockRequest.query.period = PERIOD_YTD
      db.metric.findOne.mockResolvedValue({ maxDate: '2023-01-01' })
      db.metric.findAll.mockResolvedValue([])

      await handler(mockRequest, mockH)

      expect(metricsQueue.enqueue).not.toHaveBeenCalled()
    })
  })

  describe('Response Formatting', () => {
    test('should format response with all total fields', async () => {
      mockRequest.query.period = PERIOD_ALL
      db.metric.findOne.mockResolvedValue({ maxDate: '2023-01-01' })
      db.metric.findAll.mockResolvedValue([
        {
          schemeName: 'Scheme1',
          schemeYear: null,
          totalPayments: 10,
          totalValue: '1000',
          pendingPayments: 5,
          pendingValue: '500',
          processedPayments: 3,
          processedValue: '300',
          settledPayments: 2,
          settledValue: '200',
          paymentsOnHold: 1,
          valueOnHold: '100'
        }
      ])

      await handler(mockRequest, mockH)

      const response = mockH.response.mock.calls[0][0]
      expect(response).toHaveProperty('totalPayments')
      expect(response).toHaveProperty('totalValue')
      expect(response).toHaveProperty('totalPendingPayments')
      expect(response).toHaveProperty('totalPendingValue')
      expect(response).toHaveProperty('totalProcessedPayments')
      expect(response).toHaveProperty('totalProcessedValue')
      expect(response).toHaveProperty('totalSettledPayments')
      expect(response).toHaveProperty('totalSettledValue')
      expect(response).toHaveProperty('totalPaymentsOnHold')
      expect(response).toHaveProperty('totalValueOnHold')
      expect(response).toHaveProperty('paymentsByScheme')
    })

    test('should format scheme metrics with all fields', async () => {
      mockRequest.query.period = PERIOD_ALL
      db.metric.findOne.mockResolvedValue({ maxDate: '2023-01-01' })
      db.metric.findAll.mockResolvedValue([
        {
          schemeName: 'Scheme1',
          schemeYear: null,
          totalPayments: 10,
          totalValue: '1000',
          pendingPayments: 5,
          pendingValue: '500',
          processedPayments: 3,
          processedValue: '300',
          settledPayments: 2,
          settledValue: '200',
          paymentsOnHold: 1,
          valueOnHold: '100'
        }
      ])

      await handler(mockRequest, mockH)

      const response = mockH.response.mock.calls[0][0]
      const scheme = response.paymentsByScheme[0]
      expect(scheme).toHaveProperty('schemeName')
      expect(scheme).toHaveProperty('schemeYear')
      expect(scheme).toHaveProperty('totalPayments')
      expect(scheme).toHaveProperty('totalValue')
      expect(scheme).toHaveProperty('pendingPayments')
      expect(scheme).toHaveProperty('pendingValue')
      expect(scheme).toHaveProperty('processedPayments')
      expect(scheme).toHaveProperty('processedValue')
      expect(scheme).toHaveProperty('settledPayments')
      expect(scheme).toHaveProperty('settledValue')
      expect(scheme).toHaveProperty('paymentsOnHold')
      expect(scheme).toHaveProperty('valueOnHold')
    })
  })
})
