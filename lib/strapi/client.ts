import { Strapi } from '@strapi/sdk';

// Initialize Strapi client
const strapiClient = new Strapi({
  url: process.env.STRAPI_API_URL || 'http://localhost:1337',
  prefix: '/api',
  axiosOptions: {},
});

// Add authentication if needed
export const authenticateStrapi = async () => {
  try {
    if (process.env.STRAPI_API_TOKEN) {
      strapiClient.setToken(process.env.STRAPI_API_TOKEN);
      return true;
    }
    
    // If you're using username/password authentication instead of API token
    if (process.env.STRAPI_USERNAME && process.env.STRAPI_PASSWORD) {
      const { jwt } = await strapiClient.auth.local.login({
        identifier: process.env.STRAPI_USERNAME,
        password: process.env.STRAPI_PASSWORD,
      });
      
      strapiClient.setToken(jwt);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Failed to authenticate with Strapi:', error);
    return false;
  }
};

// Generic function to fetch content from Strapi
export const fetchContent = async <T>(
  contentType: string,
  params: Record<string, any> = {}
): Promise<T> => {
  try {
    // Authenticate if needed
    await authenticateStrapi();
    
    // Fetch data from Strapi
    const response = await strapiClient.find(contentType, {
      ...params,
    });
    
    return response.data as T;
  } catch (error) {
    console.error(`Error fetching ${contentType} from Strapi:`, error);
    throw error;
  }
};

// Export the client for direct use
export default strapiClient;
