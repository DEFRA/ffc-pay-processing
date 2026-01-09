require('./insights').setup()
require('log-timestamp')
const { processingConfig } = require('./config')
const { start: startMessaging, stop: stopMessaging } = require('./messaging')
const { start: startProcessing } = require('./processing')
const { startMetricsPolling, stopMetricsPolling } = require('./metrics-polling')
const { start: startServer } = require('./server')

process.on(['SIGTERM', 'SIGINT'], async () => {
  await stopMessaging()
  stopMetricsPolling()
  process.exit(0)
})

const startApp = async () => {
  await startServer()
  if (processingConfig.active) {
    await startMessaging()
    await startProcessing()
    await startMetricsPolling()
  } else {
    console.info('Processing capabilities are currently not enabled in this environment')
  }
}

(async () => {
  await startApp()
})()

module.exports = startApp
