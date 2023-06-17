const { resetDatabase, closeDatabaseConnection, saveSchedule } = require('../../../helpers')

const { TIMESTAMP } = require('../../../mocks/values/date')
const inProgress = require('../../../mocks/schedules/in-progress')
const completed = require('../../../mocks/schedules/completed')

const db = require('../../../../app/data')

const { abandonSchedule } = require('../../../../app/reschedule/abandon-schedule')

describe('abandon schedule', () => {
  beforeEach(async () => {
    jest.clearAllMocks()
    await resetDatabase()
  })

  test('should abandon schedule by removing started date', async () => {
    const { scheduleId } = await saveSchedule(inProgress)
    await abandonSchedule(scheduleId)
    const updatedSchedules = await db.schedule.findAll({ raw: true })
    expect(updatedSchedules[0].started).toBeNull()
  })

  test('should not abandon schedule if already completed', async () => {
    const { scheduleId } = await saveSchedule(completed)
    await db.schedule.update({ completed: TIMESTAMP }, { where: { scheduleId } })
    await abandonSchedule(scheduleId)
    const updatedSchedules = await db.schedule.findAll({ raw: true })
    expect(updatedSchedules[0].started).toEqual(TIMESTAMP)
  })

  afterAll(async () => {
    await closeDatabaseConnection()
  })
})
