const db = require('../../app/database')

const closeDatabaseConnection = async () => {
  await db.close()
}

module.exports = {
  closeDatabaseConnection
}
