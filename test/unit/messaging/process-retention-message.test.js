jest.mock('../../../app/retention', () => ({
  removeAgreementData: jest.fn()
}))

const { processRetentionMessage } = require('../../../app/messaging/process-retention-message')
const { removeAgreementData } = require('../../../app/retention')

describe('processRetentionMessage', () => {
  let message, receiver

  beforeEach(() => {
    message = {
      body: {
        agreementNumber: 'AG123',
        frn: 456789
      }
    }
    receiver = {
      completeMessage: jest.fn().mockResolvedValue(),
      deadLetterMessage: jest.fn().mockResolvedValue()
    }
    jest.spyOn(console, 'log').mockImplementation(() => { })
    jest.spyOn(console, 'error').mockImplementation(() => { })
    removeAgreementData.mockClear()
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  test('logs info, calls removeAgreementData and completes message on success', async () => {
    await processRetentionMessage(message, receiver)

    expect(console.log).toHaveBeenCalledWith(
      `Agreement ${message.body.agreementNumber} for FRN ${message.body.frn} has passed retention period`
    )
    expect(removeAgreementData).toHaveBeenCalledWith(message.body)
    expect(receiver.completeMessage).toHaveBeenCalledWith(message)
    expect(console.log).toHaveBeenCalledWith('Data related to agreement removed where present')
    expect(receiver.deadLetterMessage).not.toHaveBeenCalled()
    expect(console.error).not.toHaveBeenCalled()
  })

  test('logs error and dead letters the message when removeAgreementData throws', async () => {
    const error = new Error('Failure removing data')
    removeAgreementData.mockRejectedValue(error)

    await processRetentionMessage(message, receiver)

    expect(console.log).toHaveBeenCalledWith(
      `Agreement ${message.body.agreementNumber} for FRN ${message.body.frn} has passed retention period`
    )
    expect(removeAgreementData).toHaveBeenCalledWith(message.body)
    expect(receiver.completeMessage).not.toHaveBeenCalled()
    expect(receiver.deadLetterMessage).toHaveBeenCalledWith(message)
    expect(console.error).toHaveBeenCalledWith('Unable to process retention data:', error)
  })

  test('logs error and dead letters the message when receiver.deadLetterMessage throws', async () => {
    const error = new Error('Remove data failure')
    removeAgreementData.mockRejectedValue(error)
    receiver.deadLetterMessage.mockRejectedValue(new Error('Dead letter failure'))

    await expect(processRetentionMessage(message, receiver)).resolves.toBeUndefined()

    expect(removeAgreementData).toHaveBeenCalledWith(message.body)
    expect(receiver.deadLetterMessage).toHaveBeenCalledWith(message)
    expect(console.error).toHaveBeenCalledWith('Unable to process retention data:', error)
  })
})
