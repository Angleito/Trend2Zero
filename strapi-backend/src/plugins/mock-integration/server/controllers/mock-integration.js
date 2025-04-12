'use strict';

/**
 * Mock Integration controller
 */

const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('plugin::mock-integration.mock-integration', ({ strapi }) => ({
  async getMockData(ctx) {
    try {
      const { endpoint, symbol, days, page, pageSize } = ctx.query;
      
      // Import the mock service dynamically
      // Note: In a real implementation, you would create a proper Strapi service
      // This is a simplified approach for demonstration purposes
      const { default: MockIntegrationService } = await import('../../../../../../lib/services/mockIntegrationService');
      const mockService = new MockIntegrationService('strapi');
      
      // Validate endpoint
      if (!endpoint) {
        return ctx.badRequest('Endpoint is required', {
          availableEndpoints: ['crypto', 'stock', 'commodity', 'index', 'asset', 'historical', 'test-connections', 'environment-config']
        });
      }
      
      let responseData;
      
      switch (endpoint) {
        case 'crypto':
          responseData = await mockService.getMockAssetList('crypto', parseInt(page) || 1, parseInt(pageSize) || 20);
          break;
        
        case 'stock':
          responseData = await mockService.getMockAssetList('stock', parseInt(page) || 1, parseInt(pageSize) || 20);
          break;
        
        case 'commodity':
          responseData = await mockService.getMockAssetList('commodity', parseInt(page) || 1, parseInt(pageSize) || 20);
          break;
        
        case 'index':
          responseData = await mockService.getMockAssetList('index', parseInt(page) || 1, parseInt(pageSize) || 20);
          break;
        
        case 'asset':
          if (!symbol) {
            return ctx.badRequest('Symbol is required for asset endpoint');
          }
          responseData = await mockService.getMockCryptoData(symbol);
          break;
        
        case 'historical':
          if (!symbol) {
            return ctx.badRequest('Symbol is required for historical endpoint');
          }
          responseData = await mockService.getMockHistoricalData(symbol, parseInt(days) || 30);
          break;
        
        case 'test-connections':
          responseData = await mockService.testConnections();
          break;
        
        case 'environment-config':
          responseData = {
            environment: mockService.getEnvironment(),
            config: mockService.getEnvironmentConfig()
          };
          break;
        
        default:
          return ctx.badRequest('Invalid endpoint', {
            availableEndpoints: ['crypto', 'stock', 'commodity', 'index', 'asset', 'historical', 'test-connections', 'environment-config']
          });
      }
      
      return {
        data: responseData,
        meta: {
          source: 'mock-integration',
          environment: mockService.getEnvironment(),
          timestamp: new Date().toISOString()
        }
      };
    } catch (error) {
      strapi.log.error('Error in mock integration plugin:', error);
      return ctx.internalServerError('An error occurred', {
        error: error.message
      });
    }
  },
  
  async seedMockData(ctx) {
    try {
      const { default: MockIntegrationService } = await import('../../../../../../lib/services/mockIntegrationService');
      const mockService = new MockIntegrationService('strapi');
      
      // Get mock data
      const cryptoAssets = await mockService.getMockAssetList('crypto', 1, 10);
      const stockAssets = await mockService.getMockAssetList('stock', 1, 10);
      
      const results = {
        created: [],
        errors: []
      };

      // Base prices for realistic data
      const basePrices = {
        'BTC': 50000, 'ETH': 3000, 'BNB': 500, 'SOL': 150, 'XRP': 1.20,
        'AAPL': 175, 'MSFT': 350, 'GOOGL': 2800, 'AMZN': 3500, 'TSLA': 250
      };
      
      // Process crypto assets
      for (const asset of cryptoAssets.data) {
        try {
          const basePrice = basePrices[asset.symbol] || 100;
          const priceChange = basePrice * (Math.random() * 0.02 - 0.01); // ±1% change
          const currentPrice = basePrice + priceChange;
          const changePercent = (priceChange / basePrice) * 100;

          // Check if asset already exists
          const existingAsset = await strapi.entityService.findMany('api::asset.asset', {
            filters: { symbol: asset.symbol }
          });
          
          const assetData = {
            name: asset.name,
            symbol: asset.symbol,
            assetType: 'crypto',
            description: asset.description,
            currentPrice,
            priceChange,
            priceChangePercent: changePercent,
            marketCap: Math.floor(currentPrice * (asset.symbol === 'BTC' ? 19000000 : 1000000000)),
            volume24h: Math.floor(currentPrice * (asset.symbol === 'BTC' ? 500000 : 100000)),
            lastUpdated: new Date(),
            publishedAt: new Date()
          };
          
          if (existingAsset && existingAsset.length > 0) {
            const updated = await strapi.entityService.update('api::asset.asset', existingAsset[0].id, {
              data: assetData
            });
            results.created.push({
              id: updated.id,
              name: updated.name,
              symbol: updated.symbol,
              action: 'updated'
            });
          } else {
            const created = await strapi.entityService.create('api::asset.asset', {
              data: assetData
            });
            results.created.push({
              id: created.id,
              name: created.name,
              symbol: created.symbol,
              action: 'created'
            });
          }
        } catch (error) {
          results.errors.push({
            symbol: asset.symbol,
            error: error.message
          });
        }
      }
      
      // Process stock assets with similar realistic price logic
      for (const asset of stockAssets.data) {
        try {
          const basePrice = basePrices[asset.symbol] || 100;
          const priceChange = basePrice * (Math.random() * 0.01 - 0.005); // ±0.5% change for stocks
          const currentPrice = basePrice + priceChange;
          const changePercent = (priceChange / basePrice) * 100;

          const existingAsset = await strapi.entityService.findMany('api::asset.asset', {
            filters: { symbol: asset.symbol }
          });
          
          const assetData = {
            name: asset.name,
            symbol: asset.symbol,
            assetType: 'stock',
            description: asset.description,
            currentPrice,
            priceChange,
            priceChangePercent: changePercent,
            marketCap: Math.floor(currentPrice * 1000000000),
            volume24h: Math.floor(currentPrice * 10000000),
            lastUpdated: new Date(),
            publishedAt: new Date()
          };

          if (existingAsset && existingAsset.length > 0) {
            const updated = await strapi.entityService.update('api::asset.asset', existingAsset[0].id, {
              data: assetData
            });
            results.created.push({
              id: updated.id,
              name: updated.name,
              symbol: updated.symbol,
              action: 'updated'
            });
          } else {
            const created = await strapi.entityService.create('api::asset.asset', {
              data: assetData
            });
            results.created.push({
              id: created.id,
              name: created.name,
              symbol: created.symbol,
              action: 'created'
            });
          }
        } catch (error) {
          results.errors.push({
            symbol: asset.symbol,
            error: error.message
          });
        }
      }
      
      // Create historical data for assets
      try {
        for (const symbol of Object.keys(basePrices)) {
          const asset = await strapi.entityService.findMany('api::asset.asset', {
            filters: { symbol }
          });
          
          if (asset && asset.length > 0) {
            const historicalData = await mockService.getMockHistoricalData(symbol, 30);
            
            for (const dataPoint of historicalData) {
              await strapi.entityService.create('api::historical-data.historical-data', {
                data: {
                  date: new Date(dataPoint.date),
                  open: dataPoint.open,
                  high: dataPoint.high,
                  low: dataPoint.low,
                  close: dataPoint.close,
                  volume: dataPoint.volume,
                  asset: asset[0].id
                }
              });
            }
            
            results.created.push({
              message: `Created ${historicalData.length} historical data points for ${symbol}`
            });
          }
        }
      } catch (error) {
        results.errors.push({
          message: 'Error creating historical data',
          error: error.message
        });
      }
      
      return {
        success: true,
        results
      };
    } catch (error) {
      strapi.log.error('Error seeding mock data:', error);
      return ctx.internalServerError('An error occurred while seeding mock data', {
        error: error.message
      });
    }
  }
}));
