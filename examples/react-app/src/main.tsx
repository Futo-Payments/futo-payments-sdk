import { Buffer } from 'buffer';
window.Buffer = Buffer;

import React from 'react';
import ReactDOM from 'react-dom/client';
import { TonPaymentsProvider } from '../../../src/react';
import App from './App';
import './styles.css';


ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <TonPaymentsProvider
            config={{
                apiKey: import.meta.env.VITE_TON_PAYMENTS_API_KEY,
                apiURL: import.meta.env.VITE_TON_PAYMENTS_API_URL
            }}
            connectorParams={{
                manifestUrl: import.meta.env.VITE_TON_CONNECT_MANIFEST_URL
            }}
        >
            <App />
        </TonPaymentsProvider>
    </React.StrictMode>
); 