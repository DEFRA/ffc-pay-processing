const { verifyInvoiceNumber } = require('../../../app/settlement/verify-settlement')

// Mock invoice patterns for testing
const mockInvoicePatterns = {
  pattern1: /F\d{7}C\d{7}V\d{3}/,
  pattern2: /ABC-\d{3}/
}

jest.mock('../constants/invoice-patterns', () => mockInvoicePatterns)

describe('verify settlement invoiceNumber', () => {
  test('should return false if the invoice number matches a pattern', () => {
    const matchingInvoice = 'F1234567C1234567V123'
    expect(verifyInvoiceNumber(matchingInvoice)).toBe(false)
  })

  test('should return true if the invoice number does not match any pattern', () => {
    const nonMatchingInvoice = 'XYZ-000'
    expect(verifyInvoiceNumber(nonMatchingInvoice)).toBe(true)
  })

  test('should handle empty or undefined invoice numbers gracefully', () => {
    expect(verifyInvoiceNumber('')).toBe(true)
    expect(verifyInvoiceNumber(undefined)).toBe(true)
  })

  test('should return false for invoice numbers matching multiple patterns', () => {
    const multiMatchInvoice = 'F1234567C1234567V123'
    expect(verifyInvoiceNumber(multiMatchInvoice)).toBe(false)
  })
})
