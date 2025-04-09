const MarketDataService = require('../../services/marketDataService');
const AppError = require('../../utils/appError');
const cache = require('../../utils/cache');

jest.mock('../../utils/cache');

describe('Market Data Service', () => {
    let marketDataService;
    let mockCoinMarketCapService;
    let mockMetalPriceService;
    let mockAlphaVantageService;

    beforeEach(() => {
        jest.clearAllMocks();

        // Create mock services
        mockCoinMarketCapService = {
            getCryptoPrice: jest.fn(),
            getHistoricalData: jest.fn(),
            searchCrypto: jest.fn(),
            getMarketOverview: jest.fn()
        };

        mockMetalPriceService = {
            getMetalBySymbol: jest.fn(),
            getHistoricalData: jest.fn()
        };

        mockAlphaVantageService = {
            getStockQuote: jest.fn(),
            getHistoricalData: jest.fn(),
            searchStocks: jest.fn(),
            getMarketOverview: jest.fn()
        };

        // Create service instance with mocks
        marketDataService = new MarketDataService({
            coinMarketCapService: mockCoinMarketCapService,
            metalPriceService: mockMetalPriceService,
            alphaVantageService: mockAlphaVantageService
        });
    });

    describe('getAssetPrice', () => {
        it('should fetch crypto price from CoinMarketCap', async () => {
            const mockPrice = { symbol: 'BTC', price: 50000 };
            mockCoinMarketCapService.getCryptoPrice.mockResolvedValue(mockPrice);
            cache.get.mockReturnValue(null);

            const result = await marketDataService.getAssetPrice('BTC', 'crypto');

            expect(mockCoinMarketCapService.getCryptoPrice).toHaveBeenCalledWith('BTC');
            expect(result).toEqual(mockPrice);
            expect(cache.set).toHaveBeenCalledWith('price_BTC_crypto', mockPrice, 300);
        });

        it('should fetch metal price from MetalPriceService', async () => {
            const mockPrice = { symbol: 'XAU', price: 1800 };
            mockMetalPriceService.getMetalBySymbol.mockResolvedValue(mockPrice);
            cache.get.mockReturnValue(null);

            const result = await marketDataService.getAssetPrice('XAU', 'metal');

            expect(mockMetalPriceService.getMetalBySymbol).toHaveBeenCalledWith('XAU');
            expect(result).toEqual(mockPrice);
            expect(cache.set).toHaveBeenCalledWith('price_XAU_metal', mockPrice, 300);
        });

        it('should fetch stock price from AlphaVantage', async () => {
            const mockPrice = { symbol: 'AAPL', price: 150 };
            mockAlphaVantageService.getStockQuote.mockResolvedValue(mockPrice);
            cache.get.mockReturnValue(null);

            const result = await marketDataService.getAssetPrice('AAPL', 'stock');

            expect(mockAlphaVantageService.getStockQuote).toHaveBeenCalledWith('AAPL');
            expect(result).toEqual(mockPrice);
            expect(cache.set).toHaveBeenCalledWith('price_AAPL_stock', mockPrice, 300);
        });

        it('should return cached data if available', async () => {
            const mockPrice = { symbol: 'BTC', price: 50000 };
            cache.get.mockReturnValue(mockPrice);

            const result = await marketDataService.getAssetPrice('BTC', 'crypto');

            expect(mockCoinMarketCapService.getCryptoPrice).not.toHaveBeenCalled();
            expect(result).toEqual(mockPrice);
        });

        it('should handle API errors gracefully', async () => {
            mockCoinMarketCapService.getCryptoPrice.mockRejectedValue(new Error('API Error'));
            cache.get.mockReturnValue(null);

            await expect(marketDataService.getAssetPrice('BTC', 'crypto'))
                .rejects.toThrow('Failed to fetch price for BTC');
        });

        it('should throw error for unsupported asset type', async () => {
            await expect(marketDataService.getAssetPrice('TEST', 'unsupported'))
                .rejects.toThrow('Unsupported asset type: unsupported');
        });
    });

    describe('getHistoricalData', () => {
        it('should fetch crypto historical data from CoinMarketCap', async () => {
            const mockData = [{ date: '2023-01-01', price: 50000 }];
            mockCoinMarketCapService.getHistoricalData.mockResolvedValue(mockData);
            cache.get.mockReturnValue(null);

            const options = { interval: '1d', limit: 30 };
            const result = await marketDataService.getHistoricalData('BTC', 'crypto', options);

            expect(mockCoinMarketCapService.getHistoricalData)
                .toHaveBeenCalledWith('BTC', '1d', 30);
            expect(result).toEqual(mockData);
            expect(cache.set).toHaveBeenCalledWith(
                'historical_BTC_crypto_{"interval":"1d","limit":30}',
                mockData,
                300
            );
        });

        it('should fetch stock historical data from AlphaVantage', async () => {
            const mockData = [{ date: '2023-01-01', price: 150 }];
            mockAlphaVantageService.getHistoricalData.mockResolvedValue(mockData);
            cache.get.mockReturnValue(null);

            const options = { outputsize: 'full' };
            const result = await marketDataService.getHistoricalData('AAPL', 'stock', options);

            expect(mockAlphaVantageService.getHistoricalData)
                .toHaveBeenCalledWith('AAPL', 'full');
            expect(result).toEqual(mockData);
            expect(cache.set).toHaveBeenCalledWith(
                'historical_AAPL_stock_{"outputsize":"full"}',
                mockData,
                300
            );
        });

        it('should fetch metal historical data from MetalPriceService', async () => {
            const mockData = [{ date: '2023-01-01', price: 1800 }];
            mockMetalPriceService.getHistoricalData.mockResolvedValue(mockData);
            cache.get.mockReturnValue(null);

            const options = { startDate: '2023-01-01', endDate: '2023-01-31' };
            const result = await marketDataService.getHistoricalData('XAU', 'metal', options);

            expect(mockMetalPriceService.getHistoricalData)
                .toHaveBeenCalledWith('XAU', '2023-01-01', '2023-01-31');
            expect(result).toEqual(mockData);
            expect(cache.set).toHaveBeenCalledWith(
                'historical_XAU_metal_{"startDate":"2023-01-01","endDate":"2023-01-31"}',
                mockData,
                300
            );
        });

        it('should return cached data if available', async () => {
            const mockData = [{ date: '2023-01-01', price: 50000 }];
            cache.get.mockReturnValue(mockData);

            const result = await marketDataService.getHistoricalData('BTC', 'crypto');

            expect(mockCoinMarketCapService.getHistoricalData).not.toHaveBeenCalled();
            expect(result).toEqual(mockData);
        });

        it('should handle API errors gracefully', async () => {
            mockCoinMarketCapService.getHistoricalData.mockRejectedValue(new Error('API Error'));
            cache.get.mockReturnValue(null);

            await expect(marketDataService.getHistoricalData('BTC', 'crypto'))
                .rejects.toThrow('Failed to fetch historical data for BTC');
        });

        it('should throw error for unsupported asset type', async () => {
            await expect(marketDataService.getHistoricalData('TEST', 'unsupported'))
                .rejects.toThrow('Unsupported asset type: unsupported');
        });
    });

    describe('searchAssets', () => {
        it('should search across all services when no type specified', async () => {
            const mockCryptoResults = [{ symbol: 'BTC', type: 'crypto' }];
            const mockStockResults = [{ symbol: 'AAPL', type: 'stock' }];
            
            mockCoinMarketCapService.searchCrypto.mockResolvedValue(mockCryptoResults);
            mockAlphaVantageService.searchStocks.mockResolvedValue(mockStockResults);
            cache.get.mockReturnValue(null);

            const result = await marketDataService.searchAssets('test');

            expect(mockCoinMarketCapService.searchCrypto).toHaveBeenCalledWith('test');
            expect(mockAlphaVantageService.searchStocks).toHaveBeenCalledWith('test');
            expect(result).toEqual([...mockCryptoResults, ...mockStockResults]);
        });

        it('should search only specified type', async () => {
            const mockCryptoResults = [{ symbol: 'BTC', type: 'crypto' }];
            mockCoinMarketCapService.searchCrypto.mockResolvedValue(mockCryptoResults);
            cache.get.mockReturnValue(null);

            const result = await marketDataService.searchAssets('test', 'crypto');

            expect(mockCoinMarketCapService.searchCrypto).toHaveBeenCalledWith('test');
            expect(mockAlphaVantageService.searchStocks).not.toHaveBeenCalled();
            expect(result).toEqual(mockCryptoResults);
        });

        it('should return cached search results if available', async () => {
            const mockResults = [{ symbol: 'BTC', type: 'crypto' }];
            cache.get.mockReturnValue(mockResults);

            const result = await marketDataService.searchAssets('test');

            expect(mockCoinMarketCapService.searchCrypto).not.toHaveBeenCalled();
            expect(mockAlphaVantageService.searchStocks).not.toHaveBeenCalled();
            expect(result).toEqual(mockResults);
        });

        it('should handle API errors gracefully', async () => {
            mockCoinMarketCapService.searchCrypto.mockRejectedValue(new Error('API Error'));
            cache.get.mockReturnValue(null);

            await expect(marketDataService.searchAssets('test'))
                .rejects.toThrow('Failed to search assets');
        });
    });

    describe('getMarketOverview', () => {
        it('should fetch overview from all services', async () => {
            const mockCryptoOverview = { totalMarketCap: 2000000000000 };
            const mockStockOverview = { totalVolume: 1000000000 };
            
            mockCoinMarketCapService.getMarketOverview.mockResolvedValue(mockCryptoOverview);
            mockAlphaVantageService.getMarketOverview.mockResolvedValue(mockStockOverview);
            cache.get.mockReturnValue(null);

            const result = await marketDataService.getMarketOverview();

            expect(mockCoinMarketCapService.getMarketOverview).toHaveBeenCalled();
            expect(mockAlphaVantageService.getMarketOverview).toHaveBeenCalled();
            expect(result).toEqual({
                crypto: mockCryptoOverview,
                stocks: mockStockOverview,
                lastUpdated: expect.any(Date)
            });
        });

        it('should return cached overview if available', async () => {
            const mockOverview = {
                crypto: { totalMarketCap: 2000000000000 },
                stocks: { totalVolume: 1000000000 },
                lastUpdated: new Date()
            };
            cache.get.mockReturnValue(mockOverview);

            const result = await marketDataService.getMarketOverview();

            expect(mockCoinMarketCapService.getMarketOverview).not.toHaveBeenCalled();
            expect(mockAlphaVantageService.getMarketOverview).not.toHaveBeenCalled();
            expect(result).toEqual(mockOverview);
        });

        it('should handle API errors gracefully', async () => {
            mockCoinMarketCapService.getMarketOverview.mockRejectedValue(new Error('API Error'));
            cache.get.mockReturnValue(null);

            await expect(marketDataService.getMarketOverview())
                .rejects.toThrow('Failed to fetch market overview');
        });
    });
});
