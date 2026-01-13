const config = require('./config')
const { calculateAllMetrics } = require('./metrics-calculator')
const moment = require('moment')

const MILLISECONDS_PER_SECOND = 1000
const SECONDS_PER_MINUTE = 60
const TARGET_HOUR = 4
const TARGET_MINUTE = 0

let pollingInterval = null

const calculateNextRun = () => {
  const now = moment()
  const nextRun = moment().hour(TARGET_HOUR).minute(TARGET_MINUTE).second(0).millisecond(0)

  if (nextRun.isBefore(now)) {
    nextRun.add(1, 'day')
  }

  return nextRun.diff(now)
}

const scheduleNextRun = () => {
  if (config.isDev) {
    pollingInterval = setInterval(() => {
      calculateAllMetrics().catch(err => {
        console.error('Scheduled metrics calculation failed:', err)
      })
    }, config.metricsPollingInterval)

    console.log(`Metrics polling scheduled - interval: ${config.metricsPollingInterval}ms (${config.metricsPollingInterval / MILLISECONDS_PER_SECOND / SECONDS_PER_MINUTE} minutes)`)
  } else {
    const delay = calculateNextRun()
    pollingInterval = setTimeout(() => {
      calculateAllMetrics().catch(err => {
        console.error('Scheduled metrics calculation failed:', err)
      }).finally(() => {
        scheduleNextRun()
      })
    }, delay)

    const nextRunTime = moment().add(delay, 'milliseconds').format('YYYY-MM-DD HH:mm:ss')
    console.log(`Metrics polling scheduled for ${nextRunTime} (in ${delay / MILLISECONDS_PER_SECOND / SECONDS_PER_MINUTE} minutes)`)
  }
}

const startMetricsPolling = () => {
  console.log('Starting metrics polling')

  calculateAllMetrics().catch(err => {
    console.error('Initial metrics calculation failed:', err)
  })

  scheduleNextRun()
  return pollingInterval
}

const stopMetricsPolling = () => {
  if (pollingInterval) {
    clearInterval(pollingInterval)
    clearTimeout(pollingInterval)
    pollingInterval = null
    console.log('Metrics polling stopped')
  }
}

module.exports = {
  startMetricsPolling,
  stopMetricsPolling
}
