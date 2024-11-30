import { BigNumberish } from "ethers";
import { PaymentClient } from "../client";
import { PaymentConfig, PaymentResponse } from "../types";
import { CHAIN } from "@tonconnect/ui";
import { toNano } from "ton";

export class TonPaymentsCore {
    readonly client: PaymentClient;

    constructor(config: PaymentConfig) {
        this.client = new PaymentClient(config);
    }

    /**
     * Gets payment details by ID
     * @param paymentId - The ID of the payment
     * @returns Object containing the payment details
     */
    async getPayment(paymentId: string): Promise<PaymentResponse> {
        return await this.client.getPayment(paymentId);
    }

    // Shared business logic here
    async createPaymentWithTransaction(params: {
        amount: BigNumberish;
        paymentId?: string;
    }) {
        const payment = params.paymentId ?
            await this.getPayment(params.paymentId) :
            await this.client.createPayment({ amount: params.amount });

        return {
            payment,
            transaction: this.buildTransaction(payment)
        };
    }

    private buildTransaction(payment: PaymentResponse) {
        // Transaction building logic moved here
        if (!payment.payload.amount_in_crypto.ton || !payment.payload.deposit_addresses.ton) {
            throw new Error('Invalid payment');
        }

        const chain = payment.payload.chain_id === -239 ? CHAIN.MAINNET :
            payment.payload.chain_id === -3 ? CHAIN.TESTNET :
                (() => { throw new Error('Invalid chain') })();

        return {
            validUntil: Math.floor(Date.now() / 1000) + 600,
            network: chain,
            messages: [
                {
                    address: payment.payload.deposit_addresses.ton,
                    amount: toNano(payment.payload.amount_in_crypto.ton).toString(),
                    payload: payment.payload.payment_id,
                },
            ]
        };
    }
} 