jest.mock('../../../app/settlement')
jest.mock('../../../app/event')

const { processSettlement: mockProcessSettlement, checkInvoiceNumberBlocked } = require('../../../app/settlement')
const { sendProcessingErrorEvent: mockSendProcessingErrorEvent } = require('../../../app/event')

const receiver = require('../../mocks/messaging/receiver')
const { processReturnMessage } = require('../../../app/messaging/process-return-message')

describe('process return message', () => {
  let testMessage

  beforeEach(() => {
    jest.clearAllMocks()
    mockProcessSettlement.mockResolvedValue(true)
    testMessage = structuredClone(require('../../mocks/messaging/return'))
    jest.mocked(checkInvoiceNumberBlocked).mockReturnValue(false)
  })

  test('should block settlement if invoice number is blocked', async () => {
    testMessage.body.invoiceNumber = 'F0000001C0000001V001'
    jest.mocked(checkInvoiceNumberBlocked).mockReturnValue(true)

    await processReturnMessage(testMessage, receiver)

    expect(mockProcessSettlement).not.toHaveBeenCalled()
    expect(receiver.completeMessage).toHaveBeenCalledWith(testMessage)
    expect(receiver.deadLetterMessage).not.toHaveBeenCalled()
  })

  test.each([
    ['successfully processed', true, 'completeMessage', 'deadLetterMessage'],
    ['unable to match settlement', false, 'deadLetterMessage', 'completeMessage']
  ])(
    'should handle message when settlement is %s',
    async (_desc, processResult, expectedReceiverFn, notExpectedReceiverFn) => {
      mockProcessSettlement.mockResolvedValue(processResult)

      await processReturnMessage(testMessage, receiver)

      expect(receiver[expectedReceiverFn]).toHaveBeenCalledWith(testMessage)
      expect(receiver[notExpectedReceiverFn]).not.toHaveBeenCalled()
    }
  )

  test('should process settlement when invoice not blocked', async () => {
    await processReturnMessage(testMessage, receiver)

    expect(mockProcessSettlement).toHaveBeenCalledTimes(1)
    expect(mockProcessSettlement).toHaveBeenCalledWith(testMessage.body)
  })

  test('should send processing error event if settlement throws', async () => {
    const error = new Error('Test error')
    mockProcessSettlement.mockRejectedValue(error)

    await processReturnMessage(testMessage, receiver)

    expect(mockSendProcessingErrorEvent).toHaveBeenCalledWith(testMessage.body, error)
    expect(receiver.completeMessage).not.toHaveBeenCalled()
  })
})
