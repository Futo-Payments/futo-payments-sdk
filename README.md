# TON Payments

A React library for handling TON blockchain payments with ease.

## Installation

```bash
npm install https://github.com/Futo-Payments/futo-payments-sdk.git
```

## Setup

### 1. Add TonConnect Manifest

Create a `public/tonconnect-manifest.json` file in your project:

```json
{
  "url": "https://your-app-url.com",
  "name": "Your App Name",
  "iconUrl": "https://your-app-url.com/icon.png"
}
```

⚠️ **Important**: The TonConnect manifest is required for wallet connections to work. Make sure it's accessible via your app's public URL.

### 2. Environment Variables

Create a `.env` file:

```env
VITE_TON_PAYMENTS_API_KEY=your_api_key_here
```

## Usage

### Provider Setup

Wrap your application with `TonPaymentsProvider`:

```tsx
import { TonPaymentsProvider } from 'ton-payments';

function App() {
  return (
    <TonPaymentsProvider
        config={{
            apiKey: import.meta.env.VITE_TON_PAYMENTS_API_KEY,
            apiURL: import.meta.env.VITE_TON_PAYMENTS_API_URL
        }}
        connectorParams={{
            manifestUrl: 'http://localhost:3000/tonconnect-manifest.json',
        }}
    >
      <YourApp />
    </TonPaymentsProvider>
  );
}
```

### Payment Component Example

Here's a complete example of a payment component:

```tsx
import { useState } from 'react';
import { useTonPayments } from 'ton-payments';

function PaymentComponent() {
  const [amount, setAmount] = useState('1.0');
  const [recipientAddress, setRecipientAddress] = useState('');
  const { connectWallet, sendTransaction, isConnected, disconnect } = useTonPayments();

  const handleSendPayment = async () => {
    try {
      await sendTransaction({
          to: recipientAddress,
          amount: parseFloat(amount)
      });
      alert('Payment sent successfully!');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      alert(`Payment failed: ${errorMessage}`);
    }
  };

  return (
    <div>
      <h2>TON Payments Demo</h2>

      {/* Wallet Connection */}
      <div>
        {!isConnected ? (
          <button onClick={connectWallet}>Connect Wallet</button>
        ) : (
          <button onClick={disconnect}>Disconnect Wallet</button>
        )}
      </div>

      {/* Payment Form */}
      <div>
        <input
          type="text"
          value={recipientAddress}
          onChange={(e) => setRecipientAddress(e.target.value)}
          placeholder="Recipient Address"
        />
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="Amount in TON"
          step="0.1"
          min="0"
        />
        <button
          onClick={handleSendPayment}
          disabled={!isConnected || !recipientAddress}
        >
          Send Payment
        </button>
      </div>
    </div>
  );
}
```

## API Reference

### TonPaymentsProvider Props

```typescript
interface TonPaymentsProviderProps {
    /** Configuration object containing API credentials */
    config: {
        apiKey: string;
        apiURL: string;
    };
    /** React children components */
    children: ReactNode;
    /** Optional connector parameters for customizing wallet connection */
    connectorParams?: {
        manifestUrl?: string;
        uiPreferences?: TonConnectUiOptions['uiPreferences'];
        walletsListConfiguration?: {
            includeWallets?: UIWallet[];
            excludeWallets?: UIWallet[];
        };
    };
}
```

### useTonPayments Hook

The `useTonPayments` hook provides the following methods:

- `connectWallet(): Promise<void>` - Initiates wallet connection
- `disconnect(): void` - Disconnects the current wallet
- `sendTransaction(params: TransactionParams): Promise<void>` - Sends a TON transaction
- `isConnected: boolean` - Current wallet connection status

```typescript
interface PaymentRequest {
    /** Amount in TON */
    amount: string;
    /** Optional payment ID */
    payment_id?: string;
    /** Optional expiration time in seconds */
    expiresIn?: number;
}
```

### Return types

```typescript
interface PaymentResponse {
    /** HTTP status code */
    status: number;
    /** Response message */
    message: string;
    /** Response payload */
    payload: {
        /** Amount in USD */
        amount_in_usd: string;
        /** Amounts in different cryptocurrencies */
        amount_in_crypto: {
            ton: string | null;
            btc: string | null;
            eth: string | null;
            bnb: string | null;
        };
        /** Merchant name */
        merchant: string;
        /** Chain ID */
        chain_id: number;
        /** Payment status */
        current_status: PaymentStatus;
        /** Expiration timestamp */
        expires: string;
    }
}

export enum PaymentStatus {
    CREATED = 'CREATED',
    PENDING = 'PENDING',
    COMPLETED = 'COMPLETED',
    EXPIRED = 'EXPIRED',
    FAILED = 'FAILED'
} 
```

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
