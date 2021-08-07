const db = require('../../../../app/data')
const { savePaymentRequest } = require('../../../../app/inbound')
let scheme
let sourceSystem
let schemeCode
let fundCode
let deliveryBody
let paymentRequest

describe('save payment requests', () => {
  beforeEach(async () => {
    await db.sequelize.truncate({ cascade: true })

    scheme = {
      schemeId: 1,
      name: 'SFI',
      active: true
    }

    deliveryBody = {
      schemeId: 1,
      deliveryBody: 'SFI'
    }

    paymentRequest = {
      sourceSystem: 'SFIP',
      deliveryBody: 'RP00',
      invoiceNumber: 'SFI00000001',
      frn: 1234567890,
      sbi: 123456789,
      paymentRequestNumber: 1,
      agreementNumber: 'SIP00000000000001',
      contractNumber: 'SFIP000001',
      marketingYear: 2022,
      currency: 'GBP',
      schedule: 'M12',
      dueDate: '2021-08-15',
      value: 150.00,
      invoiceLines: [
        {
          standardCode: '80001',
          accountCode: 'SOS273',
          fundCode: 'DRD10',
          description: 'G00 - Gross value of claim',
          value: 250.00
        },
        {
          standardCode: '80001',
          accountCode: 'SOS273',
          fundCode: 'DRD10',
          description: 'P02 - Over declaration penalty',
          value: -100.00
        }
      ]
    }

    sourceSystem = {
      sourceSystemId: 1,
      schemeId: 1,
      name: 'SFIP'
    }

    schemeCode = {
      schemeCodeId: 1,
      standardCode: '80001',
      schemeCode: '80001'
    }

    fundCode = {
      schemeId: 1,
      fundCode: 'DRD10'
    }

    await db.scheme.create(scheme)
    await db.sourceSystem.create(sourceSystem)
    await db.schemeCode.create(schemeCode)
    await db.fundCode.create(fundCode)
    await db.deliveryBody.create(deliveryBody)
  })

  afterAll(async () => {
    await db.sequelize.truncate({ cascade: true })
    await db.sequelize.close()
  })

  test('should return payment request header data', async () => {
    await savePaymentRequest(paymentRequest)
    const paymentRequestRow = await db.paymentRequest.findAll({
      where: {
        agreementNumber: 'SIP00000000000001'
      }
    })
    expect(paymentRequestRow[0].invoiceNumber).toBe('S00000001SFIP000001V001')
    expect(paymentRequestRow[0].contractNumber).toBe('SFIP000001')
    expect(parseInt(paymentRequestRow[0].frn)).toBe(1234567890)
    expect(parseInt(paymentRequestRow[0].sbi)).toBe(123456789)
    expect(paymentRequestRow[0].currency).toBe('GBP')
    expect(paymentRequestRow[0].dueDate).toBe('2021-08-15')
    expect(parseFloat(paymentRequestRow[0].value)).toBe(15000)
  })

  test('should return invoice lines data', async () => {
    await savePaymentRequest(paymentRequest)

    const invoiceLinesRows = await db.invoiceLine.findAll({
      include: [{
        model: db.paymentRequest,
        as: 'paymentRequest',
        required: true
      }]
    })

    expect(invoiceLinesRows[0].standardCode).toBe('80001')
    expect(invoiceLinesRows[0].accountCode).toBe('SOS273')
    expect(invoiceLinesRows[0].fundCode).toBe('DRD10')
    expect(invoiceLinesRows[0].description).toBe('G00 - Gross value of claim')
    expect(parseFloat(invoiceLinesRows[0].value)).toBe(25000)

    expect(invoiceLinesRows[1].standardCode).toBe('80001')
    expect(invoiceLinesRows[1].accountCode).toBe('SOS273')
    expect(invoiceLinesRows[1].fundCode).toBe('DRD10')
    expect(invoiceLinesRows[1].description).toBe('P02 - Over declaration penalty')
    expect(parseFloat(invoiceLinesRows[1].value)).toBe(-10000)
  })

  test('should only insert the first payment request', async () => {
    await savePaymentRequest(paymentRequest)
    await savePaymentRequest(paymentRequest)

    const paymentRequestRow = await db.paymentRequest.findAll({
      where: {
        agreementNumber: 'SIP00000000000001'
      }
    })

    expect(paymentRequestRow.length).toBe(1)
  })

  test('should error for empty payment request', async () => {
    const paymentRequest = {}

    try {
      await savePaymentRequest(paymentRequest)
    } catch (error) {
      expect(error.message).toBeDefined()
    }
  })

  test('should error for payment request without invoice lines', async () => {
    delete paymentRequest.invoiceLines

    try {
      await savePaymentRequest(paymentRequest)
    } catch (error) {
      expect(error.message).toBeDefined()
    }
  })
})
