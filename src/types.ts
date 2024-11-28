import { Address } from 'ton';

export interface PaymentConfig {
    /** API endpoint for the payment service */
    apiEndpoint: string;
    /** Default merchant address */
    merchantAddress?: Address;
    /** Optional timeout for API requests in milliseconds */
    timeout?: number;
}

export interface PaymentRequest {
    /** Amount in TON */
    amount: string;
    /** Merchant's TON address */
    merchantAddress: Address;
    /** Optional comment for the payment */
    comment?: string;
    /** Optional callback URL after successful payment */
    callbackUrl?: string;
    /** Optional expiration time in seconds */
    expiresIn?: number;
}

export interface PaymentResponse {
    /** Unique payment ID */
    paymentId: string;
    /** Payment amount in TON */
    amount: string;
    /** Merchant's TON address */
    merchantAddress: string;
    /** Payment status */
    status: PaymentStatus;
    /** Transaction hash if payment is completed */
    txHash?: string;
    /** Creation timestamp */
    createdAt: number;
    /** Expiration timestamp */
    expiresAt: number;
}

export enum PaymentStatus {
    PENDING = 'pending',
    COMPLETED = 'completed',
    EXPIRED = 'expired',
    FAILED = 'failed'
} 