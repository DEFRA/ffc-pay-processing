jest.mock('ffc-messaging')
jest.mock('../../../app/outbound', () => ({
  start: jest.fn()
}))
jest.mock('../../../app/messaging/diagnostics', () => ({
  createDiagnosticsHandler: jest.fn(name => jest.fn())
}))
jest.mock('../../../app/messaging/process-payment-message')
jest.mock('../../../app/messaging/process-acknowledgement-message')
jest.mock('../../../app/messaging/process-return-message')
jest.mock('../../../app/messaging/process-quality-check-message')
jest.mock('../../../app/messaging/process-manual-ledger-check-message')
jest.mock('../../../app/messaging/process-xb-response-message')
jest.mock('../../../app/messaging/process-retention-message')

const { MessageReceiver } = require('ffc-messaging')
const messaging = require('../../../app/messaging')
const { createDiagnosticsHandler } = require('../../../app/messaging/diagnostics')
const { start: startOutbox } = require('../../../app/outbound')
const { messageConfig } = require('../../../app/config')

describe('Messaging module', () => {
  let subscribeMock, closeConnectionMock

  beforeEach(() => {
    subscribeMock = jest.fn()
    closeConnectionMock = jest.fn()
    MessageReceiver.mockImplementation((config, action) => ({
      config,
      action,
      subscribe: subscribeMock,
      closeConnection: closeConnectionMock
    }))
    createDiagnosticsHandler.mockImplementation(name => jest.fn())
    startOutbox.mockResolvedValue()
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  test('start creates the correct number of payment receivers and subscribes all receivers', async () => {
    await messaging.start()

    expect(MessageReceiver).toHaveBeenCalledTimes(
      messageConfig.processingSubscription.numberOfReceivers + 6
    )

    for (let i = 0; i < messageConfig.processingSubscription.numberOfReceivers; i++) {
      expect(createDiagnosticsHandler).toHaveBeenCalledWith(`payment-receiver-${i + 1}`)
    }

    expect(createDiagnosticsHandler).toHaveBeenCalledWith('acknowledgement-receiver')
    expect(createDiagnosticsHandler).toHaveBeenCalledWith('return-receiver')
    expect(createDiagnosticsHandler).toHaveBeenCalledWith('qc-receiver')
    expect(createDiagnosticsHandler).toHaveBeenCalledWith('manual-ledger-receiver')
    expect(createDiagnosticsHandler).toHaveBeenCalledWith('xb-response-receiver')
    expect(createDiagnosticsHandler).toHaveBeenCalledWith('retention-receiver')

    expect(subscribeMock).toHaveBeenCalledTimes(
      messageConfig.processingSubscription.numberOfReceivers + 6
    )

    expect(startOutbox).toHaveBeenCalled()
  })

  test('stop calls closeConnection on all receivers', async () => {
    await messaging.start()
    await messaging.stop()

    const totalReceivers =
      messageConfig.processingSubscription.numberOfReceivers + 6
    expect(closeConnectionMock).toHaveBeenCalledTimes(totalReceivers)
  })

  test('each MessageReceiver is constructed with correct config and action', async () => {
    await messaging.start()

    const calls = MessageReceiver.mock.calls
    expect(calls).toHaveLength(messageConfig.processingSubscription.numberOfReceivers + 6)

    for (let i = 0; i < messageConfig.processingSubscription.numberOfReceivers; i++) {
      expect(calls[i][0]).toBe(messageConfig.processingSubscription)
      expect(typeof calls[i][1]).toBe('function')
    }

    expect(calls[messageConfig.processingSubscription.numberOfReceivers][0])
      .toBe(messageConfig.acknowledgementSubscription)
    expect(typeof calls[messageConfig.processingSubscription.numberOfReceivers][1]).toBe('function')

    expect(calls[messageConfig.processingSubscription.numberOfReceivers + 1][0])
      .toBe(messageConfig.returnSubscription)
    expect(typeof calls[messageConfig.processingSubscription.numberOfReceivers + 1][1]).toBe('function')

    expect(calls[messageConfig.processingSubscription.numberOfReceivers + 2][0])
      .toBe(messageConfig.qcSubscription)
    expect(typeof calls[messageConfig.processingSubscription.numberOfReceivers + 2][1]).toBe('function')

    expect(calls[messageConfig.processingSubscription.numberOfReceivers + 3][0])
      .toBe(messageConfig.qcManualSubscription)
    expect(typeof calls[messageConfig.processingSubscription.numberOfReceivers + 3][1]).toBe('function')

    expect(calls[messageConfig.processingSubscription.numberOfReceivers + 4][0])
      .toBe(messageConfig.xbResponseSubscription)
    expect(typeof calls[messageConfig.processingSubscription.numberOfReceivers + 4][1]).toBe('function')

    expect(calls[messageConfig.processingSubscription.numberOfReceivers + 5][0])
      .toBe(messageConfig.retentionSubscription)
    expect(typeof calls[messageConfig.processingSubscription.numberOfReceivers + 5][1]).toBe('function')
  })
})
