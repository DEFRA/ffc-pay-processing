const insights = require('../../../app/insights')
const { createDiagnosticsHandler } = require('../../../app/messaging/diagnostics')

describe('Service Bus diagnostics handler', () => {
  let consoleSpy
  let trackExceptionSpy

  beforeEach(() => {
    consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
    trackExceptionSpy = jest.spyOn(insights, 'trackException').mockImplementation(() => {})
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  test('logs error and calls trackException when error is provided', () => {
    const handler = createDiagnosticsHandler('test-receiver')
    const error = new Error('Test error')
    const args = { error }

    handler(args)

    expect(consoleSpy).toHaveBeenCalledWith('[test-receiver] Service Bus receiver error', {
      code: undefined,
      message: 'Test error',
      stack: error.stack
    })
    expect(trackExceptionSpy).toHaveBeenCalledTimes(1)
    expect(trackExceptionSpy).toHaveBeenCalledWith(error)
  })

  test('handles args being undefined without throwing', () => {
    const handler = createDiagnosticsHandler('test-receiver')

    expect(() => handler(undefined)).not.toThrow()

    expect(trackExceptionSpy).toHaveBeenCalledTimes(1)
    expect(trackExceptionSpy).toHaveBeenCalledWith(undefined)
  })

  test('handles args.error being undefined without throwing', () => {
    const handler = createDiagnosticsHandler('test-receiver')

    expect(() => handler({})).not.toThrow()

    expect(trackExceptionSpy).toHaveBeenCalledTimes(1)
    expect(trackExceptionSpy).toHaveBeenCalledWith(undefined)
  })
})
