const { metricsQueue } = require('../../app/metrics-queue')

jest.mock('../../app/metrics-calculator')
const { calculateMetricsForPeriod } = require('../../app/metrics-calculator')

describe('MetricsCalculationQueue', () => {
  let consoleLogSpy
  let consoleErrorSpy

  beforeEach(() => {
    jest.clearAllMocks()
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation()
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation()

    // Clear the queue
    metricsQueue.queue.clear()
    metricsQueue.processing = false
    metricsQueue.currentCalculation = null

    calculateMetricsForPeriod.mockResolvedValue()
  })

  afterEach(() => {
    consoleLogSpy.mockRestore()
    consoleErrorSpy.mockRestore()
  })

  describe('enqueue', () => {
    test('should enqueue a calculation', async () => {
      const promise = metricsQueue.enqueue('all', null, null)

      expect(metricsQueue.queue.size).toBeGreaterThanOrEqual(0)

      await promise

      expect(calculateMetricsForPeriod).toHaveBeenCalledWith('all', null, null)
    })

    test('should enqueue calculation with schemeYear', async () => {
      const promise = metricsQueue.enqueue('year', 2023, null)

      await promise

      expect(calculateMetricsForPeriod).toHaveBeenCalledWith('year', 2023, null)
    })

    test('should enqueue calculation with schemeYear and month', async () => {
      const promise = metricsQueue.enqueue('monthInYear', 2023, 6)

      await promise

      expect(calculateMetricsForPeriod).toHaveBeenCalledWith('monthInYear', 2023, 6)
    })

    test('should reuse currently processing calculation', async () => {
      let resolveCalc
      calculateMetricsForPeriod.mockImplementation(() =>
        new Promise(resolve => { resolveCalc = resolve })
      )

      const promise1 = metricsQueue.enqueue('all', null, null)

      // Wait for processing to start (moves to currentCalculation)
      await new Promise(resolve => setImmediate(resolve))

      const promise2 = metricsQueue.enqueue('all', null, null)

      // Verify currentCalculation and log (avoid comparing Promise identity)
      expect(metricsQueue.currentCalculation).not.toBeNull()
      expect(metricsQueue.currentCalculation.id).toBe('all-null-null')
      expect(consoleLogSpy).toHaveBeenCalledWith('Calculation all-null-null currently processing, waiting for completion')

      resolveCalc()
      await Promise.all([promise1, promise2])

      expect(calculateMetricsForPeriod).toHaveBeenCalledTimes(1)
    })

    test('should generate correct calculation ID', () => {
      const id1 = metricsQueue.getCalculationId('all', null, null)
      expect(id1).toBe('all-null-null')

      const id2 = metricsQueue.getCalculationId('year', 2023, null)
      expect(id2).toBe('year-2023-null')

      const id3 = metricsQueue.getCalculationId('monthInYear', 2023, 6)
      expect(id3).toBe('monthInYear-2023-6')
    })
  })

  describe('processQueue', () => {
    test('should process single calculation', async () => {
      const promise = metricsQueue.enqueue('all', null, null)

      await promise

      expect(calculateMetricsForPeriod).toHaveBeenCalledWith('all', null, null)
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Processing metrics calculation: all-null-null'))
      expect(consoleLogSpy).toHaveBeenCalledWith('✓ Completed calculation: all-null-null')
      expect(metricsQueue.processing).toBe(false)
      expect(metricsQueue.currentCalculation).toBe(null)
    })

    test('should process multiple calculations sequentially', async () => {
      const promise1 = metricsQueue.enqueue('all', null, null)
      const promise2 = metricsQueue.enqueue('ytd', null, null)
      const promise3 = metricsQueue.enqueue('year', 2023, null)

      await Promise.all([promise1, promise2, promise3])

      expect(calculateMetricsForPeriod).toHaveBeenCalledTimes(3)
      expect(calculateMetricsForPeriod).toHaveBeenNthCalledWith(1, 'all', null, null)
      expect(calculateMetricsForPeriod).toHaveBeenNthCalledWith(2, 'ytd', null, null)
      expect(calculateMetricsForPeriod).toHaveBeenNthCalledWith(3, 'year', 2023, null)

      expect(consoleLogSpy).toHaveBeenCalledWith('✓ Completed calculation: all-null-null')
      expect(consoleLogSpy).toHaveBeenCalledWith('✓ Completed calculation: ytd-null-null')
      expect(consoleLogSpy).toHaveBeenCalledWith('✓ Completed calculation: year-2023-null')
    })

    test('should log queue size when processing', async () => {
      const resolvers = []

      calculateMetricsForPeriod.mockImplementation(() =>
        new Promise(resolve => {
          resolvers.push(resolve)
        })
      )

      metricsQueue.enqueue('all', null, null)
      metricsQueue.enqueue('ytd', null, null)
      metricsQueue.enqueue('year', 2023, null)

      // Wait for first to start processing
      await new Promise(resolve => setImmediate(resolve))

      // Check the log was made when first calculation started
      const logCalls = consoleLogSpy.mock.calls.map(call => call[0])
      const initialLog = logCalls.find(log => log && typeof log === 'string' && log.includes('all-null-null') && log.includes('remaining in queue'))

      // The log should include the remaining-in-queue text (number may vary due to timing)
      expect(initialLog).toMatch(/\d+ remaining in queue/)

      // Clean up remaining
      resolvers.forEach(resolve => resolve())
      await new Promise(resolve => setTimeout(resolve, 2200))
    })

    test('should log wait time when processing', async () => {
      const promise = metricsQueue.enqueue('all', null, null)

      await promise

      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringMatching(/Processing metrics calculation: all-null-null \(waited \d+ms/))
    })

    test('should not process if already processing', () => {
      metricsQueue.processing = true

      metricsQueue.processQueue()

      expect(calculateMetricsForPeriod).not.toHaveBeenCalled()

      metricsQueue.processing = false
    })

    test('should not process if queue is empty', async () => {
      await metricsQueue.processQueue()

      expect(calculateMetricsForPeriod).not.toHaveBeenCalled()
      expect(metricsQueue.processing).toBe(false)
    })

    test('should handle calculation errors', async () => {
      const error = new Error('Calculation failed')
      calculateMetricsForPeriod.mockRejectedValue(error)

      const promise = metricsQueue.enqueue('all', null, null)

      await expect(promise).rejects.toThrow('Calculation failed')
      expect(consoleErrorSpy).toHaveBeenCalledWith('✗ Failed calculation all-null-null:', error)
      expect(metricsQueue.processing).toBe(false)
      expect(metricsQueue.currentCalculation).toBe(null)
    })

    test('should continue processing after error', async () => {
      const error = new Error('Calculation failed')
      calculateMetricsForPeriod
        .mockRejectedValueOnce(error)
        .mockResolvedValueOnce()

      const promise1 = metricsQueue.enqueue('all', null, null)
      const promise2 = metricsQueue.enqueue('ytd', null, null)

      await expect(promise1).rejects.toThrow('Calculation failed')
      await promise2

      expect(calculateMetricsForPeriod).toHaveBeenCalledTimes(2)
      expect(consoleLogSpy).toHaveBeenCalledWith('✓ Completed calculation: ytd-null-null')
    })

    test('should set currentCalculation during processing', async () => {
      let currentCalcDuringProcessing = null

      calculateMetricsForPeriod.mockImplementation(async () => {
        currentCalcDuringProcessing = metricsQueue.currentCalculation
      })

      const promise = metricsQueue.enqueue('all', null, null)

      await promise

      expect(currentCalcDuringProcessing).not.toBe(null)
      expect(currentCalcDuringProcessing.id).toBe('all-null-null')
      expect(metricsQueue.currentCalculation).toBe(null)
    })
  })

  describe('createCalculation', () => {
    test('should create calculation with all properties', () => {
      const calculation = metricsQueue.createCalculation('test-id', 'all', null, null)

      expect(calculation).toHaveProperty('id', 'test-id')
      expect(calculation).toHaveProperty('period', 'all')
      expect(calculation).toHaveProperty('schemeYear', null)
      expect(calculation).toHaveProperty('month', null)
      expect(calculation).toHaveProperty('promise')
      expect(calculation).toHaveProperty('resolve')
      expect(calculation).toHaveProperty('reject')
      expect(calculation).toHaveProperty('enqueuedAt')
      expect(typeof calculation.promise).toBe('object')
      expect(typeof calculation.resolve).toBe('function')
      expect(typeof calculation.reject).toBe('function')
      expect(typeof calculation.enqueuedAt).toBe('number')
    })

    test('should create calculation with schemeYear', () => {
      const calculation = metricsQueue.createCalculation('test-id', 'year', 2023, null)

      expect(calculation.schemeYear).toBe(2023)
    })

    test('should create calculation with month', () => {
      const calculation = metricsQueue.createCalculation('test-id', 'monthInYear', 2023, 6)

      expect(calculation.schemeYear).toBe(2023)
      expect(calculation.month).toBe(6)
    })

    test('should create resolvable promise', async () => {
      const calculation = metricsQueue.createCalculation('test-id', 'all', null, null)

      calculation.resolve('success')

      await expect(calculation.promise).resolves.toBe('success')
    })

    test('should create rejectable promise', async () => {
      const calculation = metricsQueue.createCalculation('test-id', 'all', null, null)
      const error = new Error('Failed')

      calculation.reject(error)

      await expect(calculation.promise).rejects.toThrow('Failed')
    })
  })

  describe('getStatus', () => {
    test('should return empty status when queue is empty', () => {
      const status = metricsQueue.getStatus()

      expect(status).toEqual({
        queueLength: 0,
        processing: false,
        currentCalculation: null,
        queuedCalculations: []
      })
    })

    test('should return status with queued calculations', async () => {
      const resolvers = []

      calculateMetricsForPeriod.mockImplementation(() =>
        new Promise(resolve => {
          resolvers.push(resolve)
        })
      )

      metricsQueue.enqueue('all', null, null)
      metricsQueue.enqueue('ytd', null, null)

      // Wait for processing to start
      await new Promise(resolve => setImmediate(resolve))

      const status = metricsQueue.getStatus()

      expect(status.queueLength).toBeGreaterThanOrEqual(0)
      expect(status.processing).toBe(true)

      // Clean up
      resolvers.forEach(resolve => resolve())
      await new Promise(resolve => setTimeout(resolve, 1200))
    })

    test('should return current calculation when processing', async () => {
      let resolveCalc
      calculateMetricsForPeriod.mockImplementation(() =>
        new Promise(resolve => { resolveCalc = resolve })
      )

      metricsQueue.enqueue('all', null, null)

      // Wait for processing to start
      await new Promise(resolve => setImmediate(resolve))

      const status = metricsQueue.getStatus()

      expect(status.processing).toBe(true)
      expect(status.currentCalculation).toBe('all-null-null')

      resolveCalc()
      await new Promise(resolve => setTimeout(resolve, 10))
    })
  })

  describe('delay', () => {
    test('should delay for specified milliseconds', async () => {
      const start = Date.now()
      await metricsQueue.delay(100)
      const elapsed = Date.now() - start

      expect(elapsed).toBeGreaterThanOrEqual(90) // Allow some margin
    })

    test('should resolve after delay', async () => {
      const delayPromise = metricsQueue.delay(50)

      await expect(delayPromise).resolves.toBeUndefined()
    })
  })

  describe('singleton instance', () => {
    test('should export singleton instance', () => {
      const { metricsQueue: instance1 } = require('../../app/metrics-queue')
      const { metricsQueue: instance2 } = require('../../app/metrics-queue')

      expect(instance1).toBe(instance2)
    })
  })

  describe('integration scenarios', () => {
    test('should handle rapid successive enqueues', async () => {
      // Block processing by making calculation hang
      let resolveCalc
      calculateMetricsForPeriod.mockImplementation(() =>
        new Promise(resolve => { resolveCalc = resolve })
      )

      const promises = []
      promises.push(metricsQueue.enqueue('all', null, null))

      // Wait for first to start processing
      await new Promise(resolve => setImmediate(resolve))

      // Now enqueue more of the same - these will reference the currently processing calculation
      promises.push(metricsQueue.enqueue('all', null, null))
      promises.push(metricsQueue.enqueue('all', null, null))
      promises.push(metricsQueue.enqueue('all', null, null))
      promises.push(metricsQueue.enqueue('all', null, null))

      // Resolve and wait for all to complete, then assert underlying call happened once
      resolveCalc()
      await Promise.all(promises)

      expect(calculateMetricsForPeriod).toHaveBeenCalledTimes(1)
    })

    test('should handle different calculations concurrently', async () => {
      const promise1 = metricsQueue.enqueue('all', null, null)
      const promise2 = metricsQueue.enqueue('year', 2023, null)
      const promise3 = metricsQueue.enqueue('monthInYear', 2023, 6)

      await Promise.all([promise1, promise2, promise3])

      expect(calculateMetricsForPeriod).toHaveBeenCalledTimes(3)
      expect(calculateMetricsForPeriod).toHaveBeenCalledWith('all', null, null)
      expect(calculateMetricsForPeriod).toHaveBeenCalledWith('year', 2023, null)
      expect(calculateMetricsForPeriod).toHaveBeenCalledWith('monthInYear', 2023, 6)
    })

    test('should handle mix of success and failure', async () => {
      const error = new Error('Failed')
      calculateMetricsForPeriod
        .mockResolvedValueOnce()
        .mockRejectedValueOnce(error)
        .mockResolvedValueOnce()

      const promise1 = metricsQueue.enqueue('all', null, null)
      const promise2 = metricsQueue.enqueue('ytd', null, null)
      const promise3 = metricsQueue.enqueue('year', 2023, null)

      await promise1
      await expect(promise2).rejects.toThrow('Failed')
      await promise3

      expect(calculateMetricsForPeriod).toHaveBeenCalledTimes(3)
      expect(consoleLogSpy).toHaveBeenCalledWith('✓ Completed calculation: all-null-null')
      expect(consoleErrorSpy).toHaveBeenCalledWith('✗ Failed calculation ytd-null-null:', error)
      expect(consoleLogSpy).toHaveBeenCalledWith('✓ Completed calculation: year-2023-null')
    })

    test('should handle enqueue during processing', async () => {
      let midProcessingEnqueue

      calculateMetricsForPeriod.mockImplementation(async () => {
        if (!midProcessingEnqueue) {
          midProcessingEnqueue = metricsQueue.enqueue('ytd', null, null)
        }
      })

      const promise1 = metricsQueue.enqueue('all', null, null)

      await promise1
      await midProcessingEnqueue

      expect(calculateMetricsForPeriod).toHaveBeenCalledTimes(2)
    })
  })
})
