jest.mock('../../../../app/processing/due-dates/get-schedule')
const { getSchedule: mockGetSchedule } = require('../../../../app/processing/due-dates/get-schedule')

const { DUE_DATE } = require('../../../mocks/values/due-date')

const { Q4, M12, T4 } = require('../../../../app/constants/schedules')
const { MONTH, DAY } = require('../../../../app/constants/time-periods')

const { getPaymentSchedule } = require('../../../../app/processing/due-dates/get-payment-schedule')

const settledValue = 100
const totalValue = 1000
const currentDate = new Date()

describe('get payment schedule', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('should calculate quarterly schedule for quarterly payments', () => {
    getPaymentSchedule(Q4, DUE_DATE, settledValue, totalValue, currentDate)
    expect(mockGetSchedule).toHaveBeenCalledWith(expect.any(Object), 4, settledValue, totalValue, 3, MONTH, currentDate)
  })

  test('should calculate monthly schedule for monthly payments', () => {
    getPaymentSchedule(M12, DUE_DATE, settledValue, totalValue, currentDate)
    expect(mockGetSchedule).toHaveBeenCalledWith(expect.any(Object), 12, settledValue, totalValue, 1, MONTH, currentDate)
  })

  test('should calculate test quarterly schedule for test quarterly payments', () => {
    getPaymentSchedule(T4, DUE_DATE, settledValue, totalValue, currentDate)
    expect(mockGetSchedule).toHaveBeenCalledWith(expect.any(Object), 4, settledValue, totalValue, 3, DAY, currentDate)
  })

})

