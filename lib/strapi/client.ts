import axios from 'axios';

// Strapi API configuration
const STRAPI_API_URL = process.env.STRAPI_API_URL || 'http://localhost:1337';
const STRAPI_API_TOKEN = process.env.STRAPI_API_TOKEN;
const STRAPI_USERNAME = process.env.STRAPI_USERNAME;
const STRAPI_PASSWORD = process.env.STRAPI_PASSWORD;

// Create axios instance for Strapi
const strapiAxios = axios.create({
  baseURL: `${STRAPI_API_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add authentication if needed
export const authenticateStrapi = async () => {
  try {
    if (STRAPI_API_TOKEN) {
      strapiAxios.defaults.headers.common['Authorization'] = `Bearer ${STRAPI_API_TOKEN}`;
      return true;
    }

    // If you're using username/password authentication instead of API token
    if (STRAPI_USERNAME && STRAPI_PASSWORD) {
      const response = await strapiAxios.post('/auth/local', {
        identifier: STRAPI_USERNAME,
        password: STRAPI_PASSWORD,
      });

      const { jwt } = response.data;
      strapiAxios.defaults.headers.common['Authorization'] = `Bearer ${jwt}`;
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
    if (!strapiAxios.defaults.headers.common['Authorization']) {
      await authenticateStrapi();
    }

    // Fetch data from Strapi
    const response = await strapiAxios.get(`/${contentType}`, {
      params,
    });

    return response.data as T;
  } catch (error) {
    console.error(`Error fetching ${contentType} from Strapi:`, error);
    throw error;
  }
};

// Export the axios instance for direct use
export default strapiAxios;
