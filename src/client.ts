import axios, { AxiosInstance } from 'axios';
import { Address } from 'ton';
import { PaymentConfig, PaymentRequest, PaymentResponse, PaymentStatus } from './types';

export class PaymentClient {
    private readonly api: AxiosInstance;
    private readonly config: PaymentConfig;

    constructor(config: PaymentConfig) {
        this.config = {
            timeout: 30000,
            ...config
        };

        this.api = axios.create({
            baseURL: this.config.apiEndpoint,
            timeout: this.config.timeout
        });
    }

    /**
     * Create a new payment request
     */
    async createPayment(request: Omit<PaymentRequest, 'merchantAddress'> & { merchantAddress?: Address }): Promise<PaymentResponse> {
        const merchantAddress = request.merchantAddress || this.config.merchantAddress;
        if (!merchantAddress) {
            throw new Error('Merchant address is required');
        }

        const response = await this.api.post<PaymentResponse>('v1/create_payment', {
            ...request,
            merchantAddress: merchantAddress.toString()
        });

        return response.data;
    }

    /**
     * Get payment status by ID
     */
    async getPayment(paymentId: string): Promise<PaymentResponse> {
        const response = await this.api.get<PaymentResponse>(`v1/check_payment/${paymentId}`);
        return response.data;
    }

    /**
     * Wait for payment to complete or expire
     */
    async waitForPayment(paymentId: string, timeoutMs: number = 300000): Promise<PaymentResponse> {
        const startTime = Date.now();

        while (Date.now() - startTime < timeoutMs) {
            const payment = await this.getPayment(paymentId);

            if (payment.status === PaymentStatus.COMPLETED ||
                payment.status === PaymentStatus.FAILED ||
                payment.status === PaymentStatus.EXPIRED) {
                return payment;
            }

            await new Promise(resolve => setTimeout(resolve, 2000));
        }

        throw new Error('Payment timeout');
    }
} 