import axios, { AxiosInstance } from 'axios';
import { PaymentConfig, PaymentResponse, PaymentStatus } from '../types';
import { BigNumberish } from 'ethers';

export class PaymentClient {
    private readonly api: AxiosInstance;
    private readonly config: PaymentConfig;

    constructor(config: PaymentConfig) {
        this.config = {
            timeout: 30000,
            ...config
        };

        this.api = axios.create({
            baseURL: this.config.apiURL,
            timeout: this.config.timeout,
            headers: {
                'Authorization': `Bearer ${this.config.apiKey}`,
                'Content-Type': 'application/json'
            }
        });
    }

    async createPayment(request: { amount: BigNumberish }): Promise<PaymentResponse> {
        const response = await this.api.post<PaymentResponse>('v1/create_payment', {
            amount: request.amount
        });

        return response.data;
    }

    async getPayment(paymentId: string): Promise<PaymentResponse> {
        const response = await this.api.post<PaymentResponse>('v1/check_payment', {
            payment_id: paymentId
        });
        return response.data;
    }

    async waitForPayment(paymentId: string, timeoutMs: number = 300000): Promise<PaymentResponse> {
        const startTime = Date.now();
        const pollInterval = 2000; // 2 seconds

        while (Date.now() - startTime < timeoutMs) {
            const payment = await this.getPayment(paymentId);

            if (payment.payload.current_status === PaymentStatus.PAID ||
                payment.payload.current_status === PaymentStatus.EXPIRED) {
                return payment;
            }

            await new Promise(resolve => setTimeout(resolve, pollInterval));
        }

        throw new Error('Payment timeout');
    }
} 