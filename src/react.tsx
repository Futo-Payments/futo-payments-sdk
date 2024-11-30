import { createContext, useContext, useCallback, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { TonConnectUI, TonConnectUiOptions, UIWallet } from '@tonconnect/ui';
import { BigNumberish } from 'ethers';
import { PaymentResponse } from './types';
import { TonPaymentsCore } from './core/ton-payments';
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

export const TonPaymentsContext = createContext<TonPaymentsContextType | undefined>(undefined);

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

/**
 * Provider component that manages TON wallet connections and payment operations
 * @param props - The provider props
 * @returns A context provider wrapper component
 */
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

    /**
     * Connects to a TON wallet by opening the wallet selection modal
     * @throws Error if TonConnect is not initialized
     */
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

    /**
     * Initiates a payment by creating a payment record on the server
     * @param amount - The amount to be paid
     * @returns Object containing the payment ID
     * @throws Error if TonConnect is not initialized or if the API request fails
     */
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


    /**
     * Gets payment details by ID
     * @param paymentId - The ID of the payment
     * @returns Object containing the payment details
     * @throws Error if the API request fails
     */
    const getPayment = useCallback(async (paymentId: string): Promise<PaymentResponse> => {
        try {
            return await paymentsCore.getPayment(paymentId);
        } catch (error) {
            console.error('Failed to get payment details:', error);
            throw error;
        }
    }, [paymentsCore]);

    /**
     * Sends a transaction to the specified address
     * @param params.to - Destination address
     * @param params.amount - Amount to send
     * @param params.payment_id - Optional payment ID (will be generated if not provided)
     * @returns Object containing the transaction hash
     * @throws Error if transaction fails or wallet is not connected
     */
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
    }, [tonConnect, isConnected, connectWallet, paymentsCore]);

    /**
     * Disconnects the current wallet
     */
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

                // await instance.connectionRestored;

                if (isMounted) {
                    setTonConnect(instance);
                    setIsInitialized(true);
                    const wallets = await instance.getWallets();
                    setIsConnected(!!wallets.length);
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

/**
 * Hook to access TON payments functionality
 * @returns The TON payments context containing wallet and payment methods
 * @throws Error if used outside of TonPaymentsProvider
 */
export function useTonPayments() {
    const context = useContext(TonPaymentsContext);
    if (context === undefined) {
        throw new Error('useTonPayments must be used within a TonPaymentsProvider');
    }
    return context;
} 