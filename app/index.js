require('./insights/insights').setup()
const messageService = require('./messaging')
const paymentProcessing = require('./processing')
const batching = require('./batching')

const createServer = require('./server')
const init = async () => {
  const server = await createServer()
  await server.start()
  console.log('Server running on %s', server.info.uri)
}

process.on('SIGTERM', async () => {
  await messageService.stop()
  process.exit(0)
})

process.on('SIGINT', async () => {
  await messageService.stop()
  process.exit(0)
})

module.exports = (async function startService () {
  await init()
  await messageService.start()
  await paymentProcessing.start()
  await batching.start()
}())
