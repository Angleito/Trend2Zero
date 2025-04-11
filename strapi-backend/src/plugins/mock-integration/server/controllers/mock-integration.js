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
      // Import the mock service dynamically
      const { default: MockIntegrationService } = await import('../../../../../../lib/services/mockIntegrationService');
      const mockService = new MockIntegrationService('strapi');
      
      // Get mock data
      const cryptoAssets = await mockService.getMockAssetList('crypto', 1, 10);
      const stockAssets = await mockService.getMockAssetList('stock', 1, 10);
      
      // Create assets in Strapi
      const results = {
        created: [],
        errors: []
      };
      
      // Process crypto assets
      for (const asset of cryptoAssets.data) {
        try {
          // Check if asset already exists
          const existingAsset = await strapi.entityService.findMany('api::asset.asset', {
            filters: { symbol: asset.symbol }
          });
          
          if (existingAsset && existingAsset.length > 0) {
            // Update existing asset
            const updated = await strapi.entityService.update('api::asset.asset', existingAsset[0].id, {
              data: {
                name: asset.name,
                symbol: asset.symbol,
                assetType: asset.type === 'Cryptocurrency' ? 'crypto' : 'stock',
                description: asset.description,
                currentPrice: Math.random() * 1000,
                priceChange: Math.random() * 100 * (Math.random() > 0.5 ? 1 : -1),
                priceChangePercent: Math.random() * 10 * (Math.random() > 0.5 ? 1 : -1),
                marketCap: Math.floor(Math.random() * 1000000000),
                volume24h: Math.floor(Math.random() * 100000000),
                lastUpdated: new Date()
              }
            });
            
            results.created.push({
              id: updated.id,
              name: updated.name,
              symbol: updated.symbol,
              action: 'updated'
            });
          } else {
            // Create new asset
            const created = await strapi.entityService.create('api::asset.asset', {
              data: {
                name: asset.name,
                symbol: asset.symbol,
                assetType: asset.type === 'Cryptocurrency' ? 'crypto' : 'stock',
                description: asset.description,
                currentPrice: Math.random() * 1000,
                priceChange: Math.random() * 100 * (Math.random() > 0.5 ? 1 : -1),
                priceChangePercent: Math.random() * 10 * (Math.random() > 0.5 ? 1 : -1),
                marketCap: Math.floor(Math.random() * 1000000000),
                volume24h: Math.floor(Math.random() * 100000000),
                lastUpdated: new Date(),
                publishedAt: new Date()
              }
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
      
      // Process stock assets
      for (const asset of stockAssets.data) {
        try {
          // Check if asset already exists
          const existingAsset = await strapi.entityService.findMany('api::asset.asset', {
            filters: { symbol: asset.symbol }
          });
          
          if (existingAsset && existingAsset.length > 0) {
            // Update existing asset
            const updated = await strapi.entityService.update('api::asset.asset', existingAsset[0].id, {
              data: {
                name: asset.name,
                symbol: asset.symbol,
                assetType: 'stock',
                description: asset.description,
                currentPrice: Math.random() * 1000,
                priceChange: Math.random() * 100 * (Math.random() > 0.5 ? 1 : -1),
                priceChangePercent: Math.random() * 10 * (Math.random() > 0.5 ? 1 : -1),
                marketCap: Math.floor(Math.random() * 1000000000),
                volume24h: Math.floor(Math.random() * 100000000),
                lastUpdated: new Date()
              }
            });
            
            results.created.push({
              id: updated.id,
              name: updated.name,
              symbol: updated.symbol,
              action: 'updated'
            });
          } else {
            // Create new asset
            const created = await strapi.entityService.create('api::asset.asset', {
              data: {
                name: asset.name,
                symbol: asset.symbol,
                assetType: 'stock',
                description: asset.description,
                currentPrice: Math.random() * 1000,
                priceChange: Math.random() * 100 * (Math.random() > 0.5 ? 1 : -1),
                priceChangePercent: Math.random() * 10 * (Math.random() > 0.5 ? 1 : -1),
                marketCap: Math.floor(Math.random() * 1000000000),
                volume24h: Math.floor(Math.random() * 100000000),
                lastUpdated: new Date(),
                publishedAt: new Date()
              }
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
      
      // Create historical data for BTC
      try {
        const btcAsset = await strapi.entityService.findMany('api::asset.asset', {
          filters: { symbol: 'BTC' }
        });
        
        if (btcAsset && btcAsset.length > 0) {
          const historicalData = await mockService.getMockHistoricalData('BTC', 30);
          
          for (const dataPoint of historicalData) {
            await strapi.entityService.create('api::historical-data.historical-data', {
              data: {
                date: new Date(dataPoint.date),
                open: dataPoint.open,
                high: dataPoint.high,
                low: dataPoint.low,
                close: dataPoint.close,
                volume: dataPoint.volume,
                asset: btcAsset[0].id
              }
            });
          }
          
          results.created.push({
            message: `Created ${historicalData.length} historical data points for BTC`
          });
        }
      } catch (error) {
        results.errors.push({
          message: 'Error creating historical data for BTC',
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
