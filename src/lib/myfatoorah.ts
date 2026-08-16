type MyFatoorahResponse<T> = {
  IsSuccess: boolean | string
  Message?: string
  ValidationErrors?: unknown
  Data?: T
}

// v2 SendPayment response
type SendPaymentData = {
  InvoiceId?: string | number
  InvoiceURL?: string
}

// v2 GetPaymentStatus response
export type PaymentDetails = {
  InvoiceId?: string | number
  InvoiceStatus?: string   // "Paid" | "Unpaid" | "Expired" | "Failed"
  UserDefinedField?: string | null
  CustomerReference?: string | null
  InvoiceTransactions?: Array<{
    TransactionStatus?: string  // "Succss" | "Failed"
    PaymentId?: string
    Error?: string | null
    PaidCurrency?: string
    PaidCurrencyValue?: string | number
  }>
}

function getConfig() {
  const apiKey = process.env.MYFATOORAH_API_KEY
  if (!apiKey) throw new Error('MyFatoorah is not configured')
  return {
    apiKey,
    baseUrl: (process.env.MYFATOORAH_API_URL ?? 'https://apitest.myfatoorah.com').replace(/\/$/, ''),
  }
}

async function requestMyFatoorah<T>(path: string, init: RequestInit): Promise<T> {
  const { apiKey, baseUrl } = getConfig()
  const response = await fetch(`${baseUrl}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      ...init.headers,
    },
    signal: AbortSignal.timeout(30_000),
    cache: 'no-store',
  })
  const body = await response.json().catch(() => null) as MyFatoorahResponse<T> | null

  if (!response.ok || !body || body.IsSuccess === false || body.IsSuccess === 'false') {
    console.error('MYFATOORAH_API_ERROR', {
      path,
      httpStatus: response.status,
      isSuccess: body?.IsSuccess,
      message: body?.Message,
      validationErrors: body && 'ValidationErrors' in body ? body.ValidationErrors : undefined,
    })
    throw new Error(body?.Message || `MyFatoorah request failed (${response.status})`)
  }

  return body.Data as T
}

export async function createHostedPayment(input: {
  amount: number
  orderId: string
  orderNumber: string
  customerName: string
  customerEmail: string
  language: 'ar' | 'en'
  redirectUrl: string
  webhookUrl?: string
}) {
  const data = await requestMyFatoorah<SendPaymentData>('/v2/SendPayment', {
    method: 'POST',
    body: JSON.stringify({
      NotificationOption: 'LNK',
      CustomerName: input.customerName || 'Customer',
      DisplayCurrencyIso: 'QAR',
      MobileCountryCode: '+974',
      CustomerMobile: '',
      CustomerEmail: input.customerEmail,
      InvoiceValue: Number(input.amount.toFixed(2)),
      CallBackUrl: input.redirectUrl,
      ErrorUrl: input.redirectUrl,
      Language: input.language === 'ar' ? 'AR' : 'EN',
      CustomerReference: input.orderNumber,
      UserDefinedField: input.orderId,
    }),
  })

  if (!data?.InvoiceURL || !data?.InvoiceId) {
    throw new Error('MyFatoorah did not return a payment URL')
  }

  return {
    InvoiceId: String(data.InvoiceId),
    PaymentURL: data.InvoiceURL,
  }
}

export async function getPaymentDetails(paymentId: string): Promise<PaymentDetails> {
  return requestMyFatoorah<PaymentDetails>('/v2/GetPaymentStatus', {
    method: 'POST',
    body: JSON.stringify({ Key: paymentId, KeyType: 'PaymentId' }),
  })
}
