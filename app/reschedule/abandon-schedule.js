const db = require('../database')

const abandonSchedule = async (scheduleId, transaction) => {
  await db.schedule(transaction ?? undefined).where({ scheduleId, completed: null }).update({ started: null })
}

module.exports = {
  abandonSchedule
}
