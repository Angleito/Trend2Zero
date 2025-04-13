import { AssetPrice } from '../types';

class MetalPriceService {
  async getMetalPrice(symbol: string): Promise<AssetPrice | null> {
    try {
      // Placeholder implementation that returns null to simulate API failure
      console.warn(`Metal price fetch attempted for ${symbol} - returning null`);
      return null;
    } catch (error) {
      console.error('Metal price fetch error:', error);
      return null;
    }
  }
}

const metalPriceService = new MetalPriceService();
export default metalPriceService;