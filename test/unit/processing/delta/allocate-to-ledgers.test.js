const { AP, AR } = require('../../../../app/constants/ledgers')
const { allocateToLedgers } = require('../../../../app/processing/delta/assign-ledger/allocate-to-ledgers')

describe('allocate to ledgers', () => {
  test.each([
    ['reallocate AP to AR if outstanding > request value', { ledger: AP, value: 10 }, { AR: 100, AP: 0 }, AR, 10],
    ['reallocate AR to AP if outstanding > request recovery', { ledger: AR, value: -10 }, { AR: 0, AP: 100 }, AP, -10]
  ])('%s', (_, paymentRequest, outstandingLedgerValues, expectedLedger, expectedValue) => {
    const updated = allocateToLedgers(paymentRequest, outstandingLedgerValues)
    expect(updated[0].ledger).toBe(expectedLedger)
    expect(updated[0].value).toBe(expectedValue)
  })

  test('should split AP across ledgers if outstanding less than value', () => {
    const paymentRequest = {
      ledger: AP,
      value: 100,
      agreementNumber: '12345678',
      invoiceNumber: 'S12345678SFI123456V002',
      paymentRequestNumber: 2,
      invoiceLines: [{ description: 'G00', value: 50 }, { description: 'G00', value: 50 }]
    }
    const outstandingLedgerValues = { AR: 10, AP: 0 }
    const updated = allocateToLedgers(paymentRequest, outstandingLedgerValues)
    expect(updated.length).toBe(2)
    expect(updated.find(x => x.ledger === AP).value).toBe(90)
    expect(updated.find(x => x.ledger === AR).value).toBe(10)
  })

  test('should split AR across ledgers if outstanding less than value', () => {
    const paymentRequest = {
      ledger: AR,
      value: -100,
      agreementNumber: '12345678',
      invoiceNumber: 'S12345678SFI123456V002',
      paymentRequestNumber: 2,
      invoiceLines: [{ description: 'G00', value: -50 }, { description: 'G00', value: -50 }]
    }
    const outstandingLedgerValues = { AR: 0, AP: 10 }
    const updated = allocateToLedgers(paymentRequest, outstandingLedgerValues)
    expect(updated.length).toBe(2)
    expect(updated.find(x => x.ledger === AP).value).toBe(-10)
    expect(updated.find(x => x.ledger === AR).value).toBe(-90)
  })

  test('should split AP across ledgers for single invoice line', () => {
    const paymentRequest = {
      ledger: AP,
      value: 100,
      agreementNumber: '12345678',
      invoiceNumber: 'S12345678SFI123456V002',
      paymentRequestNumber: 2,
      invoiceLines: [{ description: 'G00', value: 100 }]
    }
    const outstandingLedgerValues = { AR: 10, AP: 0 }
    const updated = allocateToLedgers(paymentRequest, outstandingLedgerValues)
    expect(updated.length).toBe(2)
    expect(updated.find(x => x.ledger === AP).value).toBe(90)
    expect(updated.find(x => x.ledger === AR).value).toBe(10)
  })
})
