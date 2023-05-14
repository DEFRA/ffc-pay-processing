jest.mock('../../../app/acknowledgement/acknowledge-payment-request')
const { acknowledgePaymentRequest: mockAcknowledgePaymentRequest } = require('../../../app/acknowledgement/acknowledge-payment-request')

jest.mock('../../../app/event')
const { sendAckEvent: mockSendAckEvent } = require('../../../app/event')

jest.mock('../../../app/acknowledgement/get-payment-request')
const { getPaymentRequest: mockGetPaymentRequest } = require('../../../app/acknowledgement/get-payment-request')

jest.mock('../../../app/acknowledgement/process-invalid')
const { processInvalid: mockProcessInvalid } = require('../../../app/acknowledgement/process-invalid')

const paymentRequest = require('../../mocks/payment-requests/payment-request')

const { processAcknowledgement } = require('../../../app/acknowledgement/process-acknowledgement')

let acknowledgement

describe('process acknowledgement', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    acknowledgement = JSON.parse(JSON.stringify(require('../../mocks/acknowledgement')))
    mockGetPaymentRequest.mockResolvedValue(paymentRequest)
  })

  test('should acknowledge payment request', async () => {
    await processAcknowledgement(acknowledgement)
    expect(mockAcknowledgePaymentRequest).toHaveBeenCalledWith(acknowledgement.invoiceNumber, acknowledgement.acknowledged)
  })

  test('should send acknowledgement success event if successfully acknowledged', async () => {
    await processAcknowledgement(acknowledgement)
    expect(mockSendAckEvent).toHaveBeenCalledWith(acknowledgement)
  })

  test('should not send acknowledgement success event if not successfully acknowledged', async () => {
    acknowledgement.success = false
    await processAcknowledgement(acknowledgement)
    expect(mockSendAckEvent).not.toHaveBeenCalled()
  })

  test('should get associated payment request by invoice number if not successfully acknowledged', async () => {
    acknowledgement.success = false
    await processAcknowledgement(acknowledgement)
    expect(mockGetPaymentRequest).toHaveBeenCalledWith(acknowledgement.invoiceNumber)
  })

  test('should not get associated payment request by invoice number if successfully acknowledged', async () => {
    await processAcknowledgement(acknowledgement)
    expect(mockGetPaymentRequest).not.toHaveBeenCalled()
  })

  test('should process invalid acknowledgement if not successfully acknowledged', async () => {
    acknowledgement.success = false
    await processAcknowledgement(acknowledgement)
    expect(mockProcessInvalid).toHaveBeenCalledWith(paymentRequest.schemeId, paymentRequest.paymentRequestId, paymentRequest.frn, acknowledgement)
  })

  test('should not process invalid acknowledgement if successfully acknowledged', async () => {
    await processAcknowledgement(acknowledgement)
    expect(mockProcessInvalid).not.toHaveBeenCalled()
  })
})
