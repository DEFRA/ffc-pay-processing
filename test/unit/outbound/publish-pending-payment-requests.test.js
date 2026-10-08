jest.mock('../../../app/messaging/service-bus', () => ({
  getSender: jest.fn(),
  sendBatchMessages: jest.fn()
}))

jest.mock('../../../app/data', () => ({
  sequelize: {
    transaction: jest.fn()
  }
}))

jest.mock('../../../app/outbound/get-pending-payment-requests')
const { getPendingPaymentRequests: mockGetPendingPaymentRequests } = require('../../../app/outbound/get-pending-payment-requests')

jest.mock('../../../app/messaging/create-message')
const { createMessage: mockCreateMessage } = require('../../../app/messaging/create-message')

jest.mock('../../../app/event')
const { sendPublishingEvents: mockSendPublishingEvents, sendProcessingErrorEvent: mockSendProcessingErrorEvent } = require('../../../app/event')

jest.mock('../../../app/outbound/update-pending-payment-requests')
const { updatePendingPaymentRequests: mockUpdatePendingPaymentRequests } = require('../../../app/outbound/update-pending-payment-requests')

const { getSender, sendBatchMessages } = require('../../../app/messaging/service-bus')

const paymentRequest = require('../../mocks/payment-requests/payment-request')
const message = require('../../mocks/messaging/message')
const db = require('../../../app/data')

const { publishPendingPaymentRequests } = require('../../../app/outbound/publish-pending-payment-requests')

describe('publish pending payment requests', () => {
  const mockSender = { name: 'sender' }
  const mockTransaction = {
    commit: jest.fn().mockResolvedValue(),
    rollback: jest.fn().mockResolvedValue()
  }

  beforeEach(() => {
    jest.clearAllMocks()
    db.sequelize.transaction.mockResolvedValue(mockTransaction)
    mockCreateMessage.mockReturnValue(message)
    getSender.mockReturnValue(mockSender)
    sendBatchMessages.mockResolvedValue()
  })

  test.each([
    { description: 'with payment requests', requests: [paymentRequest, paymentRequest], shouldSend: true },
    { description: 'without payment requests', requests: [], shouldSend: false }
  ])('should handle $description correctly', async ({ requests, shouldSend }) => {
    mockGetPendingPaymentRequests.mockResolvedValue(requests)

    await publishPendingPaymentRequests()

    expect(mockGetPendingPaymentRequests).toHaveBeenCalledTimes(1)
    expect(mockCreateMessage).toHaveBeenCalledTimes(requests.length)
    expect(getSender).toHaveBeenCalledTimes(shouldSend ? 1 : 0)
    expect(sendBatchMessages).toHaveBeenCalledTimes(shouldSend ? 1 : 0)
    expect(mockSendPublishingEvents).toHaveBeenCalledTimes(shouldSend ? 1 : 0)
    expect(mockUpdatePendingPaymentRequests).toHaveBeenCalledTimes(shouldSend ? 1 : 0)
    expect(db.sequelize.transaction).toHaveBeenCalledTimes(1)
    expect(mockTransaction.commit).toHaveBeenCalledTimes(1)
  })

  test('should send processing error event if error', async () => {
    mockGetPendingPaymentRequests.mockRejectedValue(new Error('Test error'))
    try {
      await publishPendingPaymentRequests()
    } catch {}
    expect(mockSendProcessingErrorEvent).toHaveBeenCalledTimes(1)
  })
})
