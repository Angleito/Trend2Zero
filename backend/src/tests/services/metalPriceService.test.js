const axios = require('axios');
const { MetalPriceService } = require('../../services/metalPriceService');
const AppError = require('../../utils/appError');
const cache = require('../../utils/cache');

jest.mock('axios');
jest.mock('../../utils/cache');

describe('Metal Price Service', () => {
    let metalPriceService;
    const mockApiKey = 'test-api-key';

    beforeEach(() => {
        jest.clearAllMocks();
        metalPriceService = new MetalPriceService(mockApiKey);
    });

    describe('getMetalBySymbol', () => {
        it('should fetch and return metal price', async () => {
            const mockResponse = {
                data: {
                    success: true,
                    rates: {
                        XAU: 0.0005 // 1 USD = 0.0005 XAU, so 1 XAU = 2000 USD
                    },
                    timestamp: 1617235200
                }
            };
            axios.get.mockResolvedValue(mockResponse);
            cache.get.mockReturnValue(null);

            const result = await metalPriceService.getMetalBySymbol('XAU');

            expect(axios.get).toHaveBeenCalledWith(
                'https://metals-api.com/api/latest',
                {
                    params: {
                        access_key: mockApiKey,
                        base: 'USD',
                        symbols: 'XAU'
                    }
                }
            );
            expect(result).toEqual({
                symbol: 'XAU',
                price: 2000, // 1/0.0005
                timestamp: 1617235200,
                unit: 'troy ounce'
            });
            expect(cache.set).toHaveBeenCalledWith('metal_price_XAU', result, 300);
        });

        it('should return cached data if available', async () => {
            const mockData = {
                symbol: 'XAU',
                price: 2000,
                timestamp: 1617235200
            };
            cache.get.mockReturnValue(mockData);

            const result = await metalPriceService.getMetalBySymbol('XAU');

            expect(axios.get).not.toHaveBeenCalled();
            expect(result).toEqual(mockData);
        });

        it('should handle API errors gracefully', async () => {
            const mockResponse = {
                data: {
                    success: false,
                    error: {
                        message: 'Invalid API key'
                    }
                }
            };
            axios.get.mockResolvedValue(mockResponse);
            cache.get.mockReturnValue(null);

            await expect(metalPriceService.getMetalBySymbol('XAU'))
                .rejects.toThrow('Failed to fetch metal price: Invalid API key');
        });

        it('should handle network errors', async () => {
            axios.get.mockRejectedValue(new Error('Network Error'));
            cache.get.mockReturnValue(null);

            await expect(metalPriceService.getMetalBySymbol('XAU'))
                .rejects.toThrow('Failed to fetch price for metal: XAU');
        });
    });

    describe('getHistoricalData', () => {
        const startDate = '2023-01-01';
        const endDate = '2023-01-31';

        it('should fetch and return historical data', async () => {
            const mockResponse = {
                data: {
                    success: true,
                    rates: {
                        '2023-01-01': { XAU: 0.0005 },
                        '2023-01-02': { XAU: 0.00051 }
                    }
                }
            };
            axios.get.mockResolvedValue(mockResponse);
            cache.get.mockReturnValue(null);

            const result = await metalPriceService.getHistoricalData('XAU', startDate, endDate);

            expect(axios.get).toHaveBeenCalledWith(
                'https://metals-api.com/api/timeframe',
                {
                    params: {
                        access_key: mockApiKey,
                        base: 'USD',
                        symbols: 'XAU',
                        start_date: startDate,
                        end_date: endDate
                    }
                }
            );
            expect(result).toEqual([
                { date: '2023-01-01', price: 2000, unit: 'troy ounce' },
                { date: '2023-01-02', price: 1960.7843137254902, unit: 'troy ounce' }
            ]);
            expect(cache.set).toHaveBeenCalledWith(
                `metal_historical_XAU_${startDate}_${endDate}`,
                result,
                300
            );
        });

        it('should return cached data if available', async () => {
            const mockData = [
                { date: '2023-01-01', price: 2000 }
            ];
            cache.get.mockReturnValue(mockData);

            const result = await metalPriceService.getHistoricalData('XAU', startDate, endDate);

            expect(axios.get).not.toHaveBeenCalled();
            expect(result).toEqual(mockData);
        });

        it('should handle API errors gracefully', async () => {
            const mockResponse = {
                data: {
                    success: false,
                    error: {
                        message: 'Invalid date range'
                    }
                }
            };
            axios.get.mockResolvedValue(mockResponse);
            cache.get.mockReturnValue(null);

            await expect(metalPriceService.getHistoricalData('XAU', startDate, endDate))
                .rejects.toThrow('Failed to fetch historical data: Invalid date range');
        });

        it('should handle network errors', async () => {
            axios.get.mockRejectedValue(new Error('Network Error'));
            cache.get.mockReturnValue(null);

            await expect(metalPriceService.getHistoricalData('XAU', startDate, endDate))
                .rejects.toThrow('Failed to fetch historical data for metal: XAU');
        });
    });

    describe('getSupportedMetals', () => {
        it('should fetch and return supported metals list', async () => {
            const mockResponse = {
                data: {
                    success: true,
                    symbols: {
                        XAU: 'Gold',
                        XAG: 'Silver'
                    }
                }
            };
            axios.get.mockResolvedValue(mockResponse);
            cache.get.mockReturnValue(null);

            const result = await metalPriceService.getSupportedMetals();

            expect(axios.get).toHaveBeenCalledWith(
                'https://metals-api.com/api/symbols',
                {
                    params: {
                        access_key: mockApiKey
                    }
                }
            );
            expect(result).toEqual([
                { symbol: 'XAU', name: 'Gold', type: 'metal' },
                { symbol: 'XAG', name: 'Silver', type: 'metal' }
            ]);
            expect(cache.set).toHaveBeenCalledWith('supported_metals', result, 300);
        });

        it('should return cached data if available', async () => {
            const mockData = [
                { symbol: 'XAU', name: 'Gold', type: 'metal' }
            ];
            cache.get.mockReturnValue(mockData);

            const result = await metalPriceService.getSupportedMetals();

            expect(axios.get).not.toHaveBeenCalled();
            expect(result).toEqual(mockData);
        });

        it('should handle API errors gracefully', async () => {
            const mockResponse = {
                data: {
                    success: false,
                    error: {
                        message: 'API limit exceeded'
                    }
                }
            };
            axios.get.mockResolvedValue(mockResponse);
            cache.get.mockReturnValue(null);

            await expect(metalPriceService.getSupportedMetals())
                .rejects.toThrow('Failed to fetch supported metals: API limit exceeded');
        });

        it('should handle network errors', async () => {
            axios.get.mockRejectedValue(new Error('Network Error'));
            cache.get.mockReturnValue(null);

            await expect(metalPriceService.getSupportedMetals())
                .rejects.toThrow('Failed to fetch supported metals list');
        });
    });
});
