const { removeFRNAgreementClosed } = require('../../../app/retention/remove-frn-agreement-closed')
const db = require('../../../app/data')

jest.mock('../../../app/data', () => ({
  frnAgreementClosed: {
    destroy: jest.fn()
  }
}))

describe('removeFRNAgreementClosed', () => {
  const agreementNumber = 'AGR123'
  const frn = 456789
  const schemeId = 10
  const transaction = { id: 'transaction-object' }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('calls db.frnAgreementClosed.destroy with correct parameters', async () => {
    await removeFRNAgreementClosed(agreementNumber, frn, schemeId, transaction)

    expect(db.frnAgreementClosed.destroy).toHaveBeenCalledTimes(1)
    expect(db.frnAgreementClosed.destroy).toHaveBeenCalledWith({
      where: { agreementNumber, frn, schemeId },
      transaction
    })
  })

  test('calls db.frnAgreementClosed.destroy with undefined transaction if not provided', async () => {
    await removeFRNAgreementClosed(agreementNumber, frn, schemeId)

    expect(db.frnAgreementClosed.destroy).toHaveBeenCalledWith({
      where: { agreementNumber, frn, schemeId },
      transaction: undefined
    })
  })

  test('propagates errors from db.frnAgreementClosed.destroy', async () => {
    const error = new Error('DB failure')
    db.frnAgreementClosed.destroy.mockRejectedValue(error)

    await expect(removeFRNAgreementClosed(agreementNumber, frn, schemeId, transaction)).rejects.toThrow('DB failure')
  })
})
