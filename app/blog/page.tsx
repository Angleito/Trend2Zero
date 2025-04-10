'use client';

import React from 'react';
import StickyHeader from '../../components/StickyHeader';
import Link from 'next/link';
import StrapiContent from '../../components/StrapiContent';
import { BlogPost } from '../../lib/strapi/content';

export default function BlogPage() {
  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      <StickyHeader />

      <main className="flex-grow p-6">
        <div className="container mx-auto max-w-4xl">
          <h1 className="text-3xl font-bold mb-8 text-center">Blog</h1>

          <StrapiContent>
            {(posts: BlogPost[]) => (
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
                    <p className="text-gray-300 mb-4">{post.excerpt || 'No excerpt available'}</p>
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
          </StrapiContent>
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
