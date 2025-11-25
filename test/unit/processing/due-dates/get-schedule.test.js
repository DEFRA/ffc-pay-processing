const moment = require('moment')

jest.mock('../../../../app/processing/due-dates/get-expected-value')
const { getExpectedValue: mockGetExpectedValue } = require('../../../../app/processing/due-dates/get-expected-value')

const { DUE_DATE } = require('../../../mocks/values/due-date')
const { MONTH } = require('../../../../app/constants/time-periods')
const { DATE_FORMAT } = require('../../../../app/constants/date-formats')
const { getSchedule } = require('../../../../app/processing/due-dates/get-schedule')

describe('getSchedule', () => {
  let scheduleDate
  let totalPayments
  let settledValue
  let totalValue
  let increment
  let unit
  let currentDate

  beforeEach(() => {
    jest.clearAllMocks()

    mockGetExpectedValue.mockReturnValueOnce(25)
    mockGetExpectedValue.mockReturnValueOnce(50)
    mockGetExpectedValue.mockReturnValueOnce(75)
    mockGetExpectedValue.mockReturnValueOnce(100)

    scheduleDate = moment(DUE_DATE, DATE_FORMAT)
    totalPayments = 4
    settledValue = 0
    totalValue = 100
    increment = 3
    unit = MONTH
    currentDate = new Date(2025, 0, 1)
  })

  test.each([
    { payments: 0, expected: [] },
    { payments: -1, expected: [] }
  ])('should return empty array if total payments is $payments', ({ payments, expected }) => {
    totalPayments = payments
    expect(getSchedule(scheduleDate, totalPayments, settledValue, totalValue, increment, unit, currentDate)).toEqual(expected)
  })

  test('should calculate expected value for each payment', () => {
    getSchedule(scheduleDate, totalPayments, settledValue, totalValue, increment, unit, currentDate)
    expect(mockGetExpectedValue).toHaveBeenCalledTimes(totalPayments)
  })

  test('should return schedule with correct number of payments', () => {
    const result = getSchedule(scheduleDate, totalPayments, settledValue, totalValue, increment, unit, currentDate)
    expect(result).toHaveLength(totalPayments)
  })

  test('should calculate correct due dates for each payment', () => {
    const result = getSchedule(scheduleDate, totalPayments, settledValue, totalValue, increment, unit, currentDate)
    const expectedDates = ['01/04/2023', '01/07/2023', '01/10/2023', '01/01/2024']
    result.forEach((payment, idx) => {
      expect(payment.dueDate).toEqual(expectedDates[idx])
    })
  })

  test('should mark all payments as not outstanding if fully settled', () => {
    settledValue = totalValue
    const result = getSchedule(scheduleDate, totalPayments, settledValue, totalValue, increment, unit, currentDate)
    expect(result.every(p => !p.outstanding)).toBeTruthy()
  })

  test('should mark all payments as outstanding if no payments made and current date before first due date', () => {
    settledValue = 0
    currentDate = new Date(2022, 0, 1)
    const result = getSchedule(scheduleDate, totalPayments, settledValue, totalValue, increment, unit, currentDate)
    expect(result.every(p => p.outstanding)).toBeTruthy()
  })

  test('should mark first payment as not outstanding if partially settled', () => {
    settledValue = 25
    const result = getSchedule(scheduleDate, totalPayments, settledValue, totalValue, increment, unit, currentDate)
    expect(result[0].outstanding).toBeFalsy()
  })
})
