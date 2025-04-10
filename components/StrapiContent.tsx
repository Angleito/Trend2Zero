import React from 'react';
import { BlocksRenderer } from '@strapi/blocks-react-renderer';
import { getBlogPosts, getBlogPostBySlug } from '../lib/strapi/content';

interface StrapiContentProps {
  slug?: string;
}

const StrapiContent: React.FC<StrapiContentProps> = ({ slug }) => {
  const [content, setContent] = React.useState<any>(null);
  const [loading, setLoading] = React.useState<boolean>(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const fetchContent = async () => {
      try {
        setLoading(true);
        
        let data;
        if (slug) {
          // Fetch a specific post by slug
          const response = await getBlogPostBySlug(slug);
          data = response.data[0]?.attributes;
        } else {
          // Fetch all posts
          const response = await getBlogPosts();
          data = response.data.map(item => ({
            id: item.id,
            ...item.attributes
          }));
        }
        
        setContent(data);
        setError(null);
      } catch (err) {
        console.error('Error fetching content from Strapi:', err);
        setError('Failed to load content. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchContent();
  }, [slug]);

  if (loading) {
    return <div className="loading">Loading content...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  if (!content) {
    return <div className="not-found">Content not found</div>;
  }

  // Display a single blog post
  if (slug && content) {
    return (
      <article className="blog-post">
        <h1>{content.title}</h1>
        <div className="metadata">
          <span>Published: {new Date(content.publishedAt).toLocaleDateString()}</span>
        </div>
        
        {/* Render rich text content if using Strapi's blocks */}
        {content.content && typeof content.content === 'object' && (
          <BlocksRenderer content={content.content} />
        )}
        
        {/* Fallback for plain text content */}
        {content.content && typeof content.content === 'string' && (
          <div dangerouslySetInnerHTML={{ __html: content.content }} />
        )}
      </article>
    );
  }

  // Display a list of blog posts
  return (
    <div className="blog-posts">
      <h1>Blog Posts</h1>
      {Array.isArray(content) && content.length > 0 ? (
        <ul>
          {content.map((post: any) => (
            <li key={post.id}>
              <h2>{post.title}</h2>
              <p>Published: {new Date(post.publishedAt).toLocaleDateString()}</p>
              <a href={`/blog/${post.slug}`}>Read more</a>
            </li>
          ))}
        </ul>
      ) : (
        <p>No posts found</p>
      )}
    </div>
  );
};

export default StrapiContent;
