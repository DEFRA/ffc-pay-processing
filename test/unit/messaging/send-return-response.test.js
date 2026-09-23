jest.mock('../../../app/messaging/service-bus', () => ({
  getSender: jest.fn(),
  sendMessage: jest.fn()
}))

jest.mock('../../../app/config', () => ({
  messageConfig: {
    returnResponseTopic: { address: 'test-topic', host: 'test.servicebus.windows.net' }
  }
}))

jest.mock('../../../app/constants/source', () => ({
  SOURCE: 'test-source'
}))

const { getSender, sendMessage: sendServiceBusMessage } = require('../../../app/messaging/service-bus')
const { SOURCE } = require('../../../app/constants/source')
const { messageConfig } = require('../../../app/config')
const { sendReturnResponse } = require('../../../app/messaging/send-return-response')

describe('sendReturnResponse', () => {
  const paymentRequest = {
    sourceSystem: 'test-system',
    someOtherField: 'some-value'
  }
  const type = 'test-type'
  const mockSender = { name: 'sender' }

  beforeEach(() => {
    jest.clearAllMocks()

    getSender.mockReturnValue(mockSender)
    sendServiceBusMessage.mockResolvedValue()
  })

  test('should get cached sender for return response topic', async () => {
    await sendReturnResponse(paymentRequest, type)
    expect(getSender).toHaveBeenCalledWith(messageConfig.returnResponseTopic)
  })

  test('should send a message with the correct structure', async () => {
    await sendReturnResponse(paymentRequest, type)
    expect(sendServiceBusMessage).toHaveBeenCalledWith(mockSender, {
      body: paymentRequest,
      type,
      source: SOURCE,
      subject: paymentRequest.sourceSystem
    })
  })

  test('should propagate errors from sendMessage', async () => {
    const error = new Error('sendMessage failed')
    sendServiceBusMessage.mockRejectedValueOnce(error)

    await expect(sendReturnResponse(paymentRequest, type)).rejects.toThrow('sendMessage failed')
  })
})
