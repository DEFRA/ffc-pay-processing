require('./insights').setup()
require('log-timestamp')
const { processingConfig } = require('./config')
const { start: startMessaging, stop: stopMessaging } = require('./messaging')
const { start: startProcessing } = require('./processing')
const { start: startServer } = require('./server')
const { start: startDataRetention } = require('./data-retention')

process.on(['SIGTERM', 'SIGINT'], async () => {
  await stopMessaging()
  process.exit(0)
})

const startApp = async () => {
  await startServer()
  if (processingConfig.active) {
    await startMessaging()
    await startProcessing()
    await startDataRetention()
  } else {
    console.info('Processing capabilities are currently not enabled in this environment')
  }
}

(async () => {
  await startApp()
})()

module.exports = startApp
