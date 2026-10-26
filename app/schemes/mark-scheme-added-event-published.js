const db = require('../database')

const markSchemeAddedEventPublished = async (schemeId) => {
  await db.scheme()
    .where({ schemeId })
    .update({
      schemeAddedEventPublishedAt: new Date()
    })
}

module.exports = {
  markSchemeAddedEventPublished
}
