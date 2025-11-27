const { requiresManualLedgerCheck } = require('../../../app/processing/requires-manual-ledger-check')
const { processingConfig } = require('../../../app/config')
const { getCompletedPaymentRequests } = require('../../../app/processing/get-completed-payment-requests')
const { ignoreZeroValueSplits } = require('../../../app/processing/ignore-zero-value-splits')
const paymentRequestMock = require('../../mocks/payment-requests/payment-request')

jest.mock('../../../app/processing/get-completed-payment-requests')
jest.mock('../../../app/processing/ignore-zero-value-splits')

describe('requiresManualLedgerCheck', () => {
  let paymentRequest

  beforeEach(() => {
    jest.clearAllMocks()
    paymentRequest = structuredClone(paymentRequestMock)
    processingConfig.useManualLedgerCheck = true
  })

  test.each([
    { desc: 'manual ledger check disabled', config: false, value: 100, expected: false },
    { desc: 'payment request value is 0', config: true, value: 0, expected: false },
    { desc: 'payment request value is negative', config: true, value: -100, expected: true }
  ])('returns $expected when $desc', async ({ config, value, expected }) => {
    processingConfig.useManualLedgerCheck = config
    paymentRequest.value = value
    const result = await requiresManualLedgerCheck(paymentRequest)
    expect(result).toBe(expected)
  })

  test('returns false when there are no previous payment requests', async () => {
    getCompletedPaymentRequests.mockResolvedValue([])
    ignoreZeroValueSplits.mockReturnValue([])
    paymentRequest.value = 100
    const result = await requiresManualLedgerCheck(paymentRequest)
    expect(result).toBe(false)
  })

  test('returns false when there are no previous negative payment requests', async () => {
    const previousPaymentRequests = [
      { ...structuredClone(paymentRequestMock), value: 100 },
      { ...structuredClone(paymentRequestMock), value: 200 }
    ]
    getCompletedPaymentRequests.mockResolvedValue(previousPaymentRequests)
    ignoreZeroValueSplits.mockReturnValue(previousPaymentRequests)
    paymentRequest.value = 100
    const result = await requiresManualLedgerCheck(paymentRequest)
    expect(result).toBe(false)
  })

  test('returns true when there are previous negative payment requests', async () => {
    const previousPaymentRequests = [
      { ...structuredClone(paymentRequestMock), value: 100 },
      { ...structuredClone(paymentRequestMock), value: -50 }
    ]
    getCompletedPaymentRequests.mockResolvedValue(previousPaymentRequests)
    ignoreZeroValueSplits.mockReturnValue(previousPaymentRequests)
    paymentRequest.value = 100
    const result = await requiresManualLedgerCheck(paymentRequest)
    expect(result).toBe(true)
  })

  test('ignores zero value splits when checking previous payment requests', async () => {
    const previousPaymentRequests = [
      { ...structuredClone(paymentRequestMock), value: 100 },
      { ...structuredClone(paymentRequestMock), value: 50 },
      { ...structuredClone(paymentRequestMock), value: -50 }
    ]
    getCompletedPaymentRequests.mockResolvedValue(previousPaymentRequests)
    ignoreZeroValueSplits.mockReturnValue([previousPaymentRequests[0], previousPaymentRequests[1]])
    paymentRequest.value = 100
    const result = await requiresManualLedgerCheck(paymentRequest)
    expect(result).toBe(false)
  })
})
