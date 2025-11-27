const { createAdjustmentPaymentRequest } = require('../../../helpers')

jest.mock('../../../../app/processing/due-dates/get-first-payment-request')
const { getFirstPaymentRequest: mockGetFirstPaymentRequest } = require('../../../../app/processing/due-dates/get-first-payment-request')

jest.mock('../../../../app/processing/due-dates/get-settled-value')
const { getSettledValue: mockGetSettledValue } = require('../../../../app/processing/due-dates/get-settled-value')

jest.mock('../../../../app/processing/due-dates/get-total-value')
const { getTotalValue: mockGetTotalValue } = require('../../../../app/processing/due-dates/get-total-value')

jest.mock('../../../../app/processing/due-dates/get-payment-schedule')
const { getPaymentSchedule: mockGetPaymentSchedule } = require('../../../../app/processing/due-dates/get-payment-schedule')

jest.mock('../../../../app/processing/due-dates/handle-sfi23-advance-payments')
const { handleSFI23AdvancePayments: mockHandleSFI23AdvancePayments } = require('../../../../app/processing/due-dates/handle-sfi23-advance-payments')

const { RECOVERY } = require('../../../../app/constants/adjustment-types')
const { AR } = require('../../../../app/constants/ledgers')
const { Q1, Q2, Q3 } = require('../../../../app/constants/schedules')

const { confirmDueDates } = require('../../../../app/processing/due-dates/confirm-due-dates')

let previousPaymentRequest, previousPaymentRequests, paymentRequest, paymentRequests, paymentSchedule
const settledValue = 0

describe('confirmDueDates', () => {
  beforeEach(() => {
    jest.clearAllMocks()

    previousPaymentRequest = structuredClone(require('../../../mocks/payment-requests/payment-request'))
    previousPaymentRequests = [previousPaymentRequest]

    paymentRequest = createAdjustmentPaymentRequest(previousPaymentRequest, RECOVERY)
    paymentRequests = [paymentRequest]

    paymentSchedule = structuredClone(require('../../../mocks/payment-schedule'))

    mockGetFirstPaymentRequest.mockReturnValue(previousPaymentRequest)
    mockGetSettledValue.mockReturnValue(settledValue)
    mockGetTotalValue.mockReturnValue(previousPaymentRequest.value)
    mockGetPaymentSchedule.mockReturnValue(paymentSchedule)
  })

  test('should not recalculate due dates if first payment request does not have a schedule', async () => {
    delete previousPaymentRequest.schedule
    await confirmDueDates(paymentRequests, previousPaymentRequests)
    expect(mockGetSettledValue).not.toHaveBeenCalled()
  })

  test('should return payment requests unchanged if first payment request does not have a schedule', async () => {
    delete previousPaymentRequest.schedule
    const result = await confirmDueDates(paymentRequests, previousPaymentRequests)
    expect(result).toEqual(paymentRequests)
  })

  test('should not recalculate due dates if no first payment request', async () => {
    mockGetFirstPaymentRequest.mockReturnValue(undefined)
    await confirmDueDates(paymentRequests, previousPaymentRequests)
    expect(mockGetSettledValue).not.toHaveBeenCalled()
  })

  test('should return payment requests unchanged if no first payment request', async () => {
    previousPaymentRequest.paymentRequestNumber = 2
    const result = await confirmDueDates(paymentRequests, previousPaymentRequests)
    expect(result).toEqual(paymentRequests)
  })

  test('should calculate total settled and total value of all previous payment requests', async () => {
    await confirmDueDates(paymentRequests, previousPaymentRequests)
    expect(mockGetSettledValue).toHaveBeenCalledWith(previousPaymentRequests)
    expect(mockGetTotalValue).toHaveBeenCalledWith(previousPaymentRequests)
  })

  test('should calculate payment schedule', async () => {
    await confirmDueDates(paymentRequests, previousPaymentRequests)
    expect(mockGetPaymentSchedule).toHaveBeenCalledWith(
      previousPaymentRequest.schedule,
      previousPaymentRequest.dueDate,
      settledValue,
      previousPaymentRequest.value,
      expect.any(Date)
    )
  })

  test('should return payment requests unchanged if no outstanding payments or AR ledger', async () => {
    const result = await confirmDueDates(paymentRequests, previousPaymentRequests)
    expect(result).toEqual(paymentRequests)

    paymentSchedule[3].outstanding = true
    paymentRequests[0].ledger = AR
    paymentRequests[0].value = 1
    const result2 = await confirmDueDates(paymentRequests, previousPaymentRequests)
    expect(result2).toEqual(paymentRequests)
  })

  const scheduleScenarios = [
    { outstandingIndexes: [3], expectedSchedule: Q1 },
    { outstandingIndexes: [2, 3], expectedSchedule: Q2 },
    { outstandingIndexes: [1, 2, 3], expectedSchedule: Q3 }
  ]

  scheduleScenarios.forEach(({ outstandingIndexes, expectedSchedule }) => {
    test(`should reduce remaining schedule to correct schedule if outstanding at indexes ${outstandingIndexes.join(',')}`, async () => {
      outstandingIndexes.forEach(i => { paymentSchedule[i].outstanding = true })
      paymentRequests[0].value = -1
      const result = await confirmDueDates(paymentRequests, previousPaymentRequests)
      expect(result[0].schedule).toBe(expectedSchedule)
    })
  })

  test('should update due date to date of next outstanding instalment', async () => {
    paymentSchedule[3].outstanding = true
    paymentRequests[0].value = -1
    const result = await confirmDueDates(paymentRequests, previousPaymentRequests)
    expect(result[0].dueDate).toEqual(paymentSchedule[3].dueDate)
  })

  test('should handle SFI23 advance payments', async () => {
    paymentSchedule.slice(1).forEach(inst => { inst.outstanding = true })
    await confirmDueDates(paymentRequests, previousPaymentRequests)
    expect(mockHandleSFI23AdvancePayments).toHaveBeenCalledWith(paymentRequests, previousPaymentRequests, paymentSchedule)
  })
})
