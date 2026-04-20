describe('Application Insights', () => {
  const DEFAULT_ENV = process.env
  let useAzureMonitor

  beforeEach(() => {
    jest.resetModules()

    jest.mock('@azure/monitor-opentelemetry', () => ({
      useAzureMonitor: jest.fn(),
    }))

    useAzureMonitor = require('@azure/monitor-opentelemetry').useAzureMonitor

    process.env = { ...DEFAULT_ENV }

    jest.spyOn(console, 'log').mockImplementation(() => {})
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  afterAll(() => {
    process.env = DEFAULT_ENV
  })

  test('does not setup application insights if no connection string', () => {
    process.env.APPINSIGHTS_CONNECTIONSTRING = undefined
    const appInsights = require('../../app/insights')

    appInsights.setup()

    expect(useAzureMonitor).not.toHaveBeenCalled()
  })

  test('does setup application insights if connection string present', () => {
    process.env.APPINSIGHTS_CONNECTIONSTRING = 'test-connection-string'
    const appInsights = require('../../app/insights')

    appInsights.setup()

    expect(useAzureMonitor).toHaveBeenCalledTimes(1)
  })

  test('trackException does not throw if telemetry not initialized', () => {
    const appInsights = require('../../app/insights')
    const error = new Error('Test error')

    expect(() => appInsights.trackException(error)).not.toThrow()
  })

  test('trackException logs the error', () => {
    const appInsights = require('../../app/insights')
    const error = new Error('Test error')

    appInsights.trackException(error)

    expect(console.log).toHaveBeenCalledWith('Track Exception: ', error)
  })

  test('trackException works after setup', () => {
    process.env.APPINSIGHTS_CONNECTIONSTRING = 'test-connection-string'
    const appInsights = require('../../app/insights')

    appInsights.setup()

    const error = new Error('Test error')

    expect(() => appInsights.trackException(error)).not.toThrow()
  })

  test('trackTrace does not throw if telemetry not initialized', () => {
    const appInsights = require('../../app/insights')
    const message = 'Test trace'

    expect(() => appInsights.trackTrace(message)).not.toThrow()
  })

  test('trackTrace logs the message', () => {
    const appInsights = require('../../app/insights')
    const message = 'Test trace'

    appInsights.trackTrace(message)

    expect(console.log).toHaveBeenCalledWith('Track trace: ', message)
  })

  test('trackTrace works after setup', () => {
    process.env.APPINSIGHTS_CONNECTIONSTRING = 'test-connection-string'
    const appInsights = require('../../app/insights')

    appInsights.setup()

    const message = 'Test trace'

    expect(() => appInsights.trackTrace(message)).not.toThrow()
  })
})
