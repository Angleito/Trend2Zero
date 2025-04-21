import axios from 'axios';
const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_URL || 'http://localhost:1337';
export const strapiClient = {
    async getBlogPosts(params = {}) {
        const response = await axios.get(`${STRAPI_URL}/api/blog-posts`, {
            params: {
                ...params,
                populate: '*'
            }
        });
        return response.data;
    },
    async getAssets(params = {}) {
        const response = await axios.get(`${STRAPI_URL}/api/assets`, {
            params: {
                ...params,
                populate: '*'
            }
        });
        return response.data;
    },
    async getMarketOverview(params = {}) {
        const response = await axios.get(`${STRAPI_URL}/api/market-overview`, {
            params: {
                ...params,
                populate: '*'
            }
        });
        return response.data;
    },
    async getHistoricalData(params = {}) {
        const response = await axios.get(`${STRAPI_URL}/api/historical-data-entries`, {
            params: {
                ...params,
                populate: '*'
            }
        });
        return response.data;
    }
};
