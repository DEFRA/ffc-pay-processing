const { resetDatabase, closeDatabaseConnection, saveSchedule } = require('../../../helpers')

const inProgressSchedule = require('../../../mocks/schedules/in-progress')
const completedSchedule = require('../../../mocks/schedules/completed')

const { getScheduleId } = require('../../../../app/routing/get-schedule-id')

describe('get schedule id', () => {
  beforeEach(async () => {
    jest.clearAllMocks()
    await resetDatabase()
  })

  test('should return schedule id if incomplete schedule exists', async () => {
    const { paymentRequestId, scheduleId } = await saveSchedule(inProgressSchedule)
    const result = await getScheduleId(paymentRequestId)
    expect(result.scheduleId).toEqual(scheduleId)
  })

  test('should not return schedule id if completed schedule exists', async () => {
    const { paymentRequestId } = await saveSchedule(completedSchedule)
    const result = await getScheduleId(paymentRequestId)
    expect(result).toBeNull()
  })

  afterAll(async () => {
    await closeDatabaseConnection()
  })
})
