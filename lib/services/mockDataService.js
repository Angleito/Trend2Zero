/**
 * Mock Data Service
 *
 * This service provides mock data for when external API calls fail.
 * It's used as a fallback to ensure the application can still function
 * even when external services are unavailable.
 */
export class MockDataService {
    /**
     * Get mock cryptocurrency list
     */
    getMockCryptoList(page = 1, pageSize = 20) {
        const cryptos = [
            { symbol: 'BTC', name: 'Bitcoin', type: 'Cryptocurrency', description: 'bitcoin' },
            { symbol: 'ETH', name: 'Ethereum', type: 'Cryptocurrency', description: 'ethereum' },
            { symbol: 'BNB', name: 'Binance Coin', type: 'Cryptocurrency', description: 'binance-coin' },
            { symbol: 'SOL', name: 'Solana', type: 'Cryptocurrency', description: 'solana' },
            { symbol: 'XRP', name: 'XRP', type: 'Cryptocurrency', description: 'xrp' },
            { symbol: 'ADA', name: 'Cardano', type: 'Cryptocurrency', description: 'cardano' },
            { symbol: 'DOGE', name: 'Dogecoin', type: 'Cryptocurrency', description: 'dogecoin' },
            { symbol: 'DOT', name: 'Polkadot', type: 'Cryptocurrency', description: 'polkadot' },
            { symbol: 'AVAX', name: 'Avalanche', type: 'Cryptocurrency', description: 'avalanche' },
            { symbol: 'MATIC', name: 'Polygon', type: 'Cryptocurrency', description: 'polygon' }
        ];
        // Apply pagination
        const start = (page - 1) * pageSize;
        const end = Math.min(start + pageSize, cryptos.length);
        const paginatedResults = cryptos.slice(start, end);
        return {
            data: paginatedResults,
            pagination: {
                page,
                pageSize,
                totalItems: cryptos.length,
                totalPages: Math.ceil(cryptos.length / pageSize)
            }
        };
    }
    /**
     * Get mock stock list
     */
    getMockStockList(page = 1, pageSize = 20) {
        const stocks = [
            { symbol: 'AAPL', name: 'Apple Inc.', type: 'Stocks', description: 'United States' },
            { symbol: 'MSFT', name: 'Microsoft Corporation', type: 'Stocks', description: 'United States' },
            { symbol: 'GOOGL', name: 'Alphabet Inc.', type: 'Stocks', description: 'United States' },
            { symbol: 'AMZN', name: 'Amazon.com Inc.', type: 'Stocks', description: 'United States' },
            { symbol: 'META', name: 'Meta Platforms Inc.', type: 'Stocks', description: 'United States' },
            { symbol: 'TSLA', name: 'Tesla Inc.', type: 'Stocks', description: 'United States' },
            { symbol: 'NVDA', name: 'NVIDIA Corporation', type: 'Stocks', description: 'United States' },
            { symbol: 'JPM', name: 'JPMorgan Chase & Co.', type: 'Stocks', description: 'United States' },
            { symbol: 'V', name: 'Visa Inc.', type: 'Stocks', description: 'United States' },
            { symbol: 'JNJ', name: 'Johnson & Johnson', type: 'Stocks', description: 'United States' }
        ];
        // Apply pagination
        const start = (page - 1) * pageSize;
        const end = Math.min(start + pageSize, stocks.length);
        const paginatedResults = stocks.slice(start, end);
        return {
            data: paginatedResults,
            pagination: {
                page,
                pageSize,
                totalItems: stocks.length,
                totalPages: Math.ceil(stocks.length / pageSize)
            }
        };
    }
    /**
     * Get mock commodities list
     */
    getMockCommoditiesList(page = 1, pageSize = 20) {
        const commodities = [
            { symbol: 'XAU', name: 'Gold', type: 'Commodities', description: 'Precious metal' },
            { symbol: 'XAG', name: 'Silver', type: 'Commodities', description: 'Precious metal' },
            { symbol: 'XPT', name: 'Platinum', type: 'Commodities', description: 'Precious metal' },
            { symbol: 'XPD', name: 'Palladium', type: 'Commodities', description: 'Precious metal' },
            { symbol: 'BRENT', name: 'Brent Crude Oil', type: 'Commodities', description: 'Energy' },
            { symbol: 'WTI', name: 'WTI Crude Oil', type: 'Commodities', description: 'Energy' }
        ];
        // Apply pagination
        const start = (page - 1) * pageSize;
        const end = Math.min(start + pageSize, commodities.length);
        const paginatedResults = commodities.slice(start, end);
        return {
            data: paginatedResults,
            pagination: {
                page,
                pageSize,
                totalItems: commodities.length,
                totalPages: Math.ceil(commodities.length / pageSize)
            }
        };
    }
    /**
     * Get mock indices list
     */
    getMockIndicesList(page = 1, pageSize = 20) {
        const indices = [
            { symbol: 'SPX', name: 'S&P 500', type: 'Indices', description: 'US large-cap stocks' },
            { symbol: 'DJI', name: 'Dow Jones Industrial Average', type: 'Indices', description: 'US blue-chip stocks' },
            { symbol: 'IXIC', name: 'NASDAQ Composite', type: 'Indices', description: 'US technology stocks' },
            { symbol: 'RUT', name: 'Russell 2000', type: 'Indices', description: 'US small-cap stocks' },
            { symbol: 'FTSE', name: 'FTSE 100', type: 'Indices', description: 'UK large-cap stocks' },
            { symbol: 'DAX', name: 'DAX', type: 'Indices', description: 'German stocks' },
            { symbol: 'CAC', name: 'CAC 40', type: 'Indices', description: 'French stocks' },
            { symbol: 'N225', name: 'Nikkei 225', type: 'Indices', description: 'Japanese stocks' },
            { symbol: 'HSI', name: 'Hang Seng', type: 'Indices', description: 'Hong Kong stocks' },
            { symbol: 'SSEC', name: 'Shanghai Composite', type: 'Indices', description: 'Chinese stocks' }
        ];
        // Apply pagination
        const start = (page - 1) * pageSize;
        const end = Math.min(start + pageSize, indices.length);
        const paginatedResults = indices.slice(start, end);
        return {
            data: paginatedResults,
            pagination: {
                page,
                pageSize,
                totalItems: indices.length,
                totalPages: Math.ceil(indices.length / pageSize)
            }
        };
    }
    /**
     * Get mock asset price data
     */
    getMockAssetPrice(symbol) {
        // Use predefined base prices for known assets
        const basePrices = {
            'BTC': 50000,
            'ETH': 3000,
            'BNB': 500,
            'SOL': 150,
            'XRP': 1.20,
            'ADA': 2.50,
            'DOGE': 0.15,
            'DOT': 20,
            'MATIC': 1.50,
            'AVAX': 35,
            // Stock prices
            'AAPL': 175,
            'MSFT': 350,
            'GOOGL': 2800,
            'AMZN': 3500,
            'TSLA': 250,
            'META': 480,
            'NVDA': 880,
            'JPM': 180,
            'V': 270,
            'JNJ': 155,
            // Commodities
            'XAU': 2000, // Gold
            'XAG': 25, // Silver
            'XPT': 950, // Platinum
            'XPD': 1200, // Palladium
            'CL': 85, // Crude Oil
            'NG': 3.50 // Natural Gas
        };
        const basePrice = basePrices[symbol.toUpperCase()] || 100;
        // Reduce variation to max ±1% for more stability
        const changePercent = (Math.random() * 2) - 1;
        const change = basePrice * (changePercent / 100);
        const bitcoinPrice = basePrices['BTC'];
        const priceInBTC = basePrice / bitcoinPrice;
        return {
            symbol,
            price: basePrice,
            change,
            changePercent,
            priceInBTC,
            priceInUSD: basePrice,
            lastUpdated: new Date().toISOString()
        };
    }
    /**
     * Get mock historical data
     */
    getMockHistoricalData(symbol, days = 30) {
        const result = [];
        const today = new Date();
        const basePrices = {
            'BTC': 50000,
            'ETH': 3000,
            'AAPL': 175,
            'MSFT': 350,
            'XAU': 2000
        };
        let baseValue = basePrices[symbol.toUpperCase()] || 100;
        // Reduce daily variation to max ±0.5% for more stability
        const maxDailyVariation = 0.005;
        for (let i = days; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            const dailyVariation = baseValue * maxDailyVariation * (Math.random() * 2 - 1);
            const price = baseValue + dailyVariation;
            // Generate realistic OHLC data with tight spreads
            const spread = price * 0.001; // 0.1% spread
            const open = price * (1 - spread / 2 + Math.random() * spread);
            const high = Math.max(open, price) * (1 + Math.random() * (spread / 2));
            const low = Math.min(open, price) * (1 - Math.random() * (spread / 2));
            const close = price;
            // Generate realistic volume based on asset type
            const baseVolume = symbol.toUpperCase() === 'BTC' ? 1000000000 :
                symbol.toUpperCase() === 'ETH' ? 500000000 :
                    symbol.length === 4 ? 50000 : // Forex pairs
                        100000; // Stocks and others
            const volume = Math.round(baseVolume * (0.8 + Math.random() * 0.4));
            result.push({
                timestamp: date.getTime(),
                value: close,
                date: new Date(date),
                price: parseFloat(price.toFixed(2)),
                open: parseFloat(open.toFixed(2)),
                high: parseFloat(high.toFixed(2)),
                low: parseFloat(low.toFixed(2)),
                close: parseFloat(close.toFixed(2)),
                volume
            });
            // Update base value with smaller drift for next day
            baseValue = close * (1 + (Math.random() * 0.002 - 0.001)); // ±0.1% drift
        }
        return result;
    }
}
export default MockDataService;
