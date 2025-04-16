import MarketDataService from '../../lib/services/marketDataService.ts';

const marketService = new MarketDataService();

export default async function handler(req, res) {
  const { type, symbol, query, category, limit } = req.query;

  try {
    switch (type) {
      case 'popular': {
        const data = await marketService.listAvailableAssets({ pageSize: limit ? parseInt(limit) : 10 });
        return res.status(200).json({ data });
      }
      case 'search': {
        const data = await marketService.listAvailableAssets({ keywords: query, category, pageSize: limit ? parseInt(limit) : 10 });
        return res.status(200).json({ data });
      }
      case 'price': {
        const data = await marketService.getAssetPrice(symbol);
        return res.status(200).json({ data });
      }
      case 'historical': {
        const data = await marketService.getHistoricalData(symbol, limit ? parseInt(limit) : 30);
        return res.status(200).json({ data });
      }
      default: {
        const data = await marketService.listAvailableAssets({ category: type, pageSize: limit ? parseInt(limit) : 10 });
        return res.status(200).json({ data });
      }
    }
  } catch (error) {
    return res.status(500).json({ error: error.message || 'Failed to fetch market data' });
  }
}
