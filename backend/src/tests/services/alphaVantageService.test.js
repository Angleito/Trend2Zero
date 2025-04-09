const axios = require('axios');
const AlphaVantageService = require('../../services/alphaVantageService');
const AppError = require('../../utils/appError');
const cache = require('../../utils/cache');

jest.mock('axios');
jest.mock('../../utils/cache');

describe('AlphaVantageService', () => {
    let alphaVantageService;
    const mockApiKey = 'test-api-key';

    beforeEach(() => {
        jest.clearAllMocks();
        alphaVantageService = new AlphaVantageService(mockApiKey);
    });

    describe('searchStocks', () => {
        it('should search and return stocks matching the keywords', async () => {
            const mockResponse = {
                data: {
                    bestMatches: [
                        {
                            '1. symbol': 'AAPL',
                            '2. name': 'Apple Inc',
                            '3. type': 'Equity',
                            '4. region': 'United States',
                            '8. currency': 'USD'
                        },
                        {
                            '1. symbol': 'AAPL.ARG',
                            '2. name': 'Apple Inc',
                            '3. type': 'Equity',
                            '4. region': 'Argentina',
                            '8. currency': 'ARS'
                        }
                    ]
                }
            };
            axios.get.mockResolvedValue(mockResponse);
            cache.get.mockReturnValue(null);

            const result = await alphaVantageService.searchStocks('apple');

            expect(axios.get).toHaveBeenCalledWith(
                'https://www.alphavantage.co/query',
                {
                    params: {
                        function: 'SYMBOL_SEARCH',
                        keywords: 'apple',
                        apikey: mockApiKey
                    }
                }
            );
            expect(result[0].symbol).toBe('AAPL');
            expect(result[0].name).toBe('Apple Inc');
            expect(result[0].type).toBe('Equity');
            expect(result[0].region).toBe('United States');
            expect(result[0].currency).toBe('USD');
        });

        it('should return cached data if available', async () => {
            const mockData = [
                {
                    symbol: 'AAPL',
                    name: 'Apple Inc',
                    type: 'Equity',
                    region: 'United States',
                    currency: 'USD'
                }
            ];
            cache.get.mockReturnValue(mockData);

            const result = await alphaVantageService.searchStocks('apple');

            expect(axios.get).not.toHaveBeenCalled();
            expect(result).toEqual(mockData);
        });

        it('should throw an AppError if the API call fails', async () => {
            axios.get.mockRejectedValue(new Error('API Error'));
            cache.get.mockReturnValue(null);

            await expect(alphaVantageService.searchStocks('apple')).rejects.toThrow('Failed to search stocks');
        });
    });

    describe('getStockQuote', () => {
        it('should fetch and return stock quote data', async () => {
            const mockResponse = {
                data: {
                    'Global Quote': {
                        '01. symbol': 'AAPL',
                        '02. open': '149.00',
                        '03. high': '151.00',
                        '04. low': '148.00',
                        '05. price': '150.00',
                        '06. volume': '100000000',
                        '07. latest trading day': '2023-01-01',
                        '08. previous close': '148.50',
                        '09. change': '1.50',
                        '10. change percent': '1.01%'
                    }
                }
            };
            axios.get.mockResolvedValue(mockResponse);
            cache.get.mockReturnValue(null);

            const result = await alphaVantageService.getStockQuote('AAPL');

            expect(axios.get).toHaveBeenCalledWith(
                'https://www.alphavantage.co/query',
                {
                    params: {
                        function: 'GLOBAL_QUOTE',
                        symbol: 'AAPL',
                        apikey: mockApiKey
                    }
                }
            );
            expect(result).toEqual({
                symbol: 'AAPL',
                price: 150,
                volume: 100000000,
                latestTradingDay: '2023-01-01',
                change: 1.5,
                changePercent: 1.01
            });
        });

        it('should return cached data if available', async () => {
            const mockData = {
                symbol: 'AAPL',
                price: 150,
                volume: 100000000,
                latestTradingDay: '2023-01-01',
                change: 1.5,
                changePercent: 1.01
            };
            cache.get.mockReturnValue(mockData);

            const result = await alphaVantageService.getStockQuote('AAPL');

            expect(axios.get).not.toHaveBeenCalled();
            expect(result).toEqual(mockData);
        });

        it('should throw an AppError if the API call fails', async () => {
            axios.get.mockRejectedValue(new Error('API Error'));
            cache.get.mockReturnValue(null);

            await expect(alphaVantageService.getStockQuote('AAPL')).rejects.toThrow('Failed to fetch quote for stock: AAPL');
        });
    });

    describe('getHistoricalData', () => {
        it('should fetch and return historical stock data', async () => {
            const mockResponse = {
                data: {
                    'Time Series (Daily)': {
                        '2023-01-01': {
                            '1. open': '149.00',
                            '2. high': '151.00',
                            '3. low': '148.00',
                            '4. close': '150.00',
                            '5. volume': '100000000'
                        },
                        '2023-01-02': {
                            '1. open': '150.00',
                            '2. high': '152.00',
                            '3. low': '149.00',
                            '4. close': '151.00',
                            '5. volume': '95000000'
                        }
                    }
                }
            };
            axios.get.mockResolvedValue(mockResponse);
            cache.get.mockReturnValue(null);

            const result = await alphaVantageService.getHistoricalData('AAPL');

            expect(axios.get).toHaveBeenCalledWith(
                'https://www.alphavantage.co/query',
                {
                    params: {
                        function: 'TIME_SERIES_DAILY',
                        symbol: 'AAPL',
                        outputsize: 'compact',
                        apikey: mockApiKey
                    }
                }
            );
            expect(result).toEqual([
                {
                    date: '2023-01-01',
                    open: 149,
                    high: 151,
                    low: 148,
                    close: 150,
                    volume: 100000000
                },
                {
                    date: '2023-01-02',
                    open: 150,
                    high: 152,
                    low: 149,
                    close: 151,
                    volume: 95000000
                }
            ]);
        });

        it('should return cached data if available', async () => {
            const mockData = [
                {
                    date: '2023-01-01',
                    open: 149,
                    high: 151,
                    low: 148,
                    close: 150,
                    volume: 100000000
                }
            ];
            cache.get.mockReturnValue(mockData);

            const result = await alphaVantageService.getHistoricalData('AAPL');

            expect(axios.get).not.toHaveBeenCalled();
            expect(result).toEqual(mockData);
        });

        it('should throw an AppError if the API call fails', async () => {
            axios.get.mockRejectedValue(new Error('API Error'));
            cache.get.mockReturnValue(null);

            await expect(alphaVantageService.getHistoricalData('AAPL')).rejects.toThrow('Failed to fetch historical data for stock: AAPL');
        });
    });
});
