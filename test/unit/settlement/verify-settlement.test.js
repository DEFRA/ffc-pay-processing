const { checkInvoiceNumberBlocked } = require('../../../app/settlement/verify-settlement')

describe('verify invoice number', () => {
  test.each([
    ['matches blocked pattern', 'F0000001C0000001V001', true],
    ['does not match blocked pattern', 'S0000000C00000001V00B', false],
    ['is undefined', undefined, false],
    ['is empty string', '', false],
    ['is null', null, false]
  ])('should return %s', (_, invoiceNumber, expected) => {
    expect(checkInvoiceNumberBlocked(invoiceNumber)).toBe(expected)
  })
})
