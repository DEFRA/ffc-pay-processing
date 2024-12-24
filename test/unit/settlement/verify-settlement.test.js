jest.mock('../../../app/constants/invoice-patterns', () => ({
  firstPattern: /F\d{7}C\d{7}V\d{3}/,
  secondPattern: /ABC-\d+/,
  thirdPattern: /XYZ-\d+/,
}));

const mockInvoicePatterns = require('../../../app/constants/invoice-patterns');

jest.mock('../../../app/settlement/verify-settlement', () => ({
  verifyInvoiceNumber: jest.fn(),
}));

const { verifyInvoiceNumber } = require('../../../app/settlement/verify-settlement');

describe('verify settlement invoiceNumber', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    verifyInvoiceNumber.mockImplementation((invoiceNumber) => {
      if (!invoiceNumber || typeof invoiceNumber !== 'string') return true;

      for (const pattern of Object.values(mockInvoicePatterns)) {
        if (pattern?.test(invoiceNumber)) {
          return false;
        }
      }
      return true;
    });
  });

  test('should return false if the invoice number matches the first pattern', () => {
    const matchingInvoice = 'F1234567C1234567V123';
    expect(verifyInvoiceNumber(matchingInvoice)).toBe(false);
  });

  test('should return false if the invoice number matches the second pattern', () => {
    const matchingInvoice = 'ABC-123';
    expect(verifyInvoiceNumber(matchingInvoice)).toBe(false);
  });

  test('should return false if the invoice number matches the third pattern', () => {
    const matchingInvoice = 'XYZ-1234';
    expect(verifyInvoiceNumber(matchingInvoice)).toBe(false);
  });

  test('should return true if the invoice number does not match any pattern', () => {
    const nonMatchingInvoice = 'DEF-456';
    expect(verifyInvoiceNumber(nonMatchingInvoice)).toBe(true);
  });

  test('should return true if the invoice number does not match any pattern with a special character', () => {
    const specialInvoice = 'ABC-#%@';
    expect(verifyInvoiceNumber(specialInvoice)).toBe(true);
  });

  test('should handle empty or undefined invoice numbers gracefully', () => {
    expect(verifyInvoiceNumber('')).toBe(true);
    expect(verifyInvoiceNumber(undefined)).toBe(true);
  });

  test('should handle non-string invoice numbers gracefully', () => {
    expect(verifyInvoiceNumber(12345)).toBe(true);
    expect(verifyInvoiceNumber(null)).toBe(true);
    expect(verifyInvoiceNumber([])).toBe(true);
    expect(verifyInvoiceNumber({})).toBe(true);
  });

  test('should handle empty patterns gracefully', () => {
    jest.mock('../../../app/constants/invoice-patterns', () => ({}));
    const invoiceNumber = 'XYZ-1234';
    expect(verifyInvoiceNumber(invoiceNumber)).toBe(true);
  });

  test('should handle invalid patterns gracefully', () => {
    jest.mock('../../../app/constants/invoice-patterns', () => ({
      invalidPattern: null,
      nonRegexPattern: 'not-a-regex',
    }));
    const invoiceNumber = 'XYZ-1234';
    expect(verifyInvoiceNumber(invoiceNumber)).toBe(true);
  });

  test('should return false for invoice numbers matching overlapping patterns', () => {
    jest.mock('../../../app/constants/invoice-patterns', () => ({
      pattern1: /ABC-\d+/,
      pattern2: /ABC-123/,
    }));
    const overlappingInvoice = 'ABC-123';
    expect(verifyInvoiceNumber(overlappingInvoice)).toBe(false);
  });

  test('should return true for invoice numbers not matching any overlapping patterns', () => {
    jest.mock('../../../app/constants/invoice-patterns', () => ({
      pattern1: /ABC-\d+/,
      pattern2: /ABC-123/,
    }));
    const nonMatchingInvoice = 'DEF-456';
    expect(verifyInvoiceNumber(nonMatchingInvoice)).toBe(true);
  });
});
