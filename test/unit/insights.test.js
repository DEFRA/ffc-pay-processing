describe('Application Insights', () => {
  const DEFAULT_ENV = process.env
  let applicationInsights
  let appInsightsModule

  beforeEach(() => {
    jest.resetModules()

    jest.mock('applicationinsights', () => ({
      setup: jest.fn().mockReturnThis(),
      start: jest.fn(),
      defaultClient: {
        context: {
          keys: { cloudRole: 'cloudRole' },
          tags: {}
        },
        trackException: jest.fn(),
        trackTrace: jest.fn()
      }
    }))

    applicationInsights = require('applicationinsights')
    appInsightsModule = require('../../app/insights')
    process.env = { ...DEFAULT_ENV }
  })

  afterAll(() => {
    process.env = DEFAULT_ENV
  })

  test('does not setup application insights if no connection string present', () => {
    process.env.APPINSIGHTS_CONNECTIONSTRING = undefined
    appInsightsModule.setup()
    expect(applicationInsights.setup.mock.calls.length).toBe(0)
  })

  test('does setup application insights if connection string present', () => {
    process.env.APPINSIGHTS_CONNECTIONSTRING = 'test-key'
    process.env.APPINSIGHTS_CLOUDROLE = 'TestRole'
    appInsightsModule.setup()
    expect(applicationInsights.setup.mock.calls.length).toBe(1)
    expect(applicationInsights.start.mock.calls.length).toBe(1)
    expect(applicationInsights.defaultClient.context.tags.cloudRole).toBe('TestRole')
  })

  test('trackException calls defaultClient.trackException if client exists', () => {
    process.env.APPINSIGHTS_CONNECTIONSTRING = 'test-key'
    appInsightsModule.setup()
    const error = new Error('Test error')
    appInsightsModule.trackException(error)
    expect(applicationInsights.defaultClient.trackException).toHaveBeenCalledWith({ exception: error })
  })

  test('trackException does not throw if no client', () => {
    const error = new Error('Test error')
    appInsightsModule.trackException(error)
  })

  test('trackTrace calls defaultClient.trackTrace if client exists', () => {
    process.env.APPINSIGHTS_CONNECTIONSTRING = 'test-key'
    appInsightsModule.setup()
    const message = 'Test trace'
    appInsightsModule.trackTrace(message)
    expect(applicationInsights.defaultClient.trackTrace).toHaveBeenCalledWith({ message })
  })

  test('trackTrace does not throw if no client', () => {
    const message = 'Test trace'
    appInsightsModule.trackTrace(message)
  })
})
