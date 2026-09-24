const db = require('../database')

const getSchemes = async () => {
  return db.scheme()
}

module.exports = {
  getSchemes
}
