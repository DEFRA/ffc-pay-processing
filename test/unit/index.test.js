jest.mock('../../app/messaging')
jest.mock('../../app/processing')
jest.mock('../../app/server')

const { processingConfig } = require('../../app/config')
const { start: mockStartMessaging } = require('../../app/messaging')
const { start: mockStartProcessing } = require('../../app/processing')
const { start: mockStartServer } = require('../../app/server')

const startApp = require('../../app')

describe('app start', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe.each([
    ['processing', mockStartProcessing],
    ['messaging', mockStartMessaging]
  ])('starts %s based on active flag', (name, startMock) => {
    test(`starts ${name} when active is true`, async () => {
      processingConfig.active = true
      await startApp()
      expect(startMock).toHaveBeenCalledTimes(1)
    })

    test(`does not start ${name} when active is false`, async () => {
      processingConfig.active = false
      await startApp()
      expect(startMock).not.toHaveBeenCalled()
    })
  })

  test('always starts server regardless of active flag', async () => {
    processingConfig.active = true
    await startApp()
    expect(mockStartServer).toHaveBeenCalledTimes(1)

    jest.clearAllMocks()
    processingConfig.active = false
    await startApp()
    expect(mockStartServer).toHaveBeenCalledTimes(1)
  })

  test('logs console.info when active is false', async () => {
    processingConfig.active = false
    const consoleInfoSpy = jest.spyOn(console, 'info').mockImplementation(() => {})
    await startApp()
    expect(consoleInfoSpy).toHaveBeenCalledWith(
      expect.stringContaining('Processing capabilities are currently not enabled in this environment')
    )
    consoleInfoSpy.mockRestore()
  })

  test('does not log console.info when active is true', async () => {
    processingConfig.active = true
    const consoleInfoSpy = jest.spyOn(console, 'info').mockImplementation(() => {})
    await startApp()
    expect(consoleInfoSpy).not.toHaveBeenCalled()
    consoleInfoSpy.mockRestore()
  })
})
