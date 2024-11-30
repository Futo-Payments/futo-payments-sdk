import { PaymentClient } from '../../src/core/payment-client';
import { PaymentStatus } from '../../src/types';
import axios from 'axios';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('PaymentClient', () => {
    const mockConfig = {
        apiKey: 'test-api-key',
        apiURL: 'https://api.test.com'
    };

    beforeEach(() => {
        mockedAxios.create.mockReturnValue(mockedAxios as any);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('createPayment', () => {
        it('should create a payment successfully', async () => {
            const mockResponse = {
                data: {
                    status: 200,
                    message: 'Payment created',
                    payload: {
                        payment_id: '123',
                        amount_in_usd: '10.00',
                        amount_in_crypto: {
                            ton: '5.0',
                            btc: null,
                            eth: null,
                            bnb: null
                        },
                        deposit_addresses: {
                            ton: 'EQD...abc',
                            btc: null,
                            eth: null,
                            bnb: null
                        },
                        merchant: 'Test Merchant',
                        chain_id: -3,
                        current_status: PaymentStatus.CREATED,
                        expires: '2024-03-21T12:00:00Z'
                    }
                }
            };

            mockedAxios.post.mockResolvedValueOnce(mockResponse);

            const client = new PaymentClient(mockConfig);
            const payment = await client.createPayment({ amount: '5.0' });

            expect(payment).toEqual(mockResponse.data);
            expect(mockedAxios.post).toHaveBeenCalledWith('v1/create_payment', {
                amount: '5.0'
            });
        });

        it('should throw error when API request fails', async () => {
            const errorMessage = 'API Error';
            mockedAxios.post.mockRejectedValueOnce(new Error(errorMessage));

            const client = new PaymentClient(mockConfig);
            await expect(client.createPayment({ amount: '5.0' }))
                .rejects
                .toThrow(errorMessage);
        });
    });

    describe('getPayment', () => {
        it('should get payment status successfully', async () => {
            const mockResponse = {
                data: {
                    status: 200,
                    message: 'Payment found',
                    payload: {
                        payment_id: '123',
                        amount_in_usd: '10.00',
                        amount_in_crypto: {
                            ton: '5.0',
                            btc: null,
                            eth: null,
                            bnb: null
                        },
                        deposit_addresses: {
                            ton: 'EQD...abc',
                            btc: null,
                            eth: null,
                            bnb: null
                        },
                        merchant: 'Test Merchant',
                        chain_id: -3,
                        current_status: PaymentStatus.PAID,
                        expires: '2024-03-21T12:00:00Z'
                    }
                }
            };

            mockedAxios.post.mockResolvedValueOnce(mockResponse);

            const client = new PaymentClient(mockConfig);
            const payment = await client.getPayment('123');

            expect(payment).toEqual(mockResponse.data);
            expect(mockedAxios.post).toHaveBeenCalledWith('v1/check_payment', {
                payment_id: '123'
            });
        });
    });

    describe('waitForPayment', () => {
        it('should resolve when payment is PAID', async () => {
            const mockPaidResponse = {
                data: {
                    status: 200,
                    message: 'Payment paid',
                    payload: {
                        payment_id: '123',
                        current_status: PaymentStatus.PAID,
                        // ... other fields
                    }
                }
            };

            mockedAxios.post.mockResolvedValueOnce(mockPaidResponse);

            const client = new PaymentClient(mockConfig);
            const result = await client.waitForPayment('123', 5000);

            expect(result).toEqual(mockPaidResponse.data);
            expect(mockedAxios.post).toHaveBeenCalledTimes(1);
        });

        it('should resolve when payment is EXPIRED', async () => {
            const mockExpiredResponse = {
                data: {
                    status: 200,
                    message: 'Payment expired',
                    payload: {
                        payment_id: '123',
                        current_status: PaymentStatus.EXPIRED,
                        // ... other fields
                    }
                }
            };

            mockedAxios.post.mockResolvedValueOnce(mockExpiredResponse);

            const client = new PaymentClient(mockConfig);
            const result = await client.waitForPayment('123', 5000);

            expect(result).toEqual(mockExpiredResponse.data);
            expect(mockedAxios.post).toHaveBeenCalledTimes(1);
        });

        it('should timeout after specified duration', async () => {
            const mockPendingResponse = {
                data: {
                    status: 200,
                    message: 'Payment pending',
                    payload: {
                        payment_id: '123',
                        current_status: PaymentStatus.CREATED,
                        // ... other fields
                    }
                }
            };

            mockedAxios.post.mockResolvedValue(mockPendingResponse);

            const client = new PaymentClient(mockConfig);
            await expect(client.waitForPayment('123', 100))
                .rejects
                .toThrow('Payment timeout');
        });
    });
}); 