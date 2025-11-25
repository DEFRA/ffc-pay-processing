const { createAdjustmentPaymentRequest } = require('../../../helpers')

const { RECOVERY } = require('../../../../app/constants/adjustment-types')
const { Q3, Q4, Q1 } = require('../../../../app/constants/schedules')
const { SFI23 } = require('../../../../app/constants/schemes')

const { getFirstPaymentRequest } = require('../../../../app/processing/due-dates/get-first-payment-request')

let previousPaymentRequest
let previousPaymentRequests
let paymentRequest
let paymentRequests

describe('get first payment request', () => {
  beforeEach(() => {
    jest.clearAllMocks()

    previousPaymentRequest = structuredClone(require('../../../mocks/payment-requests/payment-request'))
    previousPaymentRequests = [previousPaymentRequest]
    paymentRequest = createAdjustmentPaymentRequest(previousPaymentRequest, RECOVERY)
    paymentRequests = [paymentRequest]
  })

  test('should return payment request 1 if not SFI 23', () => {
    const result = getFirstPaymentRequest(paymentRequests, previousPaymentRequests)
    expect(result.schedule).toBe(previousPaymentRequest.schedule)
    expect(result.dueDate).toBe(previousPaymentRequest.dueDate)
  })

  test('should return undefined if no first payment request and not SFI 23', () => {
    const result = getFirstPaymentRequest(paymentRequests, [])
    expect(result).toBeUndefined()
  })

  test('should return current payment request due date and schedule if SFI 23 and payment request number 1', () => {
    previousPaymentRequest.paymentRequestNumber = 0
    previousPaymentRequest.schedule = Q1
    previousPaymentRequest.dueDate = '01/10/2023'
    previousPaymentRequest.schemeId = SFI23
    paymentRequest.schemeId = SFI23
    paymentRequest.paymentRequestNumber = 1

    const result = getFirstPaymentRequest(paymentRequests, previousPaymentRequests)
    expect(result.schedule).toBe(paymentRequest.schedule)
    expect(result.dueDate).toBe(paymentRequest.dueDate)
  })

  test('should return current original unedited due date and schedule if SFI 23 and has advance payment scheduled in 2023 which is not settled, and not payment request 1', () => {
    previousPaymentRequest.schedule = Q3
    previousPaymentRequest.dueDate = '01/10/2023'
    previousPaymentRequest.schemeId = SFI23
    paymentRequest.schemeId = SFI23
    const advancePaymentRequest = structuredClone(previousPaymentRequest)
    advancePaymentRequest.paymentRequestNumber = 0
    paymentRequest.paymentRequestNumber = 2

    const result = getFirstPaymentRequest(paymentRequests, [...previousPaymentRequests, advancePaymentRequest])
    expect(result.schedule).toBe(Q4)
    expect(result.dueDate).toBe(paymentRequest.dueDate)
  })

  test('should return first payment request due date and schedule if has advance payment not scheduled in 2023 and not payment request 1', () => {
    previousPaymentRequest.schedule = Q3
    previousPaymentRequest.dueDate = '01/10/2024'
    previousPaymentRequest.schemeId = SFI23
    paymentRequest.schemeId = SFI23
    const advancePaymentRequest = structuredClone(previousPaymentRequest)
    advancePaymentRequest.paymentRequestNumber = 0
    paymentRequest.paymentRequestNumber = 2

    const result = getFirstPaymentRequest(paymentRequests, [...previousPaymentRequests, advancePaymentRequest])
    expect(result.schedule).toBe(previousPaymentRequest.schedule)
    expect(result.dueDate).toBe(previousPaymentRequest.dueDate)
  })

  test('should return undefined if no first payment request or advance for SFI 23', () => {
    paymentRequest.schemeId = SFI23
    const result = getFirstPaymentRequest(paymentRequests, [])
    expect(result).toBeUndefined()
  })
})
