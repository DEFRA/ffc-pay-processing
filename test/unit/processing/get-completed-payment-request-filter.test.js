jest.mock('ffc-pay-schemes', () => ({
  getSchemeIds: jest.fn(() => ({
    BPS: 6,
    CS: 5,
    SFI: 1
  }))
}))

jest.mock('../../../app/data', () => {
  const Op = {
    lt: Symbol('lt'),
    not: Symbol('not'),
    or: Symbol('or')
  }

  return {
    Sequelize: {
      Op,
      fn: jest.fn((...args) => ({ fn: args })),
      col: jest.fn(column => ({ col: column })),
      where: jest.fn((...args) => ({ where: args }))
    }
  }
})

const { getSchemeIds } = require('ffc-pay-schemes')
const db = require('../../../app/data')
const { SFI, BPS, CS } = getSchemeIds()
const {
  getCompletedPaymentRequestsFilter
} = require('../../../app/processing/get-completed-payment-requests-filter')

describe('get completed payment requests filter', () => {
  const basePaymentRequest = {
    schemeId: SFI,
    frn: 1234567890,
    marketingYear: 2022,
    agreementNumber: 'AG12345678',
    contractNumber: 'C12345678',
    paymentRequestNumber: 1
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('returns the default filter for a non-BPS, non-CS scheme', () => {
    const filter = getCompletedPaymentRequestsFilter(basePaymentRequest)

    expect(filter).toEqual({
      paymentRequestNumber: {
        [db.Sequelize.Op.lt]: 1
      },
      invalid: false,
      schemeId: SFI,
      frn: basePaymentRequest.frn,
      marketingYear: basePaymentRequest.marketingYear,
      agreementNumber: basePaymentRequest.agreementNumber
    })
  })

  test('uses a non-null payment request number for manual payments', () => {
    const paymentRequest = {
      ...basePaymentRequest,
      paymentRequestNumber: 0
    }

    const filter = getCompletedPaymentRequestsFilter(paymentRequest)

    expect(filter.paymentRequestNumber).toEqual({
      [db.Sequelize.Op.not]: null
    })
  })

  test('returns a BPS filter without agreement number', () => {
    const paymentRequest = {
      ...basePaymentRequest,
      schemeId: BPS
    }

    const filter = getCompletedPaymentRequestsFilter(paymentRequest)

    expect(filter).toEqual({
      paymentRequestNumber: {
        [db.Sequelize.Op.lt]: paymentRequest.paymentRequestNumber
      },
      invalid: false,
      schemeId: BPS,
      frn: paymentRequest.frn,
      marketingYear: paymentRequest.marketingYear
    })
  })

  test('returns a CS filter using the contract number alternatives', () => {
    const paymentRequest = {
      ...basePaymentRequest,
      schemeId: CS,
      contractNumber: 'C0A012345'
    }

    const filter = getCompletedPaymentRequestsFilter(paymentRequest)

    expect(filter).toMatchObject({
      paymentRequestNumber: {
        [db.Sequelize.Op.lt]: paymentRequest.paymentRequestNumber
      },
      invalid: false,
      schemeId: CS,
      frn: paymentRequest.frn
    })

    expect(filter[db.Sequelize.Op.or]).toEqual([
      { contractNumber: paymentRequest.contractNumber },
      {
        where: [
          {
            fn: [
              'replace',
              { col: 'contractNumber' },
              'A0',
              'A'
            ]
          },
          paymentRequest.contractNumber.replaceAll('A0', 'A')
        ]
      }
    ])
  })

  test('returns a CS filter for a manual payment', () => {
    const paymentRequest = {
      ...basePaymentRequest,
      schemeId: CS,
      paymentRequestNumber: 0
    }

    const filter = getCompletedPaymentRequestsFilter(paymentRequest)

    expect(filter.paymentRequestNumber).toEqual({
      [db.Sequelize.Op.not]: null
    })
    expect(filter[db.Sequelize.Op.or]).toHaveLength(2)
  })
})
