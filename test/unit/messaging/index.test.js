const { MessageReceiver } = require('ffc-messaging')
const { start, stop } = require('../../../app/messaging')
const { messageConfig } = require('../../../app/config')
const { start: startOutbox } = require('../../../app/outbound')

jest.mock('ffc-messaging')
jest.mock('../../../app/outbound')
jest.mock('../../../app/messaging/process-payment-message')
jest.mock('../../../app/messaging/process-acknowledgement-message')
jest.mock('../../../app/messaging/process-return-message')
jest.mock('../../../app/messaging/process-quality-check-message')
jest.mock('../../../app/messaging/process-manual-ledger-check-message')
jest.mock('../../../app/messaging/process-xb-response-message')
jest.mock('../../../app/messaging/diagnostics', () => ({
  createDiagnosticsHandler: jest.fn(fn => fn)
}))

describe('Messaging', () => {
  let mockInstances

  beforeEach(() => {
    jest.clearAllMocks()
    mockInstances = []

    MessageReceiver.mockImplementation(() => {
      const mock = {
        subscribe: jest.fn(),
        closeConnection: jest.fn()
      }
      mockInstances.push(mock)
      return mock
    })
  })

  describe('start', () => {
    test('creates correct number of receivers', async () => {
      await start()
      expect(MessageReceiver).toHaveBeenCalledTimes(
        messageConfig.processingSubscription.numberOfReceivers + 5
      )
    })

    test('subscribes all receivers with diagnostics', async () => {
      await start()
      mockInstances.forEach(instance => {
        expect(instance.subscribe).toHaveBeenCalled()
      })
    })

    test('starts outbox', async () => {
      await start()
      expect(startOutbox).toHaveBeenCalled()
    })

    test.each([
      ['acknowledgement', messageConfig.acknowledgementSubscription],
      ['return', messageConfig.returnSubscription],
      ['quality check', messageConfig.qcSubscription],
      ['manual ledger check', messageConfig.qcManualSubscription],
      ['xb response', messageConfig.xbResponseSubscription]
    ])('creates %s receiver with correct subscription', async (_, subscription) => {
      await start()
      expect(MessageReceiver).toHaveBeenCalledWith(subscription, expect.any(Function))
    })

    test('handles subscription error', async () => {
      MessageReceiver.mockImplementationOnce(() => ({
        subscribe: jest.fn().mockRejectedValue(new Error('Test error')),
        closeConnection: jest.fn()
      }))
      await expect(start()).rejects.toThrow('Test error')
    })
  })

  describe('stop', () => {
    let mockAck, mockReturn, mockQc, mockManual, mockXb

    beforeEach(() => {
      mockAck = { subscribe: jest.fn(), closeConnection: jest.fn() }
      mockReturn = { subscribe: jest.fn(), closeConnection: jest.fn() }
      mockQc = { subscribe: jest.fn(), closeConnection: jest.fn() }
      mockManual = { subscribe: jest.fn(), closeConnection: jest.fn() }
      mockXb = { subscribe: jest.fn(), closeConnection: jest.fn() }

      let callIndex = 0
      MessageReceiver.mockImplementation((config) => {
        switch (callIndex++) {
          case messageConfig.processingSubscription.numberOfReceivers: return mockAck
          case messageConfig.processingSubscription.numberOfReceivers + 1: return mockReturn
          case messageConfig.processingSubscription.numberOfReceivers + 2: return mockQc
          case messageConfig.processingSubscription.numberOfReceivers + 3: return mockManual
          case messageConfig.processingSubscription.numberOfReceivers + 4: return mockXb
          default: return { subscribe: jest.fn(), closeConnection: jest.fn() }
        }
      })
    })

    test('closes all receivers including optional ones', async () => {
      await start()
      await stop()

      expect(mockAck.closeConnection).toHaveBeenCalled()
      expect(mockReturn.closeConnection).toHaveBeenCalled()
      expect(mockQc.closeConnection).toHaveBeenCalled()
      expect(mockManual.closeConnection).toHaveBeenCalled()
      expect(mockXb.closeConnection).toHaveBeenCalled()
    })
  })
})
