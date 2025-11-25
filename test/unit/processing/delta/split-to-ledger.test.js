const { AP, AR } = require('../../../../app/constants/ledgers')
const { splitToLedger } = require('../../../../app/processing/delta/assign-ledger/split-to-ledger')
const { v4: uuidv4 } = require('uuid')
const { SFI, SFI_PILOT, LUMP_SUMS, VET_VISITS, LNR } = require('../../../../app/constants/schemes')

describe('split to ledger', () => {
  const baseInvoice = {
    [SFI]: 'S1234567SFI123456V002',
    [SFI_PILOT]: 'S1234567SFI123456V002',
    [LUMP_SUMS]: 'S1234567SFI123456V002',
    [VET_VISITS]: 'AHWR1234567890V002',
    [LNR]: 'LNR1234567890V002'
  }

  const createPaymentRequest = (overrides = {}) => ({
    ledger: AP,
    value: 100,
    agreementNumber: '12345678',
    paymentRequestNumber: 2,
    invoiceNumber: baseInvoice[SFI],
    invoiceLines: [
      { description: 'G00', value: 50 },
      { description: 'G00', value: 50 }
    ],
    ...overrides
  })

  test('splits AP across ledgers if settlement less than current value', () => {
    const pr = createPaymentRequest({ ledger: AP, value: 100 })
    const updated = splitToLedger(pr, 10, AR)
    expect(updated.length).toBe(2)
    expect(updated.find(x => x.ledger === AP).value).toBe(90)
    expect(updated.find(x => x.ledger === AR).value).toBe(10)
  })

  test('splits AR across ledgers if settlement less than current value', () => {
    const pr = createPaymentRequest({ ledger: AR, value: -100, invoiceNumber: baseInvoice[SFI] })
    const updated = splitToLedger(pr, 10, AP)
    expect(updated.length).toBe(2)
    expect(updated.find(x => x.ledger === AP).value).toBe(-10)
    expect(updated.find(x => x.ledger === AR).value).toBe(-90)
  })

  test.each([
    [SFI],
    [SFI_PILOT],
    [LUMP_SUMS],
    [VET_VISITS],
    [LNR]
  ])('updates invoice numbers for scheme %s', (schemeId) => {
    const pr = createPaymentRequest({ schemeId, invoiceNumber: baseInvoice[schemeId] })
    const updated = splitToLedger(pr, 10, AR)
    expect(updated.length).toBe(2)

    const first = updated[0]
    const second = updated[1]

    expect(first.invoiceNumber).toMatch(/A/)
    expect(second.invoiceNumber).toMatch(/B/)
  })

  test('creates new referenceId for split request', () => {
    const refId = uuidv4()
    const pr = createPaymentRequest({ schemeId: SFI, referenceId: refId })
    const updated = splitToLedger(pr, 10, AR)

    const first = updated.find(x => x.invoiceNumber.includes('A'))
    const second = updated.find(x => x.invoiceNumber.includes('B'))

    expect(first.referenceId).toBe(refId)
    expect(second.referenceId).not.toBe(refId)
    expect(second.referenceId).toMatch(
      /\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/
    )
  })
})
