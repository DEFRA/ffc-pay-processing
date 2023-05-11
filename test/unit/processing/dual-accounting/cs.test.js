const { CS } = require('../../../../app/constants/schemes')
const { DRD00, DRD10, DEX10, EXQ00, DRD01, DRD05 } = require('../../../../app/constants/domestic-fund-codes')

const { applyCSDualAccounting } = require('../../../../app/processing/dual-accounting/cs')
const capitalSchemes = require('../../../../app/constants/capital-schemes')

let paymentRequest
let previousPaymentRequests

describe('apply dual accounting', () => {
  beforeEach(() => {
    jest.clearAllMocks()

    paymentRequest = {
      invoiceLines: [{
        fundCode: 'ERD14',
        schemeCode: '1234A'
      }],
      schemeId: CS
    }

    previousPaymentRequests = [{
      invoiceLines: [{
        fundCode: 'ERD14',
        schemeCode: '1234A'
      }],
      schemeId: CS
    }]
  })

  test('should not change fund code if existing fund code is DRD10', () => {
    paymentRequest.invoiceLines[0].fundCode = DRD10
    applyCSDualAccounting(paymentRequest, previousPaymentRequests)
    expect(paymentRequest.invoiceLines[0].fundCode).toBe(DRD10)
  })

  test('should not change fund code if existing fund code is DEX10', () => {
    paymentRequest.invoiceLines[0].fundCode = DEX10
    applyCSDualAccounting(paymentRequest, previousPaymentRequests)
    expect(paymentRequest.invoiceLines[0].fundCode).toBe(DEX10)
  })

  test('should not change fund code if existing fund code is EXQ00', () => {
    paymentRequest.invoiceLines[0].fundCode = EXQ00
    applyCSDualAccounting(paymentRequest, previousPaymentRequests)
    expect(paymentRequest.invoiceLines[0].fundCode).toBe(EXQ00)
  })

  test('should change fund code to DRD00 if capital first payment', () => {
    paymentRequest.invoiceLines[0].schemeCode = capitalSchemes[0]
    previousPaymentRequests = []
    applyCSDualAccounting(paymentRequest, previousPaymentRequests)
    expect(paymentRequest.invoiceLines[0].fundCode).toBe(DRD00)
  })

  test('should change fund code to previous domestic fund code if capital and previous domestic fund code', () => {
    paymentRequest.invoiceLines[0].schemeCode = capitalSchemes[0]
    previousPaymentRequests[0].invoiceLines[0].fundCode = DRD00
    applyCSDualAccounting(paymentRequest, previousPaymentRequests)
    expect(paymentRequest.invoiceLines[0].fundCode).toBe(DRD00)
  })

  test('should change fund code to DRD01 if capital and no previous domestic fund code', () => {
    paymentRequest.invoiceLines[0].schemeCode = capitalSchemes[0]
    previousPaymentRequests[0].invoiceLines[0].fundCode = 'ERD14'
    applyCSDualAccounting(paymentRequest, previousPaymentRequests)
    expect(paymentRequest.invoiceLines[0].fundCode).toBe(DRD01)
  })

  test('should change fund code to DRD05 if revenue first payment', () => {
    previousPaymentRequests = []
    applyCSDualAccounting(paymentRequest, previousPaymentRequests)
    expect(paymentRequest.invoiceLines[0].fundCode).toBe(DRD05)
  })

  test('should change fund code to previous domestic fund code if revenue and previous domestic fund code', () => {
    previousPaymentRequests[0].invoiceLines[0].fundCode = DRD05
    applyCSDualAccounting(paymentRequest, previousPaymentRequests)
    expect(paymentRequest.invoiceLines[0].fundCode).toBe(DRD05)
  })

  test('should change fund code to DRD01 if revenue and no previous domestic fund code', () => {
    applyCSDualAccounting(paymentRequest, previousPaymentRequests)
    expect(paymentRequest.invoiceLines[0].fundCode).toBe(DRD01)
  })
})
