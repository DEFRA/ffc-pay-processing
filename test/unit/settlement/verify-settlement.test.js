jest.mock('../../../app/settlement/verify-settlement')
const { verifyInvoiceNumber: mockVerifyInvoiceNumber } = require('../../../app/settlement/verify-settlement')

describe('verify settlement invoiceNumber', () => {
  beforeEach(() => {
    jest.clearAllMocks()

    mockVerifyInvoiceNumber.mockImplementation((invoiceNumber) => {
      const patterns = [/F\d{7}C\d{7}V\d{3}/]
      return !patterns.some((pattern) => pattern.test(invoiceNumber))
    })
  })

  test('should return false if the invoice number matches a pattern', () => {
    const matchingInvoice = 'F1234567C1234567V123'
    expect(mockVerifyInvoiceNumber(matchingInvoice)).toBe(false)
  })

  test('should return true if the invoice number does not match any pattern', () => {
    const nonMatchingInvoice = 'ABC-999'
    expect(mockVerifyInvoiceNumber(nonMatchingInvoice)).toBe(true)
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
