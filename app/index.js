require('./insights').setup()
require('log-timestamp')
const messaging = require('./messaging')
const processing = require('./processing')
const createServer = require('./server')

const init = async () => {
  const server = await createServer()
  await server.start()
  console.log('Server running on %s', server.info.uri)
}

process.on(['SIGTERM', 'SIGINT'], async () => {
  await messaging.stop()
  process.exit(0)
})

module.exports = (async () => {
  await messaging.start()
  await processing.start()
  await init()
})()
