const { createQueryBuilder } = require('../../helpers/mock-knex')

const { SFI, BPS, CS } = require('../../../app/constants/schemes')
const { getCompletedPaymentRequestsFilter } = require('../../../app/processing/get-completed-payment-requests-filter')

let basePaymentRequest
let query

describe('get completed payment requests filter', () => {
  beforeEach(() => {
    query = createQueryBuilder()
    basePaymentRequest = {
      schemeId: SFI,
      frn: 1234567890,
      marketingYear: 2022,
      agreementNumber: 'AG12345678',
      contractNumber: 'C12345678',
      paymentRequestNumber: 1
    }
  })

  const applyFilter = (paymentRequest) => {
    const filter = getCompletedPaymentRequestsFilter(paymentRequest)
    filter(query)
  }

  test.each([SFI, BPS, CS])('should only include earlier payment requests for scheme %s', (scheme) => {
    applyFilter({ ...basePaymentRequest, schemeId: scheme })
    expect(query.where).toHaveBeenCalledWith('paymentRequestNumber', '<', 1)
    expect(query.whereNotNull).not.toHaveBeenCalled()
  })

  test.each([SFI, BPS, CS])('should include any numbered payment request for manual scheme %s', (scheme) => {
    applyFilter({ ...basePaymentRequest, schemeId: scheme, paymentRequestNumber: 0 })
    expect(query.whereNotNull).toHaveBeenCalledWith('paymentRequestNumber')
    expect(query.where).not.toHaveBeenCalledWith('paymentRequestNumber', '<', expect.anything())
  })

  test.each([SFI, BPS, CS])('should exclude invalid payment requests for scheme %s', (scheme) => {
    applyFilter({ ...basePaymentRequest, schemeId: scheme })
    expect(query.where).toHaveBeenCalledWith({ invalid: false })
  })

  test('should filter BPS by scheme, frn and marketing year', () => {
    applyFilter({ ...basePaymentRequest, schemeId: BPS })
    expect(query.where).toHaveBeenCalledWith({
      schemeId: BPS,
      frn: basePaymentRequest.frn,
      marketingYear: basePaymentRequest.marketingYear
    })
  })

  test('should filter CS by scheme, frn and either contract number format', () => {
    applyFilter({ ...basePaymentRequest, schemeId: CS, contractNumber: 'A0123' })
    expect(query.where).toHaveBeenCalledWith({
      schemeId: CS,
      frn: basePaymentRequest.frn
    })
    expect(query.where).toHaveBeenCalledWith({ contractNumber: 'A0123' })
    expect(query.orWhereRaw).toHaveBeenCalledWith('replace("contractNumber", \'A0\', \'A\') = ?', ['A123'])
  })

  test('should filter other schemes by scheme, frn, marketing year and agreement number', () => {
    applyFilter(basePaymentRequest)
    expect(query.where).toHaveBeenCalledWith({
      schemeId: SFI,
      frn: basePaymentRequest.frn,
      marketingYear: basePaymentRequest.marketingYear,
      agreementNumber: basePaymentRequest.agreementNumber
    })
  })
})
