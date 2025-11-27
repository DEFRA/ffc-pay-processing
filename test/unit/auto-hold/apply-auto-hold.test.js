jest.mock('../../../app/config')
const { autoHold: mockAutoHoldConfig } = require('../../../app/config').processingConfig

jest.mock('../../../app/auto-hold/get-total-value')
const { getTotalValue: mockGetTotalValue } = require('../../../app/auto-hold/get-total-value')

jest.mock('../../../app/auto-hold/apply-hold')
const { applyHold: mockApplyHold } = require('../../../app/auto-hold/apply-hold')

const paymentRequest = require('../../mocks/payment-requests/payment-request')
const { TOP_UP, RECOVERY } = require('../../../app/constants/adjustment-types')
const { applyAutoHold } = require('../../../app/auto-hold/apply-auto-hold')

const paymentRequests = [paymentRequest]

describe('apply auto hold', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockAutoHoldConfig.topUp = true
    mockAutoHoldConfig.recovery = true
  })

  test('does not apply auto hold when request number is 1', async () => {
    const result = await applyAutoHold(paymentRequests)
    expect(result).toBe(false)
  })

  test('calculates total value for determining hold type', async () => {
    paymentRequest.paymentRequestNumber = 2
    await applyAutoHold(paymentRequests)
    expect(mockGetTotalValue).toHaveBeenCalledWith(paymentRequests)
  })

  describe('top up logic', () => {
    beforeEach(() => {
      paymentRequest.paymentRequestNumber = 2
    })

    test.each([
      { value: 1, name: 'positive total value' },
      { value: 0, name: 'zero total value' }
    ])('applies top up hold for $name', async ({ value }) => {
      mockGetTotalValue.mockReturnValue(value)
      await applyAutoHold(paymentRequests)
      expect(mockApplyHold).toHaveBeenCalledWith(paymentRequest, TOP_UP)
    })

    test('returns true when top up hold applied', async () => {
      mockGetTotalValue.mockReturnValue(1)
      const result = await applyAutoHold(paymentRequests)
      expect(result).toBe(true)
    })

    test('does not apply top up hold when disabled', async () => {
      mockGetTotalValue.mockReturnValue(1)
      mockAutoHoldConfig.topUp = false
      await applyAutoHold(paymentRequests)
      expect(mockApplyHold).not.toHaveBeenCalled()
    })

    test('returns false when not applied', async () => {
      mockGetTotalValue.mockReturnValue(1)
      mockAutoHoldConfig.topUp = false
      const result = await applyAutoHold(paymentRequests)
      expect(result).toBe(false)
    })
  })

  describe('recovery logic', () => {
    beforeEach(() => {
      paymentRequest.paymentRequestNumber = 2
    })

    test('applies recovery hold when total < 0', async () => {
      mockGetTotalValue.mockReturnValue(-1)
      await applyAutoHold(paymentRequests)
      expect(mockApplyHold).toHaveBeenCalledWith(paymentRequest, RECOVERY)
    })

    test('returns true when recovery hold applied', async () => {
      mockGetTotalValue.mockReturnValue(-1)
      const result = await applyAutoHold(paymentRequests)
      expect(result).toBe(true)
    })

    test('does not apply recovery hold when disabled', async () => {
      mockGetTotalValue.mockReturnValue(-1)
      mockAutoHoldConfig.recovery = false
      await applyAutoHold(paymentRequests)
      expect(mockApplyHold).not.toHaveBeenCalled()
    })

    test('returns false when not applied', async () => {
      mockGetTotalValue.mockReturnValue(-1)
      mockAutoHoldConfig.recovery = false
      const result = await applyAutoHold(paymentRequests)
      expect(result).toBe(false)
    })
  })
})
