const { closureDBEntry } = require('../../mocks/closure/closure-db-entry')
const db = require('../../../app/data')
const { resetDatabase } = require('../../helpers/reset-database')
const { removeClosureByFRNAndAgreement, getClosureCount } = require('../../../app/closures')

const { FRN } = require('../../mocks/values/frn')
const { AGREEMENT_NUMBER } = require('../../mocks/values/agreement-number')

describe('remove closure', () => {
  beforeEach(async () => {
    jest.clearAllMocks()
    await resetDatabase()
  })

  test('should remove relevant closure', async () => {
    await db.frnAgreementClosed.create(closureDBEntry)
    await removeClosureByFRNAndAgreement(FRN, AGREEMENT_NUMBER)
    const closures = await getClosureCount()
    expect(closures).toHaveLength(0)
  })
})
