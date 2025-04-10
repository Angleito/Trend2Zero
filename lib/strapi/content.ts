import { 
  strapiClient, 
  BlogPost as StrapiClientBlogPost, 
  Asset as StrapiClientAsset, 
  MarketOverview as StrapiClientMarketOverview,
  StrapiResponse
} from './client';

// Maintain backwards compatibility with existing types
export interface BlogPost extends StrapiClientBlogPost {
  id?: number;
  data?: any;
  attributes?: {
    excerpt?: string;
    author?: string;
    category?: string;
  };
}

export interface Asset extends StrapiClientAsset {
  id?: number;
  data?: any;
  attributes?: StrapiClientAsset;
}

export interface MarketOverview extends StrapiClientMarketOverview {
  data?: any;
  indices: Array<{
    Name: string;
    Value: number;
    Change: number;
    name: string;
    value: number;
    change: number;
  }>;
  topMovers: Array<{
    Symbol: string;
    Name: string;
    Price: number;
    Change: number;
    ChangePercent: number;
    symbol: string;
    name: string;
    price: number;
    change: number;
    changePercent: number;
  }>;
}

// Fetch methods with original names
export async function getBlogPosts(params = {}) {
  const response = await strapiClient.getBlogPosts(params);
  const processedData = response.data.map(item => {
    const processedItem: BlogPost = {
      ...item.attributes,
      id: item.id,
      attributes: item.attributes,
      data: response,
      excerpt: item.attributes?.excerpt || 'No excerpt available',
      author: item.attributes?.author || 'Unknown',
      category: item.attributes?.category || 'Uncategorized'
    };
    return processedItem;
  });

  return {
    ...response,
    data: processedData
  };
}

export async function getAssets(params = {}) {
  const response = await strapiClient.getAssets(params);
  const processedData = response.data.map(item => {
    const processedItem: Asset = {
      ...item.attributes,
      id: item.id,
      attributes: item.attributes,
      data: response
    };
    return processedItem;
  });

  return {
    ...response,
    data: processedData
  };
}

export async function getMarketOverview(params = {}) {
  const response = await strapiClient.getMarketOverview(params);
  const processedOverview: MarketOverview = {
    ...response.data.attributes,
    data: response.data,
    indices: response.data.attributes.indices.map((index: any) => ({
      Name: index.Name,
      Value: index.Value,
      Change: index.Change,
      name: index.Name,
      value: index.Value,
      change: index.Change
    })),
    topMovers: response.data.attributes.topMovers.map((mover: any) => ({
      Symbol: mover.Symbol,
      Name: mover.Name,
      Price: mover.Price,
      Change: mover.Change,
      ChangePercent: mover.ChangePercent,
      symbol: mover.Symbol,
      name: mover.Name,
      price: mover.Price,
      change: mover.Change,
      changePercent: mover.ChangePercent
    }))
  };

  return processedOverview;
}

// Additional methods to maintain compatibility
export async function getBlogPostBySlug(slug: string) {
  const { data } = await getBlogPosts({ 
    filters: { slug: { $eq: slug } },
    pagination: { page: 1, pageSize: 1 }
  });
  return data[0];
}

export async function getAssetBySymbol(symbol: string) {
  const { data } = await getAssets({ 
    filters: { symbol: { $eq: symbol } },
    pagination: { page: 1, pageSize: 1 }
  });
  return data[0];
}

// Fetch methods with new names
export const fetchBlogPosts = getBlogPosts;
export const fetchAssets = getAssets;
export const fetchMarketOverview = getMarketOverview;

export async function fetchHistoricalData(params = {}) {
  return await strapiClient.getHistoricalData(params);
}
