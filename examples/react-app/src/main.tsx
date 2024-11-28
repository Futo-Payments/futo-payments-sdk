import { Buffer } from 'buffer';
window.Buffer = Buffer;

import React from 'react';
import ReactDOM from 'react-dom/client';
import { TonPaymentsProvider } from 'futo-payments-sdk';
import App from './App';
import './styles.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <TonPaymentsProvider apiKey={import.meta.env.VITE_TON_PAYMENTS_API_KEY}>
            <App />
        </TonPaymentsProvider>
    </React.StrictMode>
); 