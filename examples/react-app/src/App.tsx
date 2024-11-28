import { useState } from 'react';
import { TonPaymentsProvider, useTonPayments } from 'futo-payments-client';
import type { Theme, UIWallet } from '@tonconnect/ui';

function PaymentDemo() {
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
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
            alert(`Payment failed: ${errorMessage}`);
        }
    };

    return (
        <div className="payment-demo">
            <h2>TON Payments Demo</h2>

            <div className="wallet-connection">
                {!isConnected ? (
                    <button onClick={connectWallet}>Connect Wallet</button>
                ) : (
                    <button onClick={disconnect}>Disconnect Wallet</button>
                )}
            </div>

            <div className="payment-form">
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

export default function App() {
    return (
        <TonPaymentsProvider
            apiKey={import.meta.env.VITE_TON_PAYMENTS_API_KEY}
            connectorParams={{
                manifestUrl: 'http://localhost:3000/tonconnect-manifest.json',
                uiPreferences: { theme: 'SYSTEM' as Theme },
                walletsListConfiguration: {
                    includeWallets: ['tonkeeper', 'tonhub'] as unknown as UIWallet[]
                }
            }}
        >
            <div className="app">
                <h1>TON Payments Example</h1>
                <PaymentDemo />
            </div>
        </TonPaymentsProvider>
    );
} 