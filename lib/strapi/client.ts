import axios from 'axios';

const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_URL || 'http://localhost:1337';

export interface StrapiResponse<T> {
  data: Array<{
    id: number;
    attributes: T;
  }>;
  meta: {
    pagination?: {
      page: number;
      pageSize: number;
      pageCount: number;
      total: number;
    };
  };
}

export const strapiClient = {
  async getBlogPosts(params: Record<string, any> = {}) {
    const response = await axios.get(`${STRAPI_URL}/api/blog-posts`, { 
      params: {
        ...params,
        populate: '*'
      }
    });
    return response.data as StrapiResponse<BlogPost>;
  },

  async getAssets(params: Record<string, any> = {}) {
    const response = await axios.get(`${STRAPI_URL}/api/assets`, { 
      params: {
        ...params,
        populate: '*'
      }
    });
    return response.data as StrapiResponse<Asset>;
  },

  async getMarketOverview(params: Record<string, any> = {}) {
    const response = await axios.get(`${STRAPI_URL}/api/market-overview`, { 
      params: {
        ...params,
        populate: '*'
      }
    });
    return response.data;
  },

  async getHistoricalData(params: Record<string, any> = {}) {
    const response = await axios.get(`${STRAPI_URL}/api/historical-data-entries`, { 
      params: {
        ...params,
        populate: '*'
      }
    });
    return response.data as StrapiResponse<HistoricalData>;
  }
};

export interface BlogPost {
  title: string;
  content: string;
  slug: string;
  excerpt?: string;
  author?: string;
  category?: string;
  publishedAt: string;
}

export interface Asset {
  name: string;
  symbol: string;
  assetType: 'stock' | 'crypto' | 'forex' | 'commodity' | 'index';
  description?: string;
  currentPrice: number;
  priceChange?: number;
  priceChangePercent?: number;
  marketCap?: number;
  volume24h?: number;
  lastUpdated: string;
}

export interface HistoricalData {
  date: string;
  open?: number;
  high?: number;
  low?: number;
  close: number;
  volume?: number;
  asset?: {
    data: {
      id: number;
      attributes: Asset;
    };
  };
}

export interface MarketOverview {
  marketStatus: 'open' | 'closed' | 'pre-market' | 'after-hours';
  lastUpdated: string;
  marketSummary?: string;
  indices: Array<{
    Name: string;
    Value: number;
    Change: number;
  }>;
  topMovers: Array<{
    Symbol: string;
    Name: string;
    Price: number;
    Change: number;
    ChangePercent: number;
  }>;
}
