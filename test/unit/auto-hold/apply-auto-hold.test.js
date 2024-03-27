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

  test('should not apply auto hold when payment request number is 1', async () => {
    const result = await applyAutoHold(paymentRequests)
    expect(result).toBe(false)
  })

  test('should calculate total value of all payment requests to determine if top up or recovery', async () => {
    paymentRequest.paymentRequestNumber = 2
    await applyAutoHold(paymentRequests)
    expect(mockGetTotalValue).toHaveBeenCalledWith(paymentRequests)
  })

  test('should apply top up hold if total value is greater than 0 and auto hold top ups enabled', async () => {
    mockGetTotalValue.mockReturnValue(1)
    paymentRequest.paymentRequestNumber = 2
    await applyAutoHold(paymentRequests)
    expect(mockApplyHold).toHaveBeenCalledWith(paymentRequest.schemeId, paymentRequest.paymentRequestId, paymentRequest.frn, paymentRequest.marketingYear, TOP_UP)
  })

  test('should return true if top up hold applied', async () => {
    mockGetTotalValue.mockReturnValue(1)
    paymentRequest.paymentRequestNumber = 2
    const result = await applyAutoHold(paymentRequests)
    expect(result).toBe(true)
  })

  test('should apply top up hold if total value is 0 and auto hold tup ups enabled', async () => {
    mockGetTotalValue.mockReturnValue(0)
    paymentRequest.paymentRequestNumber = 2
    await applyAutoHold(paymentRequests)
    expect(mockApplyHold).toHaveBeenCalledWith(paymentRequest.schemeId, paymentRequest.paymentRequestId, paymentRequest.frn, paymentRequest.marketingYear, TOP_UP)
  })

  test('should not apply top up hold if top up but auto hold top ups disabled', async () => {
    mockGetTotalValue.mockReturnValue(1)
    mockAutoHoldConfig.topUp = false
    paymentRequest.paymentRequestNumber = 2
    await applyAutoHold(paymentRequests)
    expect(mockApplyHold).not.toHaveBeenCalled()
  })

  test('should return false if top up hold not applied', async () => {
    mockGetTotalValue.mockReturnValue(1)
    mockAutoHoldConfig.topUp = false
    paymentRequest.paymentRequestNumber = 2
    const result = await applyAutoHold(paymentRequests)
    expect(result).toBe(false)
  })

  test('should apply recovery hold if total value is less than 0 and auto hold recoveries enabled', async () => {
    mockGetTotalValue.mockReturnValue(-1)
    paymentRequest.paymentRequestNumber = 2
    await applyAutoHold(paymentRequests)
    expect(mockApplyHold).toHaveBeenCalledWith(paymentRequest.schemeId, paymentRequest.paymentRequestId, paymentRequest.frn, paymentRequest.marketingYear, RECOVERY)
  })

  test('should return true if recovery hold applied', async () => {
    mockGetTotalValue.mockReturnValue(-1)
    paymentRequest.paymentRequestNumber = 2
    const result = await applyAutoHold(paymentRequests)
    expect(result).toBe(true)
  })

  test('should not apply recovery hold if recovery but auto hold recoveries disabled', async () => {
    mockGetTotalValue.mockReturnValue(-1)
    mockAutoHoldConfig.recovery = false
    paymentRequest.paymentRequestNumber = 2
    await applyAutoHold(paymentRequests)
    expect(mockApplyHold).not.toHaveBeenCalled()
  })

  test('should return false if recovery hold not applied', async () => {
    mockGetTotalValue.mockReturnValue(-1)
    mockAutoHoldConfig.recovery = false
    paymentRequest.paymentRequestNumber = 2
    const result = await applyAutoHold(paymentRequests)
    expect(result).toBe(false)
  })
})
