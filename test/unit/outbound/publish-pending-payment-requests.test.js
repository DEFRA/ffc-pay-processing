const mockSendBatchMessages = jest.fn()
const mockCloseConnection = jest.fn()
const MockMessageBatchSender = jest.fn().mockImplementation(() => ({
  sendBatchMessages: mockSendBatchMessages,
  closeConnection: mockCloseConnection
}))

jest.mock('ffc-messaging', () => ({
  MessageBatchSender: MockMessageBatchSender
}))

jest.mock('../../../app/outbound/get-pending-payment-requests')
const { getPendingPaymentRequests: mockGetPendingPaymentRequests } = require('../../../app/outbound/get-pending-payment-requests')

jest.mock('../../../app/messaging/create-message')
const { createMessage: mockCreateMessage } = require('../../../app/messaging/create-message')

jest.mock('../../../app/event')
const { sendPublishingEvents: mockSendPublishingEvents, sendProcessingErrorEvent: mockSendProcessingErrorEvent } = require('../../../app/event')

jest.mock('../../../app/outbound/update-pending-payment-requests')
const { updatePendingPaymentRequests: mockUpdatePendingPaymentRequests } = require('../../../app/outbound/update-pending-payment-requests')

const paymentRequest = require('../../mocks/payment-requests/payment-request')
const message = require('../../mocks/messaging/message')
const db = require('../../../app/data')
const transactionSpy = jest.spyOn(db.sequelize, 'transaction')

const { publishPendingPaymentRequests } = require('../../../app/outbound/publish-pending-payment-requests')

describe('publish pending payment requests', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockCreateMessage.mockReturnValue(message)
  })

  test.each([
    { description: 'with payment requests', requests: [paymentRequest, paymentRequest], shouldSend: true },
    { description: 'without payment requests', requests: [], shouldSend: false }
  ])('should handle $description correctly', async ({ requests, shouldSend }) => {
    mockGetPendingPaymentRequests.mockResolvedValue(requests)

    await publishPendingPaymentRequests()

    expect(mockGetPendingPaymentRequests).toHaveBeenCalledTimes(1)
    expect(mockCreateMessage).toHaveBeenCalledTimes(requests.length)
    expect(MockMessageBatchSender).toHaveBeenCalledTimes(shouldSend ? 1 : 0)
    expect(mockSendBatchMessages).toHaveBeenCalledTimes(shouldSend ? 1 : 0)
    expect(mockCloseConnection).toHaveBeenCalledTimes(shouldSend ? 1 : 0)
    expect(mockSendPublishingEvents).toHaveBeenCalledTimes(shouldSend ? 1 : 0)
    expect(mockUpdatePendingPaymentRequests).toHaveBeenCalledTimes(shouldSend ? 1 : 0)
    expect(transactionSpy).toHaveBeenCalledTimes(1)
  })

  test('should send processing error event if error', async () => {
    mockGetPendingPaymentRequests.mockRejectedValue(new Error('Test error'))
    try {
      await publishPendingPaymentRequests()
    } catch {}
    expect(mockSendProcessingErrorEvent).toHaveBeenCalledTimes(1)
  })
})
