jest.mock('../../../app/config')
jest.mock('../../../app/metrics/metrics-calculator')
jest.mock('moment')

const config = require('../../../app/config')
const { calculateAllMetrics } = require('../../../app/metrics/metrics-calculator')
const moment = require('moment')
const {
  startMetricsPolling,
  stopMetricsPolling
} = require('../../../app/metrics/metrics-polling')

describe('metrics-polling', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.useFakeTimers()

    jest.spyOn(global, 'setInterval')
    jest.spyOn(global, 'setTimeout')
    jest.spyOn(global, 'clearInterval')
    jest.spyOn(global, 'clearTimeout')

    jest.spyOn(console, 'log').mockImplementation()
    jest.spyOn(console, 'error').mockImplementation()

    calculateAllMetrics.mockResolvedValue()
  })

  afterEach(() => {
    stopMetricsPolling()
    jest.useRealTimers()
    jest.restoreAllMocks()
  })

  const flushPromises = async () => {
    await Promise.resolve()
    await Promise.resolve()
  }

  const mockProductionTime = (delay = 3600000) => {
    const mockNow = {
      hour: jest.fn().mockReturnThis(),
      minute: jest.fn().mockReturnThis(),
      second: jest.fn().mockReturnThis(),
      millisecond: jest.fn().mockReturnThis(),
      isBefore: jest.fn().mockReturnValue(true),
      diff: jest.fn().mockReturnValue(delay),
      add: jest.fn().mockReturnThis(),
      format: jest.fn().mockReturnValue('2023-01-01 04:00:00')
    }

    moment.mockReturnValue(mockNow)

    return mockNow
  }

  describe('startMetricsPolling', () => {
    test('performs an initial calculation and starts development polling', () => {
      config.isDev = true
      config.metricsPollingInterval = 60000

      const result = startMetricsPolling()

      expect(calculateAllMetrics).toHaveBeenCalledTimes(1)
      expect(setInterval).toHaveBeenCalledWith(expect.any(Function), 60000)
      expect(console.log).toHaveBeenCalledWith('Starting metrics polling')
      expect(console.log).toHaveBeenCalledWith(
        'Metrics polling scheduled - interval: 60000ms (1 minutes)'
      )
      expect(result).toBeDefined()
    })

    test('performs an initial calculation and schedules production polling', () => {
      config.isDev = false
      mockProductionTime()

      const result = startMetricsPolling()

      expect(calculateAllMetrics).toHaveBeenCalledTimes(1)
      expect(setTimeout).toHaveBeenCalledWith(expect.any(Function), 3600000)
      expect(console.log).toHaveBeenCalledWith('Starting metrics polling')
      expect(console.log).toHaveBeenCalledWith(
        'Metrics polling scheduled for 2023-01-01 04:00:00 (in 60 minutes)'
      )
      expect(result).toBeDefined()
    })

    test('logs an error when the initial calculation fails', async () => {
      config.isDev = true
      config.metricsPollingInterval = 60000
      calculateAllMetrics.mockRejectedValueOnce(new Error('initial error'))

      startMetricsPolling()
      await flushPromises()

      expect(console.error).toHaveBeenCalledWith(
        'Initial metrics calculation failed:',
        expect.any(Error)
      )
    })
  })

  describe('scheduled calculations', () => {
    test('runs the scheduled development calculation', async () => {
      config.isDev = true
      config.metricsPollingInterval = 1000

      calculateAllMetrics
        .mockResolvedValueOnce()
        .mockResolvedValueOnce()

      startMetricsPolling()

      await flushPromises()
      jest.advanceTimersByTime(1000)
      await flushPromises()

      expect(calculateAllMetrics).toHaveBeenCalledTimes(2)
    })

    test('logs an error when a development calculation fails', async () => {
      config.isDev = true
      config.metricsPollingInterval = 1000

      calculateAllMetrics
        .mockResolvedValueOnce()
        .mockRejectedValueOnce(new Error('scheduled error'))

      startMetricsPolling()

      await flushPromises()
      jest.advanceTimersByTime(1000)
      await flushPromises()

      expect(console.error).toHaveBeenCalledWith(
        'Scheduled metrics calculation failed:',
        expect.any(Error)
      )
    })

    test('logs an error when a production calculation fails', async () => {
      config.isDev = false
      mockProductionTime(1000)

      calculateAllMetrics
        .mockResolvedValueOnce()
        .mockRejectedValueOnce(new Error('scheduled error'))

      startMetricsPolling()

      await flushPromises()
      jest.advanceTimersByTime(1000)
      await flushPromises()

      expect(console.error).toHaveBeenCalledWith(
        'Scheduled metrics calculation failed:',
        expect.any(Error)
      )
    })

    test('reschedules production polling after the scheduled calculation', async () => {
      config.isDev = false
      mockProductionTime(1000)

      calculateAllMetrics
        .mockResolvedValueOnce()
        .mockResolvedValueOnce()

      startMetricsPolling()

      await flushPromises()
      jest.advanceTimersByTime(1000)
      await flushPromises()

      expect(calculateAllMetrics).toHaveBeenCalledTimes(2)
      expect(setTimeout).toHaveBeenCalledTimes(2)
    })
  })

  describe('stopMetricsPolling', () => {
    test('clears development polling', () => {
      config.isDev = true
      config.metricsPollingInterval = 60000

      startMetricsPolling()
      stopMetricsPolling()

      expect(clearInterval).toHaveBeenCalled()
      expect(clearTimeout).toHaveBeenCalled()
      expect(console.log).toHaveBeenCalledWith('Metrics polling stopped')
    })

    test('does nothing when polling has not started', () => {
      stopMetricsPolling()

      expect(clearInterval).not.toHaveBeenCalled()
      expect(clearTimeout).not.toHaveBeenCalled()
      expect(console.log).not.toHaveBeenCalledWith('Metrics polling stopped')
    })
  })
})
