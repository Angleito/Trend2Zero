import axios from 'axios';
import { getCachedData } from '../cache';
const METAL_SYMBOLS = ['XAU', 'XAG', 'XPT', 'XPD'];
const metalNames = {
    XAU: 'Gold',
    XAG: 'Silver',
    XPT: 'Platinum',
    XPD: 'Palladium',
};
class MetalPriceService {
    constructor() {
        this.apiKey = process.env.METAL_PRICE_API_KEY;
        this.baseURL = 'https://api.metalpriceapi.com/v1';
    }
    async getMetalPrice(symbol) {
        if (!this.apiKey) {
            console.error('[MetalPriceAPI] API key is not configured.');
            return null;
        }
        if (!METAL_SYMBOLS.includes(symbol)) {
            console.warn(`[MetalPriceAPI] Unsupported metal symbol: ${symbol}`);
            return null;
        }
        const cacheKey = `metalprice_latest_${symbol}`;
        const cacheTTL = 6 * 60 * 60;
        return getCachedData(cacheKey, async () => {
            try {
                console.log(`[MetalPriceAPI] Fetching latest price for ${symbol}`);
                const currenciesToFetch = METAL_SYMBOLS.join(',');
                const response = await axios.get(`${this.baseURL}/latest`, {
                    params: {
                        api_key: this.apiKey,
                        base: 'USD',
                        currencies: currenciesToFetch,
                    },
                    timeout: 10000,
                });
                if (!response.data || !response.data.success || !response.data.rates) {
                    console.error('[MetalPriceAPI] Invalid API response structure:', response.data);
                    return null;
                }
                const rates = response.data.rates;
                const rateKey = `USD${symbol}`;
                if (!(rateKey in rates)) {
                    console.warn(`[MetalPriceAPI] Rate for ${symbol} not found in response.`);
                    return null;
                }
                const price = rates[rateKey];
                const timestamp = response.data.timestamp;
                const assetPrice = {
                    id: symbol,
                    symbol: symbol,
                    name: metalNames[symbol] || symbol,
                    type: 'commodity',
                    price: price,
                    change: 0,
                    changePercent: 0,
                    priceInUSD: price,
                    lastUpdated: new Date(timestamp * 1000).toISOString(),
                };
                console.log(`[MetalPriceAPI] Successfully fetched price for ${symbol}: $${assetPrice.price}`);
                return assetPrice;
            }
            catch (error) {
                if (axios.isAxiosError(error)) {
                    console.error(`[MetalPriceAPI] API request error for ${symbol}:`, {
                        status: error.response?.status,
                        data: error.response?.data,
                        code: error.code,
                        message: error.message,
                    });
                }
                else {
                    console.error(`[MetalPriceAPI] Unexpected error fetching ${symbol}:`, error);
                }
                return null;
            }
        }, cacheTTL);
    }
}
const metalPriceService = new MetalPriceService();
export default metalPriceService;
