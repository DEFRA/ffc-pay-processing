jest.mock('ffc-pay-schemes', () => ({
  getSchemes: jest.fn(),
  schemeDoesNotRequirePPAs: jest.fn()
}))

const { createKnexMock, createQueryBuilder } = require('../helpers/mock-knex')

const mockDb = createKnexMock(['scheme', 'autoHoldCategory'])

jest.mock('../../app/database', () => ({
  client: mockDb.knex,
  transaction: mockDb.transaction,
  close: mockDb.close,
  ...mockDb.tables
}))

jest.mock('../../app/holds', () => ({
  addHoldType: jest.fn()
}))

jest.mock('../../app/event', () => ({
  sendSchemeAddedEvent: jest.fn()
}))

jest.mock('../../app/schemes', () => ({
  markSchemeAddedEventPublished: jest.fn()
}))

const { getSchemes, schemeDoesNotRequirePPAs } = require('ffc-pay-schemes')
const { addHoldType } = require('../../app/holds')
const {
  BANK_ACCOUNT_ANOMALY,
  DAX_REJECTION,
  AWAITING_DEBT_ENRICHMENT,
  AWAITING_LEDGER_CHECK
} = require('../../app/constants/hold-categories-names')

const { sendSchemeAddedEvent } = require('../../app/event')
const { markSchemeAddedEventPublished } = require('../../app/schemes')
const { updateSchemesDatabase } = require('../../app/update-schemes-database')

