const messageConfig = require('./message')
const databaseConfig = require('./database')
const processingConfig = require('./processing')
const serverConfig = require('./server')
const retentionConfig = require('./retention')

module.exports = {
  messageConfig,
  databaseConfig,
  processingConfig,
  serverConfig,
  retentionConfig
}
