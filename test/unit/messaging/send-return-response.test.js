jest.mock('ffc-messaging', () => {
  return {
    MessageSender: jest.fn()
  }
})

jest.mock('../../../app/config', () => ({
  messageConfig: {
    returnResponseTopic: 'test-topic'
  }
}))

jest.mock('../../../app/constants/source', () => ({
  SOURCE: 'test-source'
}))

const { MessageSender } = require('ffc-messaging')
const { SOURCE } = require('../../../app/constants/source')
const { messageConfig } = require('../../../app/config')
const { sendReturnResponse } = require('../../../app/messaging/send-return-response')

describe('sendReturnResponse', () => {
  const paymentRequest = {
    sourceSystem: 'test-system',
    someOtherField: 'some-value'
  }
  const type = 'test-type'

  let mockSendMessage
  let mockCloseConnection

  beforeEach(() => {
    jest.clearAllMocks()

    mockSendMessage = jest.fn().mockResolvedValue()
    mockCloseConnection = jest.fn().mockResolvedValue()

    MessageSender.mockImplementation(() => {
      return {
        sendMessage: mockSendMessage,
        closeConnection: mockCloseConnection
      }
    })
  })

  test('should create a MessageSender with the correct topic', async () => {
    await sendReturnResponse(paymentRequest, type)
    expect(MessageSender).toHaveBeenCalledWith(messageConfig.returnResponseTopic)
  })

  test('should send a message with the correct structure', async () => {
    await sendReturnResponse(paymentRequest, type)
    expect(mockSendMessage).toHaveBeenCalledWith({
      body: paymentRequest,
      type,
      source: SOURCE,
      subject: paymentRequest.sourceSystem
    })
  })

  test('should close the connection after sending the message', async () => {
    await sendReturnResponse(paymentRequest, type)
    expect(mockCloseConnection).toHaveBeenCalled()
  })

  test('should propagate errors from sendMessage', async () => {
    const error = new Error('sendMessage failed')
    mockSendMessage.mockRejectedValueOnce(error)

    await expect(sendReturnResponse(paymentRequest, type)).rejects.toThrow('sendMessage failed')
    expect(mockCloseConnection).not.toHaveBeenCalled()
  })

  test('should propagate errors from closeConnection', async () => {
    const error = new Error('closeConnection failed')
    mockCloseConnection.mockRejectedValueOnce(error)

    await expect(sendReturnResponse(paymentRequest, type)).rejects.toThrow('closeConnection failed')
    expect(mockSendMessage).toHaveBeenCalled()
  })
})
