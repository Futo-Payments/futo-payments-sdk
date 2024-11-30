'use client';

import { createContext, useContext, useCallback, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { TonConnectUI, TonConnectUiOptions, UIWallet } from '@tonconnect/ui';
import { BigNumberish } from 'ethers';
import { PaymentResponse } from '../types';
import { TonPaymentsCore } from '../core/ton-payments';

/**
 * Interface for the TON payments context that provides payment and wallet functionality
 */
export interface TonPaymentsContextType {
    /** Initiates a payment and returns payment details */
    initiatePayment: (amount: BigNumberish) => Promise<PaymentResponse>;
    /** Connects to a TON wallet */
    connectWallet: () => Promise<void>;
    /** Sends a transaction to the specified address */
    sendTransaction: (params: {
        to: string;
        amount: BigNumberish;
        payment_id?: string;
    }) => Promise<{ txHash: string }>;
    /** Indicates if wallet is connected */
    isConnected: boolean;
    /** Disconnects the current wallet */
    disconnect: () => void;
    /** Gets payment details by ID */
    getPayment: (paymentId: string) => Promise<PaymentResponse>;
}

/**
 * Props for the TonPaymentsProvider component
 */
export interface TonPaymentsProviderProps {
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

export const TonPaymentsContext = createContext<TonPaymentsContextType | undefined>(undefined);

export function TonPaymentsProvider({
    children,
    config,
    connectorParams
}: TonPaymentsProviderProps) {
    const [tonConnect, setTonConnect] = useState<TonConnectUI | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const [isInitialized, setIsInitialized] = useState(false);
    const [initError, setInitError] = useState<string | null>(null);
    const [paymentsCore] = useState(() => new TonPaymentsCore({
        apiURL: config.apiURL,
        apiKey: config.apiKey
    }));

    const connectWallet = useCallback(async () => {
        if (!tonConnect) {
            throw new Error('TonConnect not initialized');
        }
        try {
            await tonConnect.openModal();
            const wallets = await tonConnect.getWallets();
            setIsConnected(wallets.length > 0);
        } catch (error) {
            console.error('Wallet connection failed:', error);
            throw error;
        }
    }, [tonConnect]);

    const initiatePayment = useCallback(async (amount: BigNumberish): Promise<PaymentResponse> => {
        try {
            if (!tonConnect) {
                throw new Error('InitPayment: TonConnect not initialized');
            }
            const { payment } = await paymentsCore.createPaymentWithTransaction({ amount });
            return payment;
        } catch (error) {
            console.error('Payment initiation failed:', error);
            throw error;
        }
    }, [tonConnect, paymentsCore]);

    const getPayment = useCallback(async (paymentId: string): Promise<PaymentResponse> => {
        try {
            return await paymentsCore.getPayment(paymentId);
        } catch (error) {
            console.error('Failed to get payment details:', error);
            throw error;
        }
    }, [paymentsCore]);

    const sendTransaction = useCallback(async ({ amount, payment_id }: {
        amount: BigNumberish;
        payment_id?: string;
    }) => {
        try {
            if (!isInitialized || !tonConnect) {
                throw new Error('SendTX: TonConnect not initialized');
            }

            if (!isConnected) {
                await connectWallet();
            }

            const { transaction } = await paymentsCore.createPaymentWithTransaction({
                amount,
                paymentId: payment_id
            });

            const result = await tonConnect.sendTransaction(transaction);
            return {
                txHash: result.boc
            };
        } catch (error) {
            console.error('Transaction failed:', error);
            throw error;
        }
    }, [tonConnect, isConnected, connectWallet, paymentsCore, isInitialized]);

    const disconnect = useCallback(() => {
        if (tonConnect) {
            tonConnect.disconnect();
            setIsConnected(false);
        }
    }, [tonConnect]);

    useEffect(() => {
        let isMounted = true;
        let instance: TonConnectUI | null = null;

        const initTonConnect = async () => {
            try {
                if ((window as any).__tonConnectUI) {
                    instance = (window as any).__tonConnectUI;
                } else {
                    instance = new TonConnectUI({
                        ...connectorParams,
                        manifestUrl: connectorParams?.manifestUrl
                    });
                    (window as any).__tonConnectUI = instance;
                }

                if (!instance) {
                    throw new Error('Failed to initialize TonConnect instance');
                }

                if (isMounted) {
                    setTonConnect(instance);
                    setIsInitialized(true);
                    const wallets = await instance.getWallets();
                    setIsConnected(wallets.length > 0);
                    setInitError(null);
                } else {
                    setIsInitialized(false);
                }
            } catch (error) {
                setIsInitialized(false);
                console.error('Failed to initialize TonConnect:', error);
                if (isMounted) {
                    setInitError(error instanceof Error ? error.message : 'Failed to initialize TonConnect');
                }
            }
        };

        initTonConnect();

        return () => {
            isMounted = false;
            if (instance) {
                setTonConnect(null);
                setIsConnected(false);
            }
        };
    }, [connectorParams]);

    if (initError) {
        throw new Error(initError);
    }

    return (
        <TonPaymentsContext.Provider value={{
            initiatePayment,
            connectWallet,
            sendTransaction,
            isConnected,
            disconnect,
            getPayment
        }}>
            {children}
        </TonPaymentsContext.Provider>
    );
}

export function useTonPayments() {
    const context = useContext(TonPaymentsContext);
    if (context === undefined) {
        throw new Error('useTonPayments must be used within a TonPaymentsProvider');
    }
    return context;
} 