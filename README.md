# Futo Payments Client

A TypeScript client library for integrating with Futo Payments service.

## Installation

```bash
npm install futo-payments-client
```

## Usage

```typescript
import { PaymentClient, Address } from 'futo-payments-client';

// Initialize the client
const client = new PaymentClient({
  apiEndpoint: 'https://api.payments.example.com',
  merchantAddress: Address.parse('EQD4FPq-PRDysCQR0UYgwNq5CJePPpxX2c2O6-NSg_none')
});

// Create a payment request
const payment = await client.createPayment({
  amount: '1.5', // Amount in TON
  comment: 'Payment for service'
});

// Get payment status
const status = await client.getPayment(payment.paymentId);

// Wait for payment completion
const result = await client.waitForPayment(payment.paymentId);
```

## API Reference

### PaymentClient

#### Constructor

```typescript
constructor(config: PaymentConfig)
```

Configuration options:
- `apiEndpoint`: API endpoint for the payment service
- `merchantAddress`: (optional) Default merchant address
- `timeout`: (optional) API request timeout in milliseconds

#### Methods

##### createPayment

```typescript
createPayment(request: PaymentRequest): Promise<PaymentResponse>
```

Create a new payment request.

Parameters:
- `amount`: Amount in TON
- `merchantAddress`: (optional) Merchant's TON address
- `comment`: (optional) Payment comment
- `callbackUrl`: (optional) Callback URL after successful payment
- `expiresIn`: (optional) Expiration time in seconds

##### getPayment

```typescript
getPayment(paymentId: string): Promise<PaymentResponse>
```

Get payment status by ID.

##### waitForPayment

```typescript
waitForPayment(paymentId: string, timeoutMs?: number): Promise<PaymentResponse>
```

Wait for payment to complete or expire.

## Development

```bash
# Install dependencies
npm install

# Build
npm run build

# Run tests
npm test
```

## License

MIT 