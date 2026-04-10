const { sanitizeInvoiceLine } = require('../../../app/helpers/sanitize-invoice-line')

describe('sanitizeInvoiceLine', () => {
  test('should replace euro symbol with EUR', () => {
    const invoiceLine = { description: 'Price: 100€' }
    sanitizeInvoiceLine(invoiceLine)
    expect(invoiceLine.description).toBe('Price: 100EUR')
  })

  test('should replace garbled UTF-8 euro encoding with EUR', () => {
    const invoiceLine = { description: 'Price: 100â‚¬' }
    sanitizeInvoiceLine(invoiceLine)
    expect(invoiceLine.description).toBe('Price: 100EUR')
  })

  test('should replace multiple euro symbols', () => {
    const invoiceLine = { description: '€100 or €200€' }
    sanitizeInvoiceLine(invoiceLine)
    expect(invoiceLine.description).toBe('EUR100 or EUR200EUR')
  })

  test('should replace multiple garbled encodings', () => {
    const invoiceLine = { description: 'â‚¬100 or â‚¬200' }
    sanitizeInvoiceLine(invoiceLine)
    expect(invoiceLine.description).toBe('EUR100 or EUR200')
  })

  test('should replace both euro and garbled encodings in same string', () => {
    const invoiceLine = { description: 'Price €100 or â‚¬200' }
    sanitizeInvoiceLine(invoiceLine)
    expect(invoiceLine.description).toBe('Price EUR100 or EUR200')
  })

  test('should not modify description without symbols', () => {
    const invoiceLine = { description: 'Price: 100 dollars' }
    sanitizeInvoiceLine(invoiceLine)
    expect(invoiceLine.description).toBe('Price: 100 dollars')
  })

  test('should handle empty description', () => {
    const invoiceLine = { description: '' }
    sanitizeInvoiceLine(invoiceLine)
    expect(invoiceLine.description).toBe('')
  })

  test('should handle missing description property', () => {
    const invoiceLine = { name: 'item' }
    sanitizeInvoiceLine(invoiceLine)
    expect(invoiceLine.description).toBeUndefined()
  })

  test('should handle null invoiceLine', () => {
    expect(() => sanitizeInvoiceLine(null)).not.toThrow()
  })

  test('should handle undefined invoiceLine', () => {
    expect(() => sanitizeInvoiceLine(undefined)).not.toThrow()
  })

  test('should preserve other content in description', () => {
    const invoiceLine = { description: 'Item: Widget, Cost: €50.99, Qty: 5' }
    sanitizeInvoiceLine(invoiceLine)
    expect(invoiceLine.description).toBe('Item: Widget, Cost: EUR50.99, Qty: 5')
  })
})
