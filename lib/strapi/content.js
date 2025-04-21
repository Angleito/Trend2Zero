import { strapiClient } from './client';
// Fetch methods with original names
export async function getBlogPosts(params = {}) {
    const response = await strapiClient.getBlogPosts(params);
    const processedData = response.data.map(item => {
        const processedItem = {
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
        const processedItem = {
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
    const processedOverview = {
        ...response.data.attributes,
        data: response.data,
        indices: response.data.attributes.indices.map((index) => ({
            Name: index.Name,
            Value: index.Value,
            Change: index.Change,
            name: index.Name,
            value: index.Value,
            change: index.Change
        })),
        topMovers: response.data.attributes.topMovers.map((mover) => ({
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
export async function getBlogPostBySlug(slug) {
    const { data } = await getBlogPosts({
        filters: { slug: { $eq: slug } },
        pagination: { page: 1, pageSize: 1 }
    });
    return data[0];
}
export async function getAssetBySymbol(symbol) {
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
