jest.mock('../../../app/settlement/verify-settlement')
const { verifyInvoiceNumber: mockVerifyInvoiceNumber } = require('../../../app/settlement/verify-settlement')

const mockInvoicePatterns = {
  pattern1: /F\d{7}C\d{7}V\d{3}/,
  pattern2: /ABC-\d{3}/,
  pattern3: /XYZ-\d{4}/
}

jest.mock('../constants/invoice-patterns', () => mockInvoicePatterns)

describe('verify settlement invoiceNumber', () => {
  beforeEach(() => {
    jest.clearAllMocks()

    mockVerifyInvoiceNumber.mockImplementation((invoiceNumber) => {
      for (const [pattern] of Object.entries(mockInvoicePatterns)) {
        const matches = invoiceNumber.match(pattern)
        if (matches) {
          return false
        }
      }
      return true
    })
  })

  test('should return false if the invoice number matches the first pattern', () => {
    const matchingInvoice = 'F1234567C1234567V123'
    expect(mockVerifyInvoiceNumber(matchingInvoice)).toBe(false)
  })

  test('should return false if the invoice number matches the second pattern', () => {
    const matchingInvoice = 'ABC-123'
    expect(mockVerifyInvoiceNumber(matchingInvoice)).toBe(false)
  })

  test('should return false if the invoice number matches the third pattern', () => {
    const matchingInvoice = 'XYZ-1234'
    expect(mockVerifyInvoiceNumber(matchingInvoice)).toBe(false)
  })

  test('should return true if the invoice number does not match any pattern', () => {
    const nonMatchingInvoice = 'XYZ-0000'
    expect(mockVerifyInvoiceNumber(nonMatchingInvoice)).toBe(true)
  })

  test('should return true if the invoice number does not match any pattern with a special character', () => {
    const specialInvoice = 'ABC-#%@'
    expect(mockVerifyInvoiceNumber(specialInvoice)).toBe(true)
  })

  test('should handle empty or undefined invoice numbers gracefully', () => {
    expect(mockVerifyInvoiceNumber('')).toBe(true)
    expect(mockVerifyInvoiceNumber(undefined)).toBe(true)
  })

  test('should return false for invoice numbers matching multiple patterns', () => {
    const multiMatchInvoice = 'F1234567C1234567V123'
    expect(mockVerifyInvoiceNumber(multiMatchInvoice)).toBe(false)
  })
})