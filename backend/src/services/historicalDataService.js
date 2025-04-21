// backend/src/services/historicalDataService.js
const HistoricalData = require('../models/historicalDataModel');
const SecureMarketDataService = require('@rootLibServices/secureMarketDataService'); // Updated import path
const logger = require('../utils/logger');

class HistoricalDataService {
  static async saveCurrentMarketData() {
    try {
      // Fetch assets from different categories
      const cryptoAssets = await SecureMarketDataService.getAssetsByType('Crypto', 20);
      const stockAssets = await SecureMarketDataService.getAssetsByType('Stock', 20);

      const historicalEntries = [];

      // Process Crypto Assets
      for (const asset of cryptoAssets) {
        try {
          const priceData = await SecureMarketDataService.getAssetPrice(asset.symbol);

          if (priceData) {
            const historicalEntry = new HistoricalData({
              symbol: asset.symbol,
              price: priceData.price,
              open: priceData.open || priceData.price,
              high: priceData.high || priceData.price,
              low: priceData.low || priceData.price,
              volume: priceData.volume || 0,
              category: 'Crypto'
            });

            historicalEntries.push(historicalEntry);
          }
        } catch (assetError) {
          logger.error(`Error processing crypto asset ${asset.symbol}:`, assetError);
        }
      }

      // Process Stock Assets
      for (const asset of stockAssets) {
        try {
          const priceData = await SecureMarketDataService.getAssetPrice(asset.symbol);

          if (priceData) {
            const historicalEntry = new HistoricalData({
              symbol: asset.symbol,
              price: priceData.price,
              open: priceData.open || priceData.price,
              high: priceData.high || priceData.price,
              low: priceData.low || priceData.price,
              volume: priceData.volume || 0,
              category: 'Stock'
            });

            historicalEntries.push(historicalEntry);
          }
        } catch (assetError) {
          logger.error(`Error processing stock asset ${asset.symbol}:`, assetError);
        }
      }

      // Bulk save historical entries
      if (historicalEntries.length > 0) {
        await HistoricalData.insertMany(historicalEntries);
        logger.info(`Saved ${historicalEntries.length} historical data entries`);
      }

      return historicalEntries;
    } catch (error) {
      logger.error('Error saving current market data:', error);
      throw error;
    }
  }

  // Method to get historical data for a specific symbol
  static async getHistoricalData(symbol, days = 30) {
    try {
      const endDate = new Date();
      const startDate = new Date(endDate.getTime() - days * 24 * 60 * 60 * 1000);

      return await HistoricalData.find({
        symbol: symbol.toUpperCase(),
        date: { $gte: startDate, $lte: endDate }
      }).sort({ date: 1 });
    } catch (error) {
      logger.error(`Error fetching historical data for ${symbol}:`, error);
      throw error;
    }
  }

  // Method to get historical data by category
  static async getHistoricalDataByCategory(category, days = 30) {
    try {
      const endDate = new Date();
      const startDate = new Date(endDate.getTime() - days * 24 * 60 * 60 * 1000);

      return await HistoricalData.find({
        category: category.charAt(0).toUpperCase() + category.slice(1).toLowerCase(),
        date: { $gte: startDate, $lte: endDate }
      }).sort({ date: 1 });
    } catch (error) {
      logger.error(`Error fetching historical data for category ${category}:`, error);
      throw error;
    }
  }
}

module.exports = HistoricalDataService;