describe('update schemes database', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.spyOn(console, 'log').mockImplementation()
    mockDb.builder.resolves(undefined)
  })

  afterEach(() => {
    console.log.mockRestore()
  })

  test('should create required holds for a new scheme supporting PPAs', async () => {
    const scheme = {
      schemeId: 'scheme-id',
      schemeName: 'Scheme name'
    }

    getSchemes.mockReturnValue([scheme])
    schemeDoesNotRequirePPAs.mockReturnValue(false)

    await updateSchemesDatabase()

    expect(addHoldType).toHaveBeenCalledWith(BANK_ACCOUNT_ANOMALY, scheme.schemeId)
    expect(addHoldType).toHaveBeenCalledWith(DAX_REJECTION, scheme.schemeId)
    expect(addHoldType).toHaveBeenCalledTimes(2)

    expect(mockDb.builder.insert).toHaveBeenCalledWith({
      name: AWAITING_DEBT_ENRICHMENT,
      schemeId: scheme.schemeId
    })
    expect(mockDb.builder.insert).toHaveBeenCalledWith({
      name: AWAITING_LEDGER_CHECK,
      schemeId: scheme.schemeId
    })
  })

  test('should only create D365 holds for a new scheme not supporting PPAs', async () => {
    const scheme = {
      schemeId: 'scheme-id',
      schemeName: 'Scheme name'
    }

    getSchemes.mockReturnValue([scheme])
    schemeDoesNotRequirePPAs.mockReturnValue(true)

    await updateSchemesDatabase()

    expect(addHoldType).toHaveBeenCalledTimes(2)
    expect(mockDb.tables.autoHoldCategory).not.toHaveBeenCalled()
  })

  test('should not create holds for an existing scheme', async () => {
    const scheme = {
      schemeId: 'scheme-id',
      schemeName: 'Scheme name'
    }

    getSchemes.mockReturnValue([scheme])
    mockDb.builder.resolves(scheme)

    await updateSchemesDatabase()

    expect(addHoldType).not.toHaveBeenCalled()
    expect(mockDb.tables.autoHoldCategory).not.toHaveBeenCalled()
    expect(schemeDoesNotRequirePPAs).not.toHaveBeenCalled()
  })

  test('should update all supported schemes', async () => {
    const schemes = [
      { schemeId: 'scheme-one', schemeName: 'Scheme one' },
      { schemeId: 'scheme-two', schemeName: 'Scheme two' }
    ]

    getSchemes.mockReturnValue(schemes)
    schemeDoesNotRequirePPAs.mockReturnValue(false)

    const builderNew = createQueryBuilder()
    builderNew.resolves(undefined)
    const builderExisting = createQueryBuilder()
    builderExisting.resolves({
      schemeId: schemes[1].schemeId,
      name: schemes[1].schemeName,
      active: true,
      schemeAddedEventPublishedAt: new Date()
    })

    mockDb.tables.scheme
      .mockReturnValueOnce(builderNew)
      .mockReturnValueOnce(builderNew)
      .mockReturnValueOnce(builderExisting)
      .mockReturnValueOnce(builderExisting)

    await updateSchemesDatabase()

    expect(mockDb.tables.scheme).toHaveBeenCalledTimes(4)
    expect(addHoldType).toHaveBeenCalledTimes(2)
    expect(mockDb.tables.autoHoldCategory).toHaveBeenCalledTimes(2)
  })

  test('should publish and mark an event for a new scheme supporting PPAs', async () => {
    const scheme = {
      schemeId: 18,
      schemeName: 'SFI-26'
    }

    getSchemes.mockReturnValue([scheme])
    mockDb.builder.resolves(undefined)
    schemeDoesNotRequirePPAs.mockReturnValue(false)

    await updateSchemesDatabase()

    expect(sendSchemeAddedEvent).toHaveBeenCalledWith({
      schemeId: scheme.schemeId,
      schemeName: scheme.schemeName
    })

    expect(sendSchemeAddedEvent).toHaveBeenCalledTimes(1)

    expect(markSchemeAddedEventPublished)
      .toHaveBeenCalledWith(scheme.schemeId)

    expect(markSchemeAddedEventPublished)
      .toHaveBeenCalledTimes(1)
  })

  test('should publish and mark an event for a new scheme not supporting PPAs', async () => {
    const scheme = {
      schemeId: 18,
      schemeName: 'SFI-26'
    }

    getSchemes.mockReturnValue([scheme])
    mockDb.builder.resolves(undefined)
    schemeDoesNotRequirePPAs.mockReturnValue(true)

    await updateSchemesDatabase()

    expect(sendSchemeAddedEvent).toHaveBeenCalledWith({
      schemeId: scheme.schemeId,
      schemeName: scheme.schemeName
    })

    expect(markSchemeAddedEventPublished)
      .toHaveBeenCalledWith(scheme.schemeId)

    expect(sendSchemeAddedEvent).toHaveBeenCalledTimes(1)
    expect(markSchemeAddedEventPublished).toHaveBeenCalledTimes(1)
  })

  test('should not publish an event for an existing scheme that has already been published', async () => {
    const scheme = {
      schemeId: 18,
      schemeName: 'SFI-26'
    }

    const existingScheme = {
      schemeId: scheme.schemeId,
      name: scheme.schemeName,
      active: true,
      schemeAddedEventPublishedAt: new Date()
    }

    getSchemes.mockReturnValue([scheme])
    mockDb.builder.resolves(existingScheme)

    await updateSchemesDatabase()

    expect(sendSchemeAddedEvent).not.toHaveBeenCalled()
    expect(markSchemeAddedEventPublished).not.toHaveBeenCalled()
  })

  test('should retry publishing an event for an existing scheme without a published marker', async () => {
    const scheme = {
      schemeId: 18,
      schemeName: 'SFI-26'
    }

    const existingScheme = {
      schemeId: scheme.schemeId,
      name: scheme.schemeName,
      active: true,
      schemeAddedEventPublishedAt: null
    }

    getSchemes.mockReturnValue([scheme])
    mockDb.builder.resolves(existingScheme)

    await updateSchemesDatabase()

    expect(addHoldType).not.toHaveBeenCalled()
    expect(mockDb.tables.autoHoldCategory).not.toHaveBeenCalled()

    expect(sendSchemeAddedEvent).toHaveBeenCalledWith({
      schemeId: scheme.schemeId,
      schemeName: scheme.schemeName
    })

    expect(markSchemeAddedEventPublished)
      .toHaveBeenCalledWith(scheme.schemeId)
  })

  test('should not mark the scheme event as published when publishing fails', async () => {
    const scheme = {
      schemeId: 18,
      schemeName: 'SFI-26'
    }

    getSchemes.mockReturnValue([scheme])
    mockDb.builder.resolves(undefined)
    schemeDoesNotRequirePPAs.mockReturnValue(false)

    sendSchemeAddedEvent.mockRejectedValue(
      new Error('Publish failed')
    )

    await expect(updateSchemesDatabase())
      .rejects
      .toThrow('Publish failed')

    expect(sendSchemeAddedEvent).toHaveBeenCalledWith({
      schemeId: scheme.schemeId,
      schemeName: scheme.schemeName
    })

    expect(markSchemeAddedEventPublished)
      .not.toHaveBeenCalled()
  })

  test('should not publish an event if new scheme setup fails', async () => {
    const scheme = {
      schemeId: 18,
      schemeName: 'SFI-26'
    }

    getSchemes.mockReturnValue([scheme])
    mockDb.builder.resolves(undefined)

    addHoldType.mockRejectedValue(
      new Error('Hold creation failed')
    )

    await expect(updateSchemesDatabase())
      .rejects
      .toThrow('Hold creation failed')

    expect(sendSchemeAddedEvent).not.toHaveBeenCalled()
    expect(markSchemeAddedEventPublished).not.toHaveBeenCalled()
  })
})
