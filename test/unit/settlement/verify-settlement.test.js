const { checkInvoiceNumberBlocked } = require('../../../app/settlement/verify-settlement')

describe('check invoice number blocked', () => {
  test.each([
    'F0437125C1005501V001',
    'F0000001C0000001V001'
  ])('should block FDMR invoice %s', (invoiceNumber) => {
    expect(checkInvoiceNumberBlocked(invoiceNumber)).toBe(true)
  })

  test.each([
    'S0437125C1005501V001',
    'F0437125C1005501V001X',
    'F0437125C1005501',
    'f0437125C1005501V001',
    '123456789'
  ])('should not block non-FDMR invoice %s', (invoiceNumber) => {
    expect(checkInvoiceNumberBlocked(invoiceNumber)).toBe(false)
  })
})
