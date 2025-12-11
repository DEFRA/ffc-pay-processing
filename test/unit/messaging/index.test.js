const { MessageReceiver } = require('ffc-messaging')
let start
let stop
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

    const messaging = require('../../../app/messaging')
    start = messaging.start
    stop = messaging.stop

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
    let mockPayment, mockAck, mockReturn, mockQc, mockManual, mockXb
    let instances

    beforeEach(() => {
      instances = []

      mockPayment = { subscribe: jest.fn(), closeConnection: jest.fn() }
      mockAck = { subscribe: jest.fn(), closeConnection: jest.fn() }
      mockReturn = { subscribe: jest.fn(), closeConnection: jest.fn() }
      mockQc = { subscribe: jest.fn(), closeConnection: jest.fn() }
      mockManual = { subscribe: jest.fn(), closeConnection: jest.fn() }
      mockXb = { subscribe: jest.fn(), closeConnection: jest.fn() }

      let callIndex = 0

      MessageReceiver.mockImplementation(() => {
        let mock
        if (callIndex < messageConfig.processingSubscription.numberOfReceivers) {
          mock = { subscribe: mockPayment.subscribe, closeConnection: mockPayment.closeConnection }
        } else {
          const offset = callIndex - messageConfig.processingSubscription.numberOfReceivers
          mock = [mockAck, mockReturn, mockQc, mockManual, mockXb][offset]
        }
        callIndex++
        instances.push(mock)
        return mock
      })
    })

    test('closes all receivers including optional ones', async () => {
      await start()
      await stop()

      expect(mockPayment.closeConnection).toHaveBeenCalledTimes(
        messageConfig.processingSubscription.numberOfReceivers
      )
      expect(mockAck.closeConnection).toHaveBeenCalled()
      expect(mockReturn.closeConnection).toHaveBeenCalled()
      expect(mockQc.closeConnection).toHaveBeenCalled()
      expect(mockManual.closeConnection).toHaveBeenCalled()
      expect(mockXb.closeConnection).toHaveBeenCalled()
    })
  })

  describe('stop when no receivers have been created', () => {
    let stopFn

    beforeEach(() => {
      jest.resetModules()

      jest.mock('ffc-messaging')
      jest.mock('../../../app/outbound')
      jest.mock('../../../app/messaging/process-payment-message')
      jest.mock('../../../app/messaging/process-acknowledgement-message')
      jest.mock('../../../app/messaging/process-return-message')
      jest.mock('../../../app/messaging/process-quality-check-message')
      jest.mock('../../../app/messaging/process-manual-ledger-check-message')
      jest.mock('../../../app/messaging/process-xb-response-message')
      jest.mock('../../../app/messaging/diagnostics', () => {
        return { createDiagnosticsHandler: jest.fn(fn => fn) }
      })

      const messaging = require('../../../app/messaging')
      stopFn = messaging.stop
    })

    test('stop does not throw when no receivers exist', async () => {
      await expect(stopFn()).resolves.not.toThrow()
    })
  })
})
