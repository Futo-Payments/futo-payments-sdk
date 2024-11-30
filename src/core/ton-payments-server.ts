import { BigNumberish } from 'ethers';
import { PaymentResponse } from '../types';
import { TonPaymentsCore } from './ton-payments';

export class TonPaymentsServer {
    private readonly core: TonPaymentsCore;

    constructor(config: {
        apiKey: string;
        apiURL: string;
    }) {
        this.core = new TonPaymentsCore({
            apiURL: config.apiURL,
            apiKey: config.apiKey
        });
    }

    async createPaymentWithTransaction(params: {
        amount: BigNumberish;
        paymentId?: string;
    }): Promise<{ payment: PaymentResponse; transaction: any }> {
        return await this.core.createPaymentWithTransaction(params);
    }

    async getPayment(paymentId: string): Promise<PaymentResponse> {
        return await this.core.getPayment(paymentId);
    }
} 