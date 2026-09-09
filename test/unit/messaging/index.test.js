jest.mock('../../../app/messaging/service-bus', () => ({
  createServiceBusClient: jest.fn(),
  createReceiver: jest.fn(),
  subscribeReceiver: jest.fn(),
  closeSenders: jest.fn()
}))
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

const { createServiceBusClient, createReceiver, subscribeReceiver, closeSenders } = require('../../../app/messaging/service-bus')
const messaging = require('../../../app/messaging')
const { createDiagnosticsHandler } = require('../../../app/messaging/diagnostics')
const { start: startOutbox } = require('../../../app/outbound')
const { messageConfig } = require('../../../app/config')

describe('Messaging module', () => {
  let closeReceiverMock
  let closeClientMock

  beforeEach(() => {
    jest.clearAllMocks()
    closeReceiverMock = jest.fn()
    closeClientMock = jest.fn()

    createServiceBusClient.mockReturnValue({
      close: closeClientMock
    })
    createReceiver.mockReturnValue({
      close: closeReceiverMock
    })
    createDiagnosticsHandler.mockImplementation(name => jest.fn())
    startOutbox.mockResolvedValue()
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  test('start creates the correct number of clients, receivers and subscriptions', async () => {
    await messaging.start()

    const totalReceivers = messageConfig.processingSubscription.numberOfReceivers + 6

    expect(createServiceBusClient).toHaveBeenCalledTimes(totalReceivers)
    expect(createReceiver).toHaveBeenCalledTimes(totalReceivers)
    expect(subscribeReceiver).toHaveBeenCalledTimes(totalReceivers)

    for (let i = 0; i < messageConfig.processingSubscription.numberOfReceivers; i++) {
      expect(createDiagnosticsHandler).toHaveBeenCalledWith(`payment-receiver-${i + 1}`)
    }

    expect(createDiagnosticsHandler).toHaveBeenCalledWith('acknowledgement-receiver')
    expect(createDiagnosticsHandler).toHaveBeenCalledWith('return-receiver')
    expect(createDiagnosticsHandler).toHaveBeenCalledWith('qc-receiver')
    expect(createDiagnosticsHandler).toHaveBeenCalledWith('manual-ledger-receiver')
    expect(createDiagnosticsHandler).toHaveBeenCalledWith('xb-response-receiver')
    expect(createDiagnosticsHandler).toHaveBeenCalledWith('retention-receiver')

    expect(startOutbox).toHaveBeenCalled()
  })

  test('stop closes all receivers, clients and senders', async () => {
    await messaging.start()
    await messaging.stop()

    const totalReceivers = messageConfig.processingSubscription.numberOfReceivers + 6
    expect(closeReceiverMock).toHaveBeenCalledTimes(totalReceivers)
    expect(closeClientMock).toHaveBeenCalledTimes(totalReceivers)
    expect(closeSenders).toHaveBeenCalled()
  })

  test('each receiver is created with correct config', async () => {
    await messaging.start()

    const receiverCalls = createReceiver.mock.calls
    expect(receiverCalls).toHaveLength(messageConfig.processingSubscription.numberOfReceivers + 6)

    for (let i = 0; i < messageConfig.processingSubscription.numberOfReceivers; i++) {
      expect(receiverCalls[i][1]).toBe(messageConfig.processingSubscription)
    }

    expect(receiverCalls[messageConfig.processingSubscription.numberOfReceivers][1])
      .toBe(messageConfig.acknowledgementSubscription)

    expect(receiverCalls[messageConfig.processingSubscription.numberOfReceivers + 1][1])
      .toBe(messageConfig.returnSubscription)

    expect(receiverCalls[messageConfig.processingSubscription.numberOfReceivers + 2][1])
      .toBe(messageConfig.qcSubscription)

    expect(receiverCalls[messageConfig.processingSubscription.numberOfReceivers + 3][1])
      .toBe(messageConfig.qcManualSubscription)

    expect(receiverCalls[messageConfig.processingSubscription.numberOfReceivers + 4][1])
      .toBe(messageConfig.xbResponseSubscription)

    expect(receiverCalls[messageConfig.processingSubscription.numberOfReceivers + 5][1])
      .toBe(messageConfig.retentionSubscription)
  })
})
