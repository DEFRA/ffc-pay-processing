jest.mock('../../../../app/processing/due-dates/get-schedule')
const { getSchedule: mockGetSchedule } = require('../../../../app/processing/due-dates/get-schedule')

const { DUE_DATE } = require('../../../mocks/values/due-date')
const { Q4, M12, T4, Y1, Y2, T2 } = require('../../../../app/constants/schedules')
const { MONTH, DAY } = require('../../../../app/constants/time-periods')
const { getPaymentSchedule } = require('../../../../app/processing/due-dates/get-payment-schedule')

const settledValue = 100
const totalValue = 1000
const currentDate = new Date()

describe('getPaymentSchedule', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  const scheduleScenarios = [
    { schedule: Q4, expectedArgs: [expect.any(Object), 4, settledValue, totalValue, 3, MONTH, currentDate] },
    { schedule: M12, expectedArgs: [expect.any(Object), 12, settledValue, totalValue, 1, MONTH, currentDate] },
    { schedule: T4, expectedArgs: [expect.any(Object), 4, settledValue, totalValue, 3, DAY, currentDate] },
    { schedule: Y1, expectedArgs: [expect.any(Object), 1, settledValue, totalValue, 0, DAY, currentDate] },
    { schedule: Y2, expectedArgs: [expect.any(Object), 2, settledValue, totalValue, 60, DAY, currentDate] },
    { schedule: T2, expectedArgs: [expect.any(Object), 2, settledValue, totalValue, 3, DAY, currentDate] }
  ]

  scheduleScenarios.forEach(({ schedule, expectedArgs }) => {
    test(`should calculate schedule correctly for ${schedule} payments`, () => {
      getPaymentSchedule(schedule, DUE_DATE, settledValue, totalValue, currentDate)
      expect(mockGetSchedule).toHaveBeenCalledWith(...expectedArgs)
    })
  })
})
