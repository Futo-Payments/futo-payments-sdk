import { useState } from 'react';
import { TonPaymentsProvider, useTonPayments } from 'futo-payments-sdk';
import type { Theme, UIWallet } from '@tonconnect/ui';

function PaymentDemo() {
    const [amount, setAmount] = useState('1.0');
    const [recipientAddress, setRecipientAddress] = useState('');
    const { sendTransaction, isConnected } = useTonPayments();

    const handleSendPayment = async () => {
        try {
            await sendTransaction({
                to: recipientAddress,
                amount: parseFloat(amount)
            });
            alert('Payment sent successfully!');
        } catch (error: unknown) {
            if (error instanceof Error) {
                if (error.message.includes('User rejected the transaction')) {
                    alert('Transaction was cancelled by user');
                } else if (error.message.includes('Connect wallet')) {
                    try {
                        // Retry the transaction after connecting
                        await sendTransaction({
                            to: recipientAddress,
                            amount: parseFloat(amount)
                        });
                        alert('Payment sent successfully!');
                    } catch (retryError) {
                        alert(`Payment failed 1: ${retryError instanceof Error ? retryError.message : 'Unknown error'}`);
                    }
                } else {
                    alert(`Payment failed 2: ${error.message}`);
                }
            } else {
                alert('Payment failed: Unknown error occurred');
            }
        }
    };

    return (
        <div className="payment-demo">
            <h2>TON Payments Demo</h2>

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
                    disabled={!recipientAddress}
                >
                    {isConnected ? 'Send Payment' : 'Connect Wallet & Send'}
                </button>
            </div>
        </div>
    );
}

export default function App() {
    return (
        <TonPaymentsProvider
            config={{
                apiKey: import.meta.env.VITE_TON_PAYMENTS_API_KEY,
                apiURL: import.meta.env.VITE_TON_PAYMENTS_API_URL
            }}
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