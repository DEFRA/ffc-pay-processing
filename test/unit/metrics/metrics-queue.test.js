const { metricsQueue } = require('../../../app/metrics/metrics-queue')

jest.mock('../../../app/data', () => ({
  metric: {
    findAll: jest.fn().mockResolvedValue([]),
  },
}))
const db = require('../../../app/data')

describe('MetricsCalculationQueue', () => {
  let consoleLogSpy
  let consoleErrorSpy

  beforeEach(() => {
    jest.clearAllMocks()
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation()
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation()

    metricsQueue.queue.clear()
    metricsQueue.processing = false
    metricsQueue.currentCalculation = null
  })

  afterEach(() => {
    consoleLogSpy.mockRestore()
    consoleErrorSpy.mockRestore()
  })

  describe('enqueue', () => {
    test('should enqueue a calculation and call db.metric.findAll', async () => {
      const promise = metricsQueue.enqueue('all', null, null)

      expect(metricsQueue.queue.size).toBeGreaterThanOrEqual(0)

      await promise

      expect(db.metric.findAll).toHaveBeenCalledWith({ period_type: 'all' })
    })

    test('should enqueue calculation with schemeYear and month', async () => {
      const promise = metricsQueue.enqueue('monthInYear', 2023, 6)

      await promise

      expect(db.metric.findAll).toHaveBeenCalledWith({
        period_type: 'monthInYear',
        scheme_year: 2023,
        month_in_year: 6,
      })
    })

    test('should reuse promise if calculation currently processing', async () => {
      // Enqueue first calculation and delay finish
      let resolveCalc
      db.metric.findAll.mockImplementation(() =>
        new Promise(resolve => { resolveCalc = resolve })
      )

      const promise1 = metricsQueue.enqueue('all', null, null)
      await new Promise(resolve => setImmediate(resolve)) // wait for processQueue to start

      // Enqueue second calculation with same ID
      const promise2 = metricsQueue.enqueue('all', null, null)

      expect(metricsQueue.currentCalculation).not.toBeNull()
      expect(metricsQueue.currentCalculation.id).toBe('all-null-null')
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('currently processing'))

      resolveCalc()
      await Promise.all([promise1, promise2])
    })
  })

  describe('processQueue', () => {
    test('should not process if already processing', async () => {
      metricsQueue.processing = true

      await metricsQueue.processQueue()

      expect(db.metric.findAll).not.toHaveBeenCalled()

      metricsQueue.processing = false
    })

    test('should not process if queue is empty', async () => {
      await metricsQueue.processQueue()

      expect(db.metric.findAll).not.toHaveBeenCalled()
      expect(metricsQueue.processing).toBe(false)
    })

    test('should handle errors from db.metric.findAll and reject calculation', async () => {
      const error = new Error('DB failure')
      db.metric.findAll.mockRejectedValueOnce(error)

      const promise = metricsQueue.enqueue('all', null, null)

      await expect(promise).rejects.toThrow('DB failure')
      expect(consoleErrorSpy).toHaveBeenCalledWith('✗ Failed calculation all-null-null:', error)
      expect(metricsQueue.processing).toBe(false)
      expect(metricsQueue.currentCalculation).toBe(null)
    })
  })

  describe('createCalculation', () => {
    test('should create calculation with correct properties and resolvable promise', async () => {
      const calculation = metricsQueue.createCalculation('id-1', 'all', null, null)

      expect(calculation.id).toBe('id-1')
      expect(calculation.period).toBe('all')
      expect(calculation.promise).toBeInstanceOf(Promise)
      expect(typeof calculation.resolve).toBe('function')
      expect(typeof calculation.reject).toBe('function')
      expect(typeof calculation.enqueuedAt).toBe('number')

      calculation.resolve('done')
      await expect(calculation.promise).resolves.toBe('done')
    })

    test('should create rejection in promise', async () => {
      const calculation = metricsQueue.createCalculation('id-2', 'year', 2022, null)
      const error = new Error('fail')

      calculation.reject(error)
      await expect(calculation.promise).rejects.toThrow('fail')
    })
  })

  describe('getStatus', () => {
    test('should return status with empty queue', () => {
      const status = metricsQueue.getStatus()

      expect(status).toEqual({
        queueLength: 0,
        processing: false,
        currentCalculation: null,
        queuedCalculations: [],
      })
    })
  })

  describe('delay', () => {
    test('should delay for specified time', async () => {
      const start = Date.now()
      await metricsQueue.delay(50)
      const elapsed = Date.now() - start

      expect(elapsed).toBeGreaterThanOrEqual(45)
    })
  })

  describe('singleton instance', () => {
    test('should export the same singleton instance', () => {
      const { metricsQueue: instance1 } = require('../../../app/metrics/metrics-queue')
      const { metricsQueue: instance2 } = require('../../../app/metrics/metrics-queue')

      expect(instance1).toBe(instance2)
    })
  })

  describe('integration scenarios', () => {
    test('should handle rapid successive enqueues reusing processing calculation', async () => {
      let resolveCalc
      db.metric.findAll.mockImplementation(() =>
        new Promise(resolve => { resolveCalc = resolve })
      )

      const promises = []
      promises.push(metricsQueue.enqueue('all', null, null))

      await new Promise(resolve => setImmediate(resolve))

      // Enqueue multiple same calculations, should reuse the one in processing
      for (let i = 0; i < 5; i++) {
        promises.push(metricsQueue.enqueue('all', null, null))
      }

      resolveCalc()
      await Promise.all(promises)

      expect(db.metric.findAll).toHaveBeenCalledTimes(1)
    })

    test('should handle mix of success and failure in queue processing', async () => {
      const error = new Error('Failed')
      db.metric.findAll
        .mockResolvedValueOnce([])
        .mockRejectedValueOnce(error)
        .mockResolvedValueOnce([])

      const p1 = metricsQueue.enqueue('all', null, null)
      const p2 = metricsQueue.enqueue('ytd', null, null)
      const p3 = metricsQueue.enqueue('year', 2023, null)

      await p1
      await expect(p2).rejects.toThrow('Failed')
      await p3

      expect(db.metric.findAll).toHaveBeenCalledTimes(3)
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringMatching(/✓ Completed calculation: all-null-null/))
      expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('Failed calculation ytd-null-null'), error)
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringMatching(/✓ Completed calculation: year-2023-null/))
    })

    test('should handle enqueue during processing', async () => {
      let midProcessingEnqueue

      db.metric.findAll.mockImplementation(async () => {
        if (!midProcessingEnqueue) {
          midProcessingEnqueue = metricsQueue.enqueue('ytd', null, null)
        }
      })

      const promise1 = metricsQueue.enqueue('all', null, null)

      await promise1
      await midProcessingEnqueue

      expect(db.metric.findAll).toHaveBeenCalledTimes(2)
    })
  })
})
