jest.mock('../../app/insights', () => ({
  setup: jest.fn()
}))
jest.mock('log-timestamp', () => jest.fn())
jest.mock('../../app/config', () => ({
  processingConfig: { active: true }
}))
jest.mock('../../app/messaging', () => ({
  start: jest.fn(),
  stop: jest.fn()
}))
jest.mock('../../app/processing', () => ({
  start: jest.fn()
}))
jest.mock('../../app/server', () => ({
  start: jest.fn()
}))
jest.mock('../../app/metrics/metrics-polling', () => ({
  startMetricsPolling: jest.fn(),
  stopMetricsPolling: jest.fn()
}))
jest.mock('../../app/update-schemes-database', () => ({
  updateSchemesDatabase: jest.fn()
}))

let signalHandler

jest.spyOn(process, 'on').mockImplementation((event, handler) => {
  if (Array.isArray(event) && event.includes('SIGTERM')) {
    signalHandler = handler
  }
  return process
})

jest.spyOn(process, 'exit').mockImplementation(() => { })

const { processingConfig } = require('../../app/config')
const { start: mockStartMessaging, stop: mockStopMessaging } = require('../../app/messaging')
const { start: mockStartProcessing } = require('../../app/processing')
const { start: mockStartServer } = require('../../app/server')
const {
  startMetricsPolling: mockStartMetricsPolling,
  stopMetricsPolling: mockStopMetricsPolling
} = require('../../app/metrics/metrics-polling')
const { updateSchemesDatabase: mockUpdateSchemesDatabase } = require('../../app/update-schemes-database')
const startApp = require('../../app')

describe('app start', () => {
  beforeAll(async () => {
    // Allow the startup invocation in app/index.js to complete.
    await new Promise(resolve => setImmediate(resolve))
  })

  beforeEach(() => {
    jest.clearAllMocks()
    processingConfig.active = true
  })

  afterAll(() => {
    process.on.mockRestore()
    process.exit.mockRestore()
  })

  test('always starts the server and updates the schemes database', async () => {
    await startApp()

    expect(mockStartServer).toHaveBeenCalledTimes(1)
    expect(mockUpdateSchemesDatabase).toHaveBeenCalledTimes(1)
  })

  describe.each([
    ['processing', mockStartProcessing],
    ['messaging', mockStartMessaging],
    ['metrics polling', mockStartMetricsPolling]
  ])('starts %s based on active flag', (name, startMock) => {
    test(`starts ${name} when active is true`, async () => {
      await startApp()

      expect(startMock).toHaveBeenCalledTimes(1)
    })

    test(`does not start ${name} when active is false`, async () => {
      processingConfig.active = false

      await startApp()

      expect(startMock).not.toHaveBeenCalled()
    })
  })

  test('logs when processing is inactive', async () => {
    processingConfig.active = false
    const consoleInfoSpy = jest.spyOn(console, 'info').mockImplementation(() => { })

    await startApp()

    expect(consoleInfoSpy).toHaveBeenCalledWith(
      expect.stringContaining('Processing capabilities are currently not enabled in this environment')
    )

    consoleInfoSpy.mockRestore()
  })

  test('does not log when processing is active', async () => {
    const consoleInfoSpy = jest.spyOn(console, 'info').mockImplementation(() => { })

    await startApp()

    expect(consoleInfoSpy).not.toHaveBeenCalled()

    consoleInfoSpy.mockRestore()
  })

  test('stops messaging and metrics polling on shutdown', async () => {
    await signalHandler()

    expect(mockStopMessaging).toHaveBeenCalledTimes(1)
    expect(mockStopMetricsPolling).toHaveBeenCalledTimes(1)
    expect(process.exit).toHaveBeenCalledWith(0)
  })
})
