const { getSchemeIds } = require('ffc-pay-schemes')
const { AP, AR } = require('../../../../../app/constants/ledgers')
const { ADMINISTRATIVE, IRREGULAR } = require('../../../../../app/constants/debt-types')
const { SOS710 } = require('../../../../../app/constants/account-codes/ap')
const { SOS750 } = require('../../../../../app/constants/account-codes/ar-admin')
const { SOS770 } = require('../../../../../app/constants/account-codes/ar-irregular')

const { mapAccountCodes } = require('../../../../../app/processing/account-codes/map-account-codes')

const { SFI, MANUAL } = getSchemeIds()

const accountCodeAP = SOS710
const accountCodeARAdm = SOS750
const accountCodeARIrr = SOS770

let paymentRequest

describe('map account codes', () => {
  beforeEach(() => {
    paymentRequest = {
      schemeId: SFI,
      ledger: AP,
      invoiceLines: [{
        description: 'G00 - Gross value of claim'
      }]
    }
  })

  test('should map AP code for AP payment request', () => {
    mapAccountCodes(paymentRequest)
    expect(paymentRequest.invoiceLines[0].accountCode).toBe(accountCodeAP)
  })

  test('should map AR code for AR payment request with administrative debt', () => {
    paymentRequest.schemeId = SFI
    paymentRequest.ledger = AR
    paymentRequest.debtType = ADMINISTRATIVE
    mapAccountCodes(paymentRequest)
    expect(paymentRequest.invoiceLines[0].accountCode).toBe(accountCodeARAdm)
  })

  test('should map AR code for AR payment request with irregular debt', () => {
    paymentRequest.schemeId = SFI
    paymentRequest.ledger = AR
    paymentRequest.debtType = IRREGULAR
    mapAccountCodes(paymentRequest)
    expect(paymentRequest.invoiceLines[0].accountCode).toBe(accountCodeARIrr)
  })

  test('should not map account code for Manual Invoice payment request', () => {
    paymentRequest.schemeId = MANUAL
    paymentRequest.invoiceLines[0].accountCode = 'ExistingCode'
    mapAccountCodes(paymentRequest)
    expect(paymentRequest.invoiceLines[0].accountCode).toBe('ExistingCode')
  })
})
