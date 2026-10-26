const { createKnexMock } = require('../helpers/mock-knex')

const mockDb = createKnexMock(['scheme'])

jest.mock('../../app/database', () => ({
    client: mockDb.knex,
    transaction: mockDb.transaction,
    close: mockDb.close,
    ...mockDb.tables
}))

const {
    markSchemeAddedEventPublished
} = require('../../app/schemes')

describe('mark scheme added event published', () => {
    beforeEach(() => {
        jest.clearAllMocks()
        mockDb.builder.resolves(undefined)
    })

    test('should mark the scheme added event as published', async () => {
        const schemeId = 18

        await markSchemeAddedEventPublished(schemeId)

        expect(mockDb.tables.scheme).toHaveBeenCalledTimes(1)

        expect(mockDb.builder.where).toHaveBeenCalledWith({
            schemeId
        })

        expect(mockDb.builder.update).toHaveBeenCalledWith({
            schemeAddedEventPublishedAt: expect.any(Date)
        })
    })

    test('should propagate an error when marking the scheme added event as published fails', async () => {
        const schemeId = 18

        mockDb.builder.rejects(
            new Error('Database update failed')
        )

        await expect(
            markSchemeAddedEventPublished(schemeId)
        ).rejects.toThrow('Database update failed')

        expect(mockDb.tables.scheme).toHaveBeenCalledTimes(1)
    })
})