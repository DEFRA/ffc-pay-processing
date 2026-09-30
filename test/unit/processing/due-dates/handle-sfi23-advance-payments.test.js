const { getSchemeIds } = require('ffc-pay-schemes')
const { createAdjustmentPaymentRequest } = require('../../../helpers')

const { SFI23, SFI } = getSchemeIds()
const { RECOVERY } = require('../../../../app/constants/adjustment-types')
const { Q1, Q3 } = require('../../../../app/constants/schedules')
const { AR } = require('../../../../app/constants/ledgers')
const {
  handleSFI23AdvancePayments
} = require('../../../../app/processing/due-dates/handle-sfi23-advance-payments')

let advancePaymentRequest
let previousPaymentRequest
let previousPaymentRequests
let paymentRequest
let paymentRequests
let paymentSchedule

describe('handle SFI23 advance payments', () => {
  beforeEach(() => {
    previousPaymentRequest = structuredClone(
      require('../../../mocks/payment-requests/payment-request')
    )
    previousPaymentRequest.schemeId = SFI23

    advancePaymentRequest = {
      ...structuredClone(previousPaymentRequest),
      paymentRequestNumber: 0,
      schedule: Q1
    }

    previousPaymentRequests = [
      previousPaymentRequest,
      advancePaymentRequest
    ]

    paymentRequest = createAdjustmentPaymentRequest(
      previousPaymentRequest,
      RECOVERY
    )
    paymentRequest.paymentRequestNumber = 1
    paymentRequests = [paymentRequest]

    paymentSchedule = structuredClone(
      require('../../../mocks/payment-schedule')
    )
  })

  test('updates a Q schedule to Q3', () => {
    handleSFI23AdvancePayments(
      paymentRequests,
      previousPaymentRequests,
      paymentSchedule
    )

    expect(paymentRequests[0].schedule).toBe(Q3)
  })

  test('updates a T schedule to T3', () => {
    paymentRequest.schedule = 'T4'

    handleSFI23AdvancePayments(
      paymentRequests,
      previousPaymentRequests,
      paymentSchedule
    )

    expect(paymentRequests[0].schedule).toBe('T3')
  })

  test('sets the due date to the second instalment due date', () => {
    handleSFI23AdvancePayments(
      paymentRequests,
      previousPaymentRequests,
      paymentSchedule
    )

    expect(paymentRequests[0].dueDate).toBe(paymentSchedule[1].dueDate)
  })

  test('does not change payment requests for a non-SFI23 scheme', () => {
    paymentRequest.schemeId = SFI
    const originalPaymentRequests = structuredClone(paymentRequests)

    handleSFI23AdvancePayments(
      paymentRequests,
      previousPaymentRequests,
      paymentSchedule
    )

    expect(paymentRequests).toEqual(originalPaymentRequests)
  })

  test('does not change payment requests when processing a request other than PR1', () => {
    paymentRequest.paymentRequestNumber = 2
    const originalPaymentRequests = structuredClone(paymentRequests)

    handleSFI23AdvancePayments(
      paymentRequests,
      previousPaymentRequests,
      paymentSchedule
    )

    expect(paymentRequests).toEqual(originalPaymentRequests)
  })

  test('does not change payment requests when there is no advance payment', () => {
    previousPaymentRequests = [previousPaymentRequest]
    const originalPaymentRequests = structuredClone(paymentRequests)

    handleSFI23AdvancePayments(
      paymentRequests,
      previousPaymentRequests,
      paymentSchedule
    )

    expect(paymentRequests).toEqual(originalPaymentRequests)
  })

  test('does not change payment requests when the advance payment is not from 2023', () => {
    advancePaymentRequest.dueDate = '2024-01-01'
    const originalPaymentRequests = structuredClone(paymentRequests)

    handleSFI23AdvancePayments(
      paymentRequests,
      previousPaymentRequests,
      paymentSchedule
    )

    expect(paymentRequests).toEqual(originalPaymentRequests)
  })

  test('does not change AR payment requests', () => {
    paymentRequest.ledger = AR
    const originalPaymentRequests = structuredClone(paymentRequests)

    handleSFI23AdvancePayments(
      paymentRequests,
      previousPaymentRequests,
      paymentSchedule
    )

    expect(paymentRequests).toEqual(originalPaymentRequests)
  })
})
