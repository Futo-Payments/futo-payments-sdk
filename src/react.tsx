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

    const connectWallet = useCallback(async () => {
        if (!tonConnect) {
            throw new Error('TonConnect not initialized');
        }
        try {
            await tonConnect.openModal();
            const wallets = await tonConnect.getWallets();
            console.log('wallets', wallets);
            setIsConnected(wallets.length > 0);
        } catch (error) {
            console.error('Wallet connection failed:', error);
            throw error;
        }
    }, [tonConnect]);

    const initiatePayment = useCallback(async (amount: BigNumberish) => {
        try {
            if (!tonConnect) {
                throw new Error('TonConnect not initialized');
            }

            if (!isConnected) {
                await connectWallet();
            }

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
    }, [config, tonConnect, isConnected, connectWallet]);

    const sendTransaction = useCallback(async ({ to, amount, message }: {
        to: string;
        amount: BigNumberish;
        message?: string;
    }) => {
        try {
            if (!tonConnect) {
                throw new Error('TonConnect not initialized');
            }

            if (!isConnected) {
                await connectWallet();
            }

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
    }, [tonConnect, isConnected, connectWallet]);

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
                setTonConnect(null);
                setIsConnected(false);
            }
        };
    }, [connectorParams]);

    if (initError) {
        return (
            <TonPaymentsContext.Provider value={{
                initiatePayment,
                connectWallet,
                sendTransaction,
                isConnected,
                disconnect
            }}>
                <div>Failed to initialize TON Connect: {initError}</div>
            </TonPaymentsContext.Provider>
        );
    }

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