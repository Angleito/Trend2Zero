import { NextRequest, NextResponse } from 'next/server';
import MockIntegrationService from '../../../lib/services/mockIntegrationService';

/**
 * Mock Integration API
 * 
 * This API provides mock data for testing in Vercel and Strapi environments.
 * It's designed to be used during development and testing when real APIs are unavailable.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const endpoint = searchParams.get('endpoint');
  const symbol = searchParams.get('symbol');
  const days = searchParams.get('days') ? parseInt(searchParams.get('days') as string) : 30;
  const page = searchParams.get('page') ? parseInt(searchParams.get('page') as string) : 1;
  const pageSize = searchParams.get('pageSize') ? parseInt(searchParams.get('pageSize') as string) : 20;
  const environment = searchParams.get('environment') as 'vercel' | 'strapi' | 'development' || undefined;
  
  // Create mock integration service
  const mockService = new MockIntegrationService(environment);
  
  // Validate endpoint
  if (!endpoint) {
    return NextResponse.json({
      error: 'Endpoint is required',
      availableEndpoints: ['crypto', 'stock', 'commodity', 'index', 'asset', 'historical', 'test-connections', 'environment-config']
    }, { status: 400 });
  }
  
  try {
    let responseData;
    
    switch (endpoint) {
      case 'crypto':
        responseData = await mockService.getMockAssetList('crypto', page, pageSize);
        break;
      
      case 'stock':
        responseData = await mockService.getMockAssetList('stock', page, pageSize);
        break;
      
      case 'commodity':
        responseData = await mockService.getMockAssetList('commodity', page, pageSize);
        break;
      
      case 'index':
        responseData = await mockService.getMockAssetList('index', page, pageSize);
        break;
      
      case 'asset':
        if (!symbol) {
          return NextResponse.json({
            error: 'Symbol is required for asset endpoint'
          }, { status: 400 });
        }
        responseData = await mockService.getMockCryptoData(symbol);
        break;
      
      case 'historical':
        if (!symbol) {
          return NextResponse.json({
            error: 'Symbol is required for historical endpoint'
          }, { status: 400 });
        }
        responseData = await mockService.getMockHistoricalData(symbol, days);
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
        return NextResponse.json({
          error: 'Invalid endpoint',
          availableEndpoints: ['crypto', 'stock', 'commodity', 'index', 'asset', 'historical', 'test-connections', 'environment-config']
        }, { status: 400 });
    }
    
    return NextResponse.json({
      data: responseData,
      meta: {
        source: 'mock-integration',
        environment: mockService.getEnvironment(),
        timestamp: new Date().toISOString()
      }
    });
  } catch (error: any) {
    console.error('Error in mock integration API:', error);
    return NextResponse.json({
      error: error.message || 'An error occurred',
      meta: {
        source: 'mock-integration',
        environment: mockService.getEnvironment(),
        timestamp: new Date().toISOString()
      }
    }, { status: 500 });
  }
}

// Allow dynamic rendering
export const dynamic = 'auto';
