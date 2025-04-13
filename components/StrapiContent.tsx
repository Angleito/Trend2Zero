import { useState, useEffect, ReactNode } from 'react';
import { getBlogPosts, getBlogPostBySlug, BlogPost } from '../lib/strapi/content';

interface StrapiContentProps {
  slug?: string;
  children?: (posts: BlogPost[]) => ReactNode;
}

const StrapiContent = ({ slug, children }: StrapiContentProps) => {
  const [content, setContent] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchContent = async () => {
      try {
        setLoading(true);

        let data: BlogPost[];
        if (slug) {
          // Fetch a specific post by slug
          const response = await getBlogPostBySlug(slug);
          data = response.data.map((item: any) => ({
            id: item.id,
            ...item.attributes
          }));
        } else {
          // Fetch all posts
          const response = await getBlogPosts();
          data = response.data.map((item: any) => ({
            id: item.id,
            ...item.attributes,
            // Add default values for missing fields
            excerpt: item.attributes.excerpt || 'No excerpt available',
            author: item.attributes.author || 'Unknown',
            category: item.attributes.category || 'Uncategorized'
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

  if (!content || content.length === 0) {
    return <div className="not-found">No content found</div>;
  }

  // If children render prop is provided, use it
  if (children) {
    return <>{children(content)}</>;
  }

  // Default rendering for single post or list view
  if (slug && content.length > 0) {
    const post = content[0];
    return (
      <article className="blog-post">
        <h1>{post.title}</h1>
        <div className="metadata">
          <span>Published: {new Date(post.publishedAt).toLocaleDateString()}</span>
        </div>

        {/* Render content based on type */}
        {post.content && (
          <div className="content">
            {typeof post.content === 'object'
              ? <pre>{JSON.stringify(post.content, null, 2)}</pre>
              : <div dangerouslySetInnerHTML={{ __html: post.content }} />
            }
          </div>
        )}
      </article>
    );
  }

  // Default list view
  return (
    <div className="blog-posts">
      <h1>Blog Posts</h1>
      <ul>
        {content.map((post) => (
          <li key={post.id || post.slug}>
            <h2>{post.title}</h2>
            <p>Published: {new Date(post.publishedAt).toLocaleDateString()}</p>
            <a href={`/blog/${post.slug}`}>Read more</a>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default StrapiContent;
