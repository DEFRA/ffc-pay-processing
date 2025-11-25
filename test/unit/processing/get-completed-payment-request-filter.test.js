jest.mock('../../../app/data')
const db = require('../../../app/data')

const { SFI, BPS, CS, FDMR } = require('../../../app/constants/schemes')
const { getCompletedPaymentRequestsFilter } = require('../../../app/processing/get-completed-payment-requests-filter')

let basePaymentRequest

describe('get completed payment requests filter', () => {
  beforeEach(() => {
    basePaymentRequest = {
      schemeId: SFI,
      frn: 1234567890,
      marketingYear: 2022,
      agreementNumber: 'AG12345678',
      contractNumber: 'C12345678',
      paymentRequestNumber: 1
    }
  })

  const expectFilter = (filter, paymentRequest, overrides = {}) => {
    expect(filter).toMatchObject({
      invalid: false,
      schemeId: paymentRequest.schemeId,
      frn: paymentRequest.frn,
      ...overrides
    })
  }

  test.each([
    { scheme: SFI, manual: false, expectedNumber: { [db.Sequelize.Op.lt]: 1 } },
    { scheme: SFI, manual: true, expectedNumber: { [db.Sequelize.Op.not]: null } },
    { scheme: BPS, manual: false, expectedNumber: { [db.Sequelize.Op.lt]: 1 } },
    { scheme: BPS, manual: true, expectedNumber: { [db.Sequelize.Op.not]: null } },
    { scheme: FDMR, manual: false, expectedNumber: { [db.Sequelize.Op.lt]: 1 } },
    { scheme: FDMR, manual: true, expectedNumber: { [db.Sequelize.Op.not]: null } },
    { scheme: CS, manual: false, expectedNumber: { [db.Sequelize.Op.lt]: 1 } },
    { scheme: CS, manual: true, expectedNumber: { [db.Sequelize.Op.not]: null } }
  ])(
    'should return correct filter for scheme $scheme (manual: $manual)',
    ({ scheme, manual, expectedNumber }) => {
      const paymentRequest = structuredClone(basePaymentRequest)
      paymentRequest.schemeId = scheme
      if (manual) paymentRequest.paymentRequestNumber = 0

      const filter = getCompletedPaymentRequestsFilter(paymentRequest)

      if (scheme === CS && manual) {
        expect(filter).toMatchObject({
          paymentRequestNumber: expectedNumber,
          [db.Sequelize.Op.or]: [
            { contractNumber: paymentRequest.contractNumber },
            db.Sequelize.where(
              db.Sequelize.fn('replace', db.Sequelize.col('contractNumber'), 'A0', 'A'),
              paymentRequest.contractNumber?.replace('A0', 'A')
            )
          ]
        })
      } else {
        expectFilter(filter, paymentRequest, { paymentRequestNumber: expectedNumber })
      }
    }
  )
})
