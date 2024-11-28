/// <reference types="jest" />
import { PaymentClient } from '../src/client';
import { PaymentStatus } from '../src/types';
import { Address } from 'ton';
import axios from 'axios';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('PaymentClient', () => {
    const mockConfig = {
        apiEndpoint: 'https://futo.io/api/',
        merchantAddress: Address.parse('0QAvGnXBkPCn8z9lrUfaYA4z8v7etTOihjGJQF4qt7c6Md7y')
    };

    beforeEach(() => {
        mockedAxios.create.mockReturnValue(mockedAxios as any);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('createPayment', () => {
        it('should create a payment request successfully', async () => {
            const mockResponse = {
                data: {
                    paymentId: '123',
                    amount: '1.5',
                    merchantAddress: mockConfig.merchantAddress.toString(),
                    status: PaymentStatus.PENDING,
                    createdAt: Date.now(),
                    expiresAt: Date.now() + 3600000
                }
            };

            mockedAxios.post.mockResolvedValueOnce(mockResponse);

            const client = new PaymentClient(mockConfig);
            const payment = await client.createPayment({
                amount: '1.5'
            });

            expect(payment).toEqual(mockResponse.data);
            expect(mockedAxios.post).toHaveBeenCalledWith('v1/create_payment', {
                amount: '1.5',
                merchantAddress: mockConfig.merchantAddress.toString()
            });
        });

        it('should throw error when merchant address is not provided', async () => {
            const client = new PaymentClient({
                apiEndpoint: 'https://api.example.com'
            });

            await expect(client.createPayment({
                amount: '1.5'
            })).rejects.toThrow('Merchant address is required');
        });
    });

    describe('getPayment', () => {
        it('should get payment status successfully', async () => {
            const mockResponse = {
                data: {
                    paymentId: '123',
                    amount: '1.5',
                    merchantAddress: mockConfig.merchantAddress.toString(),
                    status: PaymentStatus.COMPLETED,
                    txHash: '0x123',
                    createdAt: Date.now(),
                    expiresAt: Date.now() + 3600000
                }
            };

            mockedAxios.get.mockResolvedValueOnce(mockResponse);

            const client = new PaymentClient(mockConfig);
            const payment = await client.getPayment('123');

            expect(payment).toEqual(mockResponse.data);
            expect(mockedAxios.get).toHaveBeenCalledWith('v1/check_payment/123');
        });
    });
}); 