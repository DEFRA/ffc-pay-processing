const { EventPublisher } = require('ffc-pay-event-publisher')
const { messageConfig } = require('../../../app/config')
const { SOURCE } = require('../../../app/constants/source')
const { SCHEME_ADDED } = require('../../../app/constants/events')
const {
  sendSchemeAddedEvent
} = require('../../../app/event/send-scheme-added-event')

jest.mock('ffc-pay-event-publisher')

describe('send scheme added event', () => {
  const publishEvent = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()

    EventPublisher.mockImplementation(() => ({
      publishEvent
    }))
  })

  test('should publish a scheme added event', async () => {
    const scheme = {
      schemeId: 18,
      schemeName: 'SFI-26'
    }

    await sendSchemeAddedEvent(scheme)

    expect(EventPublisher).toHaveBeenCalledWith(
      messageConfig.eventsTopic
    )

    expect(publishEvent).toHaveBeenCalledWith({
      source: SOURCE,
      type: SCHEME_ADDED,
      data: {
        message: 'A new scheme has been added to Payment Hub',
        schemeId: scheme.schemeId,
        schemeName: scheme.schemeName
      }
    })
  })
})
