import { fetchContent } from './client';

// Define types for your Strapi content
export interface StrapiResponse<T> {
  data: Array<{
    id: number;
    attributes: T;
  }>;
  meta: {
    pagination: {
      page: number;
      pageSize: number;
      pageCount: number;
      total: number;
    };
  };
}

// Example type for a blog post
export interface BlogPost {
  title: string;
  content: string;
  slug: string;
  publishedAt: string;
  createdAt: string;
  updatedAt: string;
  // Add other fields as needed
}

// Function to fetch blog posts
export const getBlogPosts = async (
  page = 1,
  pageSize = 10
): Promise<StrapiResponse<BlogPost>> => {
  return fetchContent<StrapiResponse<BlogPost>>('blog-posts', {
    pagination: {
      page,
      pageSize,
    },
    sort: ['publishedAt:desc'],
    populate: '*',
  });
};

// Function to fetch a single blog post by slug
export const getBlogPostBySlug = async (
  slug: string
): Promise<StrapiResponse<BlogPost>> => {
  return fetchContent<StrapiResponse<BlogPost>>('blog-posts', {
    filters: {
      slug: {
        $eq: slug,
      },
    },
    populate: '*',
  });
};

// Add more content type fetchers as needed
// For example, for market data, assets, etc.
export const getMarketData = async (): Promise<any> => {
  return fetchContent('market-data', {
    populate: '*',
  });
};

export const getAssets = async (): Promise<any> => {
  return fetchContent('assets', {
    populate: '*',
  });
};
