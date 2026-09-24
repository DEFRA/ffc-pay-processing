const { AP, AR } = require('../../../../app/constants/ledgers')
const { ADMINISTRATIVE, IRREGULAR } = require('../../../../app/constants/debt-types')

const { selectLineCode } = require('../../../../app/processing/account-codes/select-line-code')

const accountCodes = {
  ap: 'ap',
  arAdmin: 'ar-admin',
  arIrregular: 'ar-irregular'
}

let ledger
let debtType
let stateAid
let currentAccountCode
let paymentRequest
let invoiceLine

describe('select line code', () => {
  beforeEach(() => {
    ledger = AP
    debtType = undefined
    stateAid = false
    currentAccountCode = 'existing'
    paymentRequest = {
      ledger,
      debtType
    }
    invoiceLine = {
      stateAid,
      accountCode: currentAccountCode
    }
  })

  test('should return AP code if ledger is AP', () => {
    const result = selectLineCode(accountCodes, paymentRequest, invoiceLine)
    expect(result).toBe(accountCodes.ap)
  })

  test('should return current AP code if ledger is AP and is state aid', () => {
    invoiceLine.stateAid = true
    const result = selectLineCode(accountCodes, paymentRequest, invoiceLine)
    expect(result).toBe(currentAccountCode)
  })

  test('should return AR admin code if ledger is AR and debt type is administrative', () => {
    paymentRequest.ledger = AR
    paymentRequest.debtType = ADMINISTRATIVE
    const result = selectLineCode(accountCodes, paymentRequest, invoiceLine)
    expect(result).toBe(accountCodes.arAdmin)
  })

  test('should return AR irregular code if ledger is AR and debt type is irregular', () => {
    paymentRequest.ledger = AR
    paymentRequest.debtType = IRREGULAR
    const result = selectLineCode(accountCodes, paymentRequest, invoiceLine)
    expect(result).toBe(accountCodes.arIrregular)
  })
})
