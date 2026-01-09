const { startMetricsPolling, stopMetricsPolling } = require('../../app/metrics-polling')

jest.mock('../../app/config')
jest.mock('../../app/metrics-calculator')
jest.mock('moment')

const config = require('../../app/config')
const { calculateAllMetrics } = require('../../app/metrics-calculator')
const moment = require('moment')

describe('Metrics Polling', () => {
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
    jest.useRealTimers()
    jest.restoreAllMocks()
  })

  describe('startMetricsPolling', () => {
    test('should start polling in dev mode', () => {
      config.isDev = true
      config.metricsPollingInterval = 60000

      const result = startMetricsPolling()

      expect(calculateAllMetrics).toHaveBeenCalled()
      expect(setInterval).toHaveBeenCalledWith(expect.any(Function), 60000)
      expect(console.log).toHaveBeenCalledWith('Starting metrics polling')
      expect(console.log).toHaveBeenCalledWith('Metrics polling scheduled - interval: 60000ms (1 minutes)')
      expect(result).toBeDefined()
    })

    test('should start polling in prod mode', () => {
      config.isDev = false
      const mockNow = {
        hour: jest.fn().mockReturnThis(),
        minute: jest.fn().mockReturnThis(),
        second: jest.fn().mockReturnThis(),
        millisecond: jest.fn().mockReturnThis(),
        isBefore: jest.fn().mockReturnValue(true),
        diff: jest.fn().mockReturnValue(3600000),
        add: jest.fn().mockReturnThis(),
        format: jest.fn().mockReturnValue('2023-01-01 03:00:00')
      }
      moment.mockReturnValue(mockNow)

      const result = startMetricsPolling()

      expect(calculateAllMetrics).toHaveBeenCalled()
      expect(setTimeout).toHaveBeenCalledWith(expect.any(Function), 3600000)
      expect(console.log).toHaveBeenCalledWith('Starting metrics polling')
      expect(console.log).toHaveBeenCalledWith('Metrics polling scheduled for 2023-01-01 03:00:00 (in 60 minutes)')
      expect(result).toBeDefined()
    })

    test('should handle initial calculation error', async () => {
      calculateAllMetrics.mockRejectedValue(new Error('error'))
      config.isDev = true
      config.metricsPollingInterval = 60000

      const result = startMetricsPolling()
      await Promise.resolve()

      expect(result).toBeDefined()
      expect(console.error).toHaveBeenCalledWith('Initial metrics calculation failed:', expect.any(Error))
    })
  })

  describe('stopMetricsPolling', () => {
    test('should stop polling', () => {
      config.isDev = true
      startMetricsPolling()

      stopMetricsPolling()

      expect(clearInterval).toHaveBeenCalled()
      expect(console.log).toHaveBeenCalledWith('Metrics polling stopped')
    })

    test('should do nothing if not started', () => {
      stopMetricsPolling()

      expect(clearInterval).not.toHaveBeenCalled()
      expect(clearTimeout).not.toHaveBeenCalled()
    })
  })

  describe('scheduleNextRun behavior', () => {
    test('should reschedule in prod after timeout', () => {
      config.isDev = false
      const mockNow = {
        hour: jest.fn().mockReturnThis(),
        minute: jest.fn().mockReturnThis(),
        second: jest.fn().mockReturnThis(),
        millisecond: jest.fn().mockReturnThis(),
        isBefore: jest.fn().mockReturnValue(true),
        diff: jest.fn().mockReturnValue(1000),
        add: jest.fn().mockReturnThis(),
        format: jest.fn().mockReturnValue('2023-01-01 03:00:00')
      }
      moment.mockReturnValue(mockNow)

      startMetricsPolling()

      jest.advanceTimersByTime(1000)

      expect(calculateAllMetrics).toHaveBeenCalledTimes(2)
    })

    test('should run interval in dev', () => {
      config.isDev = true
      config.metricsPollingInterval = 1000

      startMetricsPolling()

      jest.advanceTimersByTime(1000)

      expect(calculateAllMetrics).toHaveBeenCalledTimes(2)
    })

    test('should handle scheduled calculation error in dev', async () => {
      config.isDev = true
      config.metricsPollingInterval = 1000
      calculateAllMetrics.mockResolvedValueOnce()
      calculateAllMetrics.mockRejectedValueOnce(new Error('scheduled error'))

      startMetricsPolling()

      jest.advanceTimersByTime(1000)
      await Promise.resolve()

      expect(console.error).toHaveBeenCalledWith('Scheduled metrics calculation failed:', expect.any(Error))
    })

    test('should handle scheduled calculation error in prod', async () => {
      config.isDev = false
      const mockNow = {
        hour: jest.fn().mockReturnThis(),
        minute: jest.fn().mockReturnThis(),
        second: jest.fn().mockReturnThis(),
        millisecond: jest.fn().mockReturnThis(),
        isBefore: jest.fn().mockReturnValue(true),
        diff: jest.fn().mockReturnValue(1000),
        add: jest.fn().mockReturnThis(),
        format: jest.fn().mockReturnValue('2023-01-01 03:00:00')
      }
      moment.mockReturnValue(mockNow)
      calculateAllMetrics.mockResolvedValueOnce()
      calculateAllMetrics.mockRejectedValueOnce(new Error('scheduled error'))

      startMetricsPolling()

      jest.advanceTimersByTime(1000)
      await Promise.resolve()

      expect(console.error).toHaveBeenCalledWith('Scheduled metrics calculation failed:', expect.any(Error))
    })
  })
})
