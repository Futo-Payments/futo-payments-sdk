import { createContext, useContext, useCallback, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { TonConnectUI, TonConnectUiOptions, UIWallet } from '@tonconnect/ui';
import { toNano } from 'ton';
import { BigNumberish } from 'ethers';

export interface TonPaymentsContextType {
    initiatePayment: (amount: BigNumberish) => Promise<{ payment_id: string }>;
    connectWallet: () => Promise<void>;
    sendTransaction: (params: {
        to: string;
        amount: BigNumberish;
        message?: string;
    }) => Promise<{ txHash: string }>;
    isConnected: boolean;
    disconnect: () => void;
}

export const TonPaymentsContext = createContext<TonPaymentsContextType | undefined>(undefined);

export interface TonPaymentsProviderProps {
    config: {
        apiKey: string;
        apiURL: string;
    };
    children: ReactNode;
    connectorParams?: {
        manifestUrl?: string;
        uiPreferences?: TonConnectUiOptions['uiPreferences'];
        walletsListConfiguration?: {
            includeWallets?: UIWallet[];
            excludeWallets?: UIWallet[];
        };
    };
}

export function TonPaymentsProvider({
    children,
    config,
    connectorParams
}: TonPaymentsProviderProps) {
    const [tonConnect, setTonConnect] = useState<TonConnectUI | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const [isInitialized, setIsInitialized] = useState(false);
    const [initError, setInitError] = useState<string | null>(null);

    useEffect(() => {
        let isMounted = true;
        let instance: TonConnectUI | null = null;

        const initTonConnect = async () => {
            try {
                instance = new TonConnectUI({
                    ...connectorParams,
                    manifestUrl: connectorParams?.manifestUrl
                });

                await instance.connectionRestored;

                if (isMounted) {
                    setTonConnect(instance);
                    const wallets = await instance.getWallets();
                    setIsConnected(!!wallets.length);
                    setIsInitialized(true);
                    setInitError(null);
                }
            } catch (error) {
                console.error('Failed to initialize TonConnect:', error);
                if (isMounted) {
                    setInitError(error instanceof Error ? error.message : 'Failed to initialize TonConnect');
                    setIsInitialized(false);
                }
            }
        };

        initTonConnect();

        return () => {
            isMounted = false;
            if (instance) {
                if (instance.connected) {
                    instance.disconnect().catch(console.error);
                }
                setTonConnect(null);
                setIsConnected(false);
            }
        };
    }, [connectorParams]);

    if (!isInitialized && !initError) {
        return <div>Initializing TON Connect...</div>;
    }

    if (initError) {
        return <div>Failed to initialize TON Connect: {initError}</div>;
    }

    const initiatePayment = useCallback(async (amount: BigNumberish) => {
        try {
            const response = await fetch(`${config.apiURL}v1/create_payment`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${config.apiKey}`
                },
                body: JSON.stringify({
                    amount: amount
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to initiate payment');
            }

            const data = await response.json();
            return {
                payment_id: data.payment_id
            };
        } catch (error) {
            console.error('Payment initiation failed:', error);
            throw error;
        }
    }, [config]);

    const connectWallet = useCallback(async () => {
        if (!tonConnect) {
            throw new Error('TonConnect not initialized');
        }

        try {
            await tonConnect.connectWallet();
            setIsConnected(true);
        } catch (error) {
            console.error('Wallet connection failed:', error);
            throw error;
        }
    }, [tonConnect]);

    const sendTransaction = useCallback(async ({ to, amount, message }: {
        to: string;
        amount: BigNumberish;
        message?: string;
    }) => {
        if (!tonConnect) {
            throw new Error('TonConnect not initialized');
        }

        if (!isConnected) {
            throw new Error('Wallet not connected');
        }

        try {
            const transaction = {
                validUntil: Math.floor(Date.now() / 1000) + 600,
                messages: [
                    {
                        address: to,
                        amount: toNano(amount.toString()).toString(),
                        payload: message || '',
                    },
                ],
            };

            const result = await tonConnect.sendTransaction(transaction);
            return {
                txHash: result.boc
            };
        } catch (error) {
            console.error('Transaction failed:', error);
            throw error;
        }
    }, [tonConnect, isConnected]);

    const disconnect = useCallback(() => {
        if (tonConnect) {
            tonConnect.disconnect();
            setIsConnected(false);
        }
    }, [tonConnect]);

    return (
        <TonPaymentsContext.Provider value={{
            initiatePayment,
            connectWallet,
            sendTransaction,
            isConnected,
            disconnect
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