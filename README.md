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
      apiKey={import.meta.env.VITE_TON_PAYMENTS_API_KEY}
      connectorParams={{
        manifestUrl: 'https://your-app-url.com/tonconnect-manifest.json',
        uiPreferences: { theme: 'SYSTEM' },
        walletsListConfiguration: {
          includeWallets: ['tonkeeper', 'tonhub']
        }
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
        amount: parseFloat(amount),
        message: 'Test payment'
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
  apiKey: string;
  connectorParams: {
    manifestUrl: string;
    uiPreferences?: {
      theme: 'LIGHT' | 'DARK' | 'SYSTEM';
    };
    walletsListConfiguration?: {
      includeWallets?: string[];
    };
  };
  children: React.ReactNode;
}
```

### useTonPayments Hook

The `useTonPayments` hook provides the following methods:

- `connectWallet(): Promise<void>` - Initiates wallet connection
- `disconnect(): void` - Disconnects the current wallet
- `sendTransaction(params: TransactionParams): Promise<void>` - Sends a TON transaction
- `isConnected: boolean` - Current wallet connection status

```typescript
interface TransactionParams {
  to: string;
  amount: number;
  message?: string;
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
