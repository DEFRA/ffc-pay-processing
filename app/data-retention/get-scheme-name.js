const db = require('../data')

const getSchemeName = async (schemeId) => {
  return db.scheme.findOne({
    where: {
      schemeId
    },
    attributes: ['name']
  })
}

module.exports = {
  getSchemeName
}
