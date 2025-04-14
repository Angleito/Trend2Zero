if (typeof setImmediate === 'undefined') {
  global.setImmediate = (fn, ...args) => setTimeout(fn, 0, ...args);
}

const axios = require('axios');
const coinMarketCapService = require('../../services/coinMarketCapService');
const AppError = require('../../utils/appError');
const cache = require('../../utils/cache');

jest.mock('axios');
jest.mock('../../utils/cache');

describe('CoinMarketCap Service', () => {
    const mockApiKey = 'test-api-key';

    beforeEach(() => {
        jest.clearAllMocks();
        cache.get.mockReturnValue(null);
    });

    describe('getCryptoPrice', () => {
        const mockPriceResponse = {
            data: {
                data: {
                    BTC: {
                        quote: {
                            USD: {
                                price: 50000,
                                last_updated: '2025-04-09T13:00:00.000Z'
                            }
                        }
                    }
                }
            }
        };

        it('should fetch and return cryptocurrency price', async () => {
            axios.get.mockResolvedValueOnce(mockPriceResponse);

            const result = await coinMarketCapService.getCryptoPrice('BTC');

            expect(result).toEqual({
                symbol: 'BTC',
                price: 50000,
                lastUpdated: '2025-04-09T13:00:00.000Z'
            });
        });

        it('should return cached data if available', async () => {
            const cachedData = {
                symbol: 'BTC',
                price: 50000,
                lastUpdated: '2025-04-09T13:00:00.000Z'
            };
            cache.get.mockReturnValueOnce(cachedData);

            const result = await coinMarketCapService.getCryptoPrice('BTC');

            expect(result).toEqual(cachedData);
            expect(axios.get).not.toHaveBeenCalled();
        });

        it('should throw an AppError if cryptocurrency not found', async () => {
            axios.get.mockResolvedValueOnce({
                data: {
                    status: {
                        error_code: 400,
                        error_message: 'Invalid symbol'
                    }
                }
            });

            await expect(coinMarketCapService.getCryptoPrice('INVALID'))
                .rejects.toThrow('Cryptocurrency not found: INVALID');
        });
    });

    describe('getHistoricalData', () => {
        const mockHistoricalResponse = {
            data: {
                data: {
                    quotes: [
                        {
                            timestamp: '2025-01-01T00:00:00.000Z',
                            quote: { USD: { price: 45000 } }
                        },
                        {
                            timestamp: '2025-01-02T00:00:00.000Z',
                            quote: { USD: { price: 46000 } }
                        }
                    ]
                }
            }
        };

        it('should fetch and return historical data', async () => {
            axios.get.mockResolvedValueOnce(mockHistoricalResponse);

            const result = await coinMarketCapService.getHistoricalData('BTC', '2025-01-01', '2025-01-31');

            expect(result).toEqual([
                { date: '2025-01-01T00:00:00.000Z', price: 45000 },
                { date: '2025-01-02T00:00:00.000Z', price: 46000 }
            ]);
        });

        it('should return cached data if available', async () => {
            const cachedData = [
                { date: '2025-01-01T00:00:00.000Z', price: 45000 }
            ];
            cache.get.mockReturnValueOnce(cachedData);

            const result = await coinMarketCapService.getHistoricalData('BTC', '2025-01-01', '2025-01-31');

            expect(result).toEqual(cachedData);
            expect(axios.get).not.toHaveBeenCalled();
        });

        it('should throw an AppError if the API call fails', async () => {
            axios.get.mockRejectedValueOnce(new Error('API Error'));

            await expect(coinMarketCapService.getHistoricalData('BTC', '2025-01-01', '2025-01-31'))
                .rejects.toThrow('Failed to fetch historical data for cryptocurrency: BTC');
        });
    });

    describe('searchCrypto', () => {
        const mockSearchResponse = {
            data: {
                data: [
                    { symbol: 'BTC', name: 'Bitcoin' },
                    { symbol: 'ETH', name: 'Ethereum' }
                ]
            }
        };

        it('should search and return cryptocurrencies', async () => {
            axios.get.mockResolvedValueOnce(mockSearchResponse);

            const result = await coinMarketCapService.searchCrypto('bit');

            expect(result).toEqual([
                { symbol: 'BTC', name: 'Bitcoin' },
                { symbol: 'ETH', name: 'Ethereum' }
            ]);
        });

        it('should return cached data if available', async () => {
            const cachedData = [
                { symbol: 'BTC', name: 'Bitcoin' }
            ];
            cache.get.mockReturnValueOnce(cachedData);

            const result = await coinMarketCapService.searchCrypto('bit');

            expect(result).toEqual(cachedData);
            expect(axios.get).not.toHaveBeenCalled();
        });

        it('should throw an AppError if the API call fails', async () => {
            axios.get.mockRejectedValueOnce(new Error('API Error'));

            await expect(coinMarketCapService.searchCrypto('bit'))
                .rejects.toThrow('Failed to search cryptocurrencies');
        });
    });

    describe('getMarketOverview', () => {
        const mockOverviewResponse = {
            data: {
                data: {
                    total_market_cap: { USD: 2000000000000 },
                    total_volume_24h: { USD: 100000000000 },
                    btc_dominance: 45.5,
                    eth_dominance: 18.2
                }
            }
        };

        it('should fetch and return market overview', async () => {
            axios.get.mockResolvedValueOnce(mockOverviewResponse);

            const result = await coinMarketCapService.getMarketOverview();

            expect(result).toEqual({
                totalMarketCap: 2000000000000,
                total24hVolume: 100000000000,
                btcDominance: 45.5,
                ethDominance: 18.2
            });
        });

        it('should return cached data if available', async () => {
            const cachedData = {
                totalMarketCap: 2000000000000,
                total24hVolume: 100000000000,
                btcDominance: 45.5,
                ethDominance: 18.2
            };
            cache.get.mockReturnValueOnce(cachedData);

            const result = await coinMarketCapService.getMarketOverview();

            expect(result).toEqual(cachedData);
            expect(axios.get).not.toHaveBeenCalled();
        });

        it('should throw an AppError if the API call fails', async () => {
            axios.get.mockRejectedValueOnce(new Error('API Error'));

            await expect(coinMarketCapService.getMarketOverview())
                .rejects.toThrow('Failed to fetch market overview');
        });
    });
});
