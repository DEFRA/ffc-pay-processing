jest.mock('../../../app/processing/get-completed-payment-requests')
const { getCompletedPaymentRequests: mockGetCompletedPaymentRequests } = require('../../../app/processing/get-completed-payment-requests')

jest.mock('../../../app/processing/due-dates')
const { confirmDueDates: mockConfirmDueDates } = require('../../../app/processing/due-dates')

jest.mock('../../../app/processing/enrichment')
const { enrichPaymentRequests: mockEnrichPaymentRequests } = require('../../../app/processing/enrichment')

const paymentRequest = require('../../mocks/payment-requests/payment-request')
const { transformPaymentRequest } = require('../../../app/routing/transform-payment-request')

describe('transformPaymentRequest', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockGetCompletedPaymentRequests.mockResolvedValue([paymentRequest])
    mockConfirmDueDates.mockReturnValue([paymentRequest])
    mockEnrichPaymentRequests.mockReturnValue([paymentRequest])
  })

  test.each([
    { desc: 'get all previous completed payment requests', fn: () => mockGetCompletedPaymentRequests, args: [paymentRequest] },
    { desc: 'confirm due dates of payment requests', fn: () => mockConfirmDueDates, args: [[paymentRequest], [paymentRequest]] },
    { desc: 'enrich payment requests received from ledger check', fn: () => mockEnrichPaymentRequests, args: [[paymentRequest], [paymentRequest]] }
  ])('should $desc', async ({ fn, args }) => {
    await transformPaymentRequest(paymentRequest, [paymentRequest])
    expect(fn()).toHaveBeenCalledWith(...args)
  })
})
