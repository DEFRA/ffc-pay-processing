jest.mock('../../../app/messaging/service-bus', () => ({
  getSender: jest.fn(),
  sendMessage: jest.fn()
}))

jest.mock('../../../app/messaging/create-message')
const { createMessage: mockCreateMessage } = require('../../../app/messaging/create-message')
const { getSender, sendMessage: sendServiceBusMessage } = require('../../../app/messaging/service-bus')

const message = require('../../mocks/messaging/message')
const paymentRequest = require('../../mocks/payment-requests/payment-request')

const { PROCESSING } = require('../../../app/constants/messages')

const { messageConfig } = require('../../../app/config')

const { sendMessage } = require('../../../app/messaging/send-message')

describe('send message', () => {
  const mockSender = { name: 'sender' }

  beforeEach(() => {
    jest.clearAllMocks()

    mockCreateMessage.mockReturnValue(message)
    getSender.mockReturnValue(mockSender)
    sendServiceBusMessage.mockResolvedValue()
  })

  test('should create message from payment request and type', async () => {
    await sendMessage(paymentRequest, PROCESSING, messageConfig)
    expect(mockCreateMessage).toHaveBeenCalledWith(paymentRequest, PROCESSING)
  })

  test('should get cached sender for config', async () => {
    await sendMessage(paymentRequest, PROCESSING, messageConfig)
    expect(getSender).toHaveBeenCalledWith(messageConfig)
  })

  test('should send created message using cached sender', async () => {
    await sendMessage(paymentRequest, PROCESSING, messageConfig)
    expect(sendServiceBusMessage).toHaveBeenCalledWith(mockSender, message)
  })
})
