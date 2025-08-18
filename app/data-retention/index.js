const retentionConfig = require('../config/retention')
const { removeAgedData } = require('./remove-aged-data')

const start = async () => {
  try {
    await removeAgedData()
  } catch (err) {
    console.error(err)
  } finally {
    setTimeout(start, retentionConfig.retentionInterval)
  }
}

module.exports = {
  start
}
