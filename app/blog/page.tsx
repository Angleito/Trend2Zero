'use client';

import { Suspense, useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { getAllPosts } from '../../lib/services/blogService';

// Dynamically import StickyHeader with no SSR
const StickyHeader = dynamic(() => import('../../components/StickyHeader'), {
  ssr: false,
});

interface BlogPost {
  slug: string;
  title: string;
  excerpt: string;
  publishedAt: string;
  category?: string;
  author: string;
}

export default function BlogPage() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchPosts() {
      try {
        const fetchedPosts = await getAllPosts();
        setPosts(fetchedPosts);
      } catch (err) {
        setError('Failed to load blog posts');
        console.error('Error loading blog posts:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchPosts();
  }, []);

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      <Suspense fallback={<div className="h-16 bg-transparent" />}>
        <StickyHeader />
      </Suspense>

      <main className="flex-grow p-6">
        <div className="container mx-auto max-w-4xl">
          <h1 className="text-3xl font-bold mb-8 text-center">Blog</h1>

          {loading && (
            <div className="text-center text-gray-400">Loading posts...</div>
          )}

          {error && (
            <div className="text-center text-red-500 mb-4">{error}</div>
          )}

          {!loading && !error && (
            <div className="grid gap-8">
              {posts.map(post => (
                <article 
                  key={post.slug} 
                  className="bg-gray-900 border border-gray-800 rounded-lg p-6 hover:shadow-lg transition-shadow"
                >
                  <div className="flex items-center mb-3 text-sm text-gray-400">
                    <span>{new Date(post.publishedAt).toLocaleDateString()}</span>
                    {post.category && (
                      <>
                        <span className="mx-2">•</span>
                        <span>{post.category}</span>
                      </>
                    )}
                  </div>
                  <h2 className="text-xl font-bold mb-3 text-[#FF9500]">{post.title}</h2>
                  <p className="text-gray-300 mb-4">{post.excerpt}</p>
                  <div className="flex justify-between items-center">
                    {post.author && (
                      <span className="text-sm text-gray-400">By {post.author}</span>
                    )}
                    <Link 
                      href={`/blog/${post.slug}`} 
                      className="text-[#FF9500] hover:underline"
                    >
                      Read more →
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </main>

      <footer className="bg-black border-t border-gray-800 py-6 px-4">
        <div className="container mx-auto max-w-4xl text-center text-gray-500">
          <p>&copy; {new Date().getFullYear()} Trend2Zero. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
