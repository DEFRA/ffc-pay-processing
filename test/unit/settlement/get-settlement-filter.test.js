jest.mock('ffc-pay-schemes', () => ({
  getSchemeIds: jest.fn(() => ({
    ES: 'ES',
    FC: 'FC',
    IMPS: 'IMPS'
  })),
  getSourceSystems: jest.fn(() => ({
    GENESIS: 'GENESIS',
    GLOS: 'GLOS',
    IMPS: 'IMPS'
  }))
}))

const settlement = require('../../mocks/settlements/settlement')
const esSettlement = require('../../mocks/settlements/es')
const fcSettlement = require('../../mocks/settlements/fc')
const impsSettlement = require('../../mocks/settlements/imps')

const { getSchemeIds } = require('ffc-pay-schemes')
const { getSettlementFilter } = require('../../../app/settlement/get-settlement-filter')

const { ES, FC, IMPS } = getSchemeIds()

describe('get settlement filter', () => {
  test('returns the default filter for an unsupported source system', () => {
    const paymentSettlement = {
      ...settlement,
      sourceSystem: 'UNKNOWN'
    }

    expect(getSettlementFilter(paymentSettlement)).toEqual({
      invoiceNumber: paymentSettlement.invoiceNumber
    })
  })

  test('returns the ES filter for Genesis settlements', () => {
    const paymentSettlement = {
      ...esSettlement,
      sourceSystem: 'GENESIS'
    }

    expect(getSettlementFilter(paymentSettlement)).toEqual({
      schemeId: ES,
      agreementNumber: paymentSettlement.transactionNumber
    })
  })

  test('returns the FC filter for GLOS settlements', () => {
    const paymentSettlement = {
      ...fcSettlement,
      sourceSystem: 'GLOS'
    }

    expect(getSettlementFilter(paymentSettlement)).toEqual({
      schemeId: FC,
      frn: paymentSettlement.frn,
      contractNumber: paymentSettlement.claimNumber,
      agreementNumber: paymentSettlement.agreementNumber
    })
  })

  test('returns the IMPS filter for IMPS settlements', () => {
    const paymentSettlement = {
      ...impsSettlement,
      sourceSystem: 'IMPS'
    }

    expect(getSettlementFilter(paymentSettlement)).toEqual({
      schemeId: IMPS,
      invoiceNumber: paymentSettlement.transactionNumber
    })
  })
})
