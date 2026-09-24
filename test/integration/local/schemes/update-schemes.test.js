const { resetDatabase, closeDatabaseConnection } = require('../../../helpers')

const { SFI } = require('../../../../app/constants/schemes')

const db = require('../../../../app/database')

const { updateScheme } = require('../../../../app/schemes/update-scheme')

describe('update scheme', () => {
  beforeEach(async () => {
    jest.clearAllMocks()
    await resetDatabase()
  })

  test('should set scheme to active if active is true', async () => {
    await updateScheme(SFI, true)
    const updatedScheme = await db.scheme().where({ schemeId: SFI }).first()
    expect(updatedScheme.active).toBeTruthy()
  })

  test('should set scheme to inactive if active is false', async () => {
    await updateScheme(SFI, false)
    const updatedScheme = await db.scheme().where({ schemeId: SFI }).first()
    expect(updatedScheme.active).toBeFalsy()
  })

  afterAll(async () => {
    await closeDatabaseConnection()
  })
})
