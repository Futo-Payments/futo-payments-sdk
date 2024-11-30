'use client';

import React, { createContext, useContext, useMemo } from 'react';
import { PaymentClient } from '../core/payment-client';
import type { PaymentConfig } from '../types';

const PaymentContext = createContext<PaymentClient | null>(null);

export function PaymentProvider({
    config,
    children
}: {
    config: PaymentConfig;
    children: React.ReactNode;
}) {
    const client = useMemo(() => new PaymentClient(config), [config]);

    return (
        <PaymentContext.Provider value={client}>
            {children}
        </PaymentContext.Provider>
    );
}

export function usePaymentClient() {
    const client = useContext(PaymentContext);
    if (!client) {
        throw new Error('usePaymentClient must be used within a PaymentProvider');
    }
    return client;
} 