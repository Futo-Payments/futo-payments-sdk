export interface PaymentConfig {
    /** API endpoint for the payment service */
    apiEndpoint: string;
    /** API key for the payment service */
    apiKey: string;
    /** Optional timeout for API requests in milliseconds */
    timeout?: number;
}

export interface PaymentRequest {
    /** Amount in TON */
    amount: string;
    /** Optional payment ID */
    payment_id?: string;
    /** Optional expiration time in seconds */
    expiresIn?: number;
}

export interface PaymentResponse {
    /** Amount in USD */
    amount_in_usd: string;
    /** Amounts in different cryptocurrencies */
    amount_in_crypto: {
        ton: string | null;
        btc: string | null;
        eth: string | null;
        bnb: string | null;
    };
    /** Merchant name */
    merchant: string;
    /** Chain ID */
    chain_id: number;
    /** Payment status */
    current_status: PaymentStatus;
    /** Expiration timestamp */
    expires: string;
}

export enum PaymentStatus {
    CREATED = 'CREATED',
    PENDING = 'PENDING',
    COMPLETED = 'COMPLETED',
    EXPIRED = 'EXPIRED',
    FAILED = 'FAILED'
} 