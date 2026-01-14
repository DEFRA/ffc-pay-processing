const { calculateMetricsForPeriod } = require('./metrics-calculator')

class MetricsCalculationQueue {
  constructor () {
    this.queue = new Map()
    this.processing = false
    this.currentCalculation = null
  }

  async enqueue (period, schemeYear, month) {
    const id = this.getCalculationId(period, schemeYear, month)

    if (this.queue.has(id)) {
      console.log(`Calculation ${id} already queued, reusing existing request`)
      return this.queue.get(id).promise
    }

    if (this.currentCalculation?.id === id) {
      console.log(`Calculation ${id} currently processing, waiting for completion`)
      return this.currentCalculation.promise
    }

    const calculation = this.createCalculation(id, period, schemeYear, month)
    this.queue.set(id, calculation)
    this.processQueue()

    return calculation.promise
  }

  createCalculation (id, period, schemeYear, month) {
    let resolvePromise, rejectPromise
    const promise = new Promise((resolve, reject) => {
      resolvePromise = resolve
      rejectPromise = reject
    })

    return {
      id,
      period,
      schemeYear,
      month,
      promise,
      resolve: resolvePromise,
      reject: rejectPromise,
      enqueuedAt: Date.now()
    }
  }

  async processQueue () {
    if (this.processing || this.queue.size === 0) {
      return
    }

    this.processing = true

    while (this.queue.size > 0) {
      const [id, calculation] = this.queue.entries().next().value
      this.queue.delete(id)

      this.currentCalculation = calculation
      const waitTime = Date.now() - calculation.enqueuedAt

      console.log(`Processing metrics calculation: ${id} (waited ${waitTime}ms, ${this.queue.size} remaining in queue)`)

      try {
        await calculateMetricsForPeriod(calculation.period, calculation.schemeYear, calculation.month)
        calculation.resolve()
        console.log(`✓ Completed calculation: ${id}`)
      } catch (error) {
        console.error(`✗ Failed calculation ${id}:`, error)
        calculation.reject(error)
      } finally {
        this.currentCalculation = null

        if (this.queue.size > 0) {
          await this.delay(1000)
        }
      }
    }

    this.processing = false
  }

  delay (ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  getCalculationId (period, schemeYear, month) {
    return `${period}-${schemeYear || 'null'}-${month || 'null'}`
  }

  getStatus () {
    return {
      queueLength: this.queue.size,
      processing: this.processing,
      currentCalculation: this.currentCalculation?.id || null,
      queuedCalculations: Array.from(this.queue.keys())
    }
  }
}

// Singleton instance
const metricsQueue = new MetricsCalculationQueue()

module.exports = {
  metricsQueue
}
