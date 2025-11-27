const { AP } = require('../../../../app/constants/ledgers')
const { zeroValueSplit } = require('../../../../app/processing/delta/zero-value-split/zero-value-split')
const { v4: uuidv4 } = require('uuid')
const { createPaymentRequest } = require('../../../helpers/create-payment-request')

describe('zeroValueSplit', () => {
  let paymentRequest

  beforeEach(() => {
    paymentRequest = createPaymentRequest({
      value: 0,
      schemeId: 1,
      invoiceLines: [
        { description: 'G00', value: -50 },
        { description: 'G00', value: 50 }
      ]
    })
  })

  test('creates two AP requests', () => {
    const updated = zeroValueSplit(paymentRequest)
    expect(updated.length).toBe(2)
    expect(updated.filter(x => x.ledger === AP).length).toBe(2)
    expect(updated.filter(x => x.ledger !== AP).length).toBe(0)
  })

  test('moves all positive lines to AP', () => {
    const updated = zeroValueSplit(paymentRequest)
    expect(updated.find(x => x.ledger === AP && x.invoiceLines.some(l => l.value === 50))).toBeDefined()
  })

  test('moves all negative lines to AP', () => {
    const updated = zeroValueSplit(paymentRequest)
    expect(updated.find(x => x.ledger === AP && x.invoiceLines.some(l => l.value === -50))).toBeDefined()
  })

  test('calculates positive AP value', () => {
    const updated = zeroValueSplit(paymentRequest)
    expect(updated.find(x => x.ledger === AP && x.value === 50)).toBeDefined()
  })

  test('calculates negative AP value', () => {
    const updated = zeroValueSplit(paymentRequest)
    expect(updated.find(x => x.ledger === AP && x.value === -50)).toBeDefined()
  })

  test('updates original invoice number', () => {
    const updated = zeroValueSplit(paymentRequest)
    expect(updated.find(x => x.originalInvoiceNumber === paymentRequest.invoiceNumber)).toBeDefined()
  })

  test('updates invoice number', () => {
    const updated = zeroValueSplit(paymentRequest)
    expect(updated.find(x => /A.*V02$/.test(x.invoiceNumber))).toBeDefined()
    expect(updated.find(x => /B.*V02$/.test(x.invoiceNumber))).toBeDefined()
  })

  test('creates new referenceId for both requests', () => {
    const pr = createPaymentRequest({
      value: 0,
      schemeId: 1,
      referenceId: uuidv4(),
      invoiceLines: [
        { description: 'G00', value: -50 },
        { description: 'G00', value: 50 }
      ]
    })
    const updated = zeroValueSplit(pr)
    const a = updated.find(x => /A.*V02$/.test(x.invoiceNumber))
    const b = updated.find(x => /B.*V02$/.test(x.invoiceNumber))

    expect(a).toBeDefined()
    expect(b).toBeDefined()
    expect(a.referenceId).not.toBe(pr.referenceId)
    expect(b.referenceId).not.toBe(pr.referenceId)
    expect(a.referenceId).toMatch(/\b[0-9a-f]{8}\b-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-\b[0-9a-f]{12}\b/)
    expect(b.referenceId).toMatch(/\b[0-9a-f]{8}\b-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-\b[0-9a-f]{12}\b/)
  })
})
