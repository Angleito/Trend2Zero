'use client';

import React from 'react';
import StickyHeader from '../../components/StickyHeader';
import Link from 'next/link';

// Mock blog post data
const blogPosts = [
  {
    id: 1,
    title: 'The Trend2Zero Phenomenon in Bitcoin Terms',
    excerpt: 'An exploration of how traditional assets perform when priced in Bitcoin over the long term.',
    date: 'October 15, 2023',
    author: 'Satoshi Nakamoto',
    category: 'Analysis'
  },
  {
    id: 2,
    title: 'Understanding Stock-to-Flow and Bitcoin Valuation',
    excerpt: 'A deep dive into the Stock-to-Flow model and how it applies to Bitcoin valuation.',
    date: 'September 28, 2023',
    author: 'Hal Finney',
    category: 'Education'
  },
  {
    id: 3,
    title: 'The Bitcoin Standard: Measuring Value in a Sound Money',
    excerpt: 'How using Bitcoin as a unit of account changes our perspective on value and investment.',
    date: 'August 12, 2023',
    author: 'Nick Szabo',
    category: 'Economics'
  },
  {
    id: 4,
    title: 'Gold vs. Bitcoin: A Historical Comparison',
    excerpt: 'Comparing the performance of gold and Bitcoin as stores of value over the past decade.',
    date: 'July 3, 2023',
    author: 'Adam Back',
    category: 'Comparison'
  },
  {
    id: 5,
    title: 'The Illusion of Gains: Stock Market Returns in Bitcoin Terms',
    excerpt: 'Why stock market gains may not be as impressive when measured in Bitcoin instead of dollars.',
    date: 'June 17, 2023',
    author: 'Satoshi Nakamoto',
    category: 'Markets'
  }
];

export default function BlogPage() {
  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      <StickyHeader />

      <main className="flex-grow p-6">
        <div className="container mx-auto max-w-4xl">
          <h1 className="text-3xl font-bold mb-8 text-center">Blog</h1>

          <div className="grid gap-8">
            {blogPosts.map(post => (
              <article key={post.id} className="bg-gray-900 border border-gray-800 rounded-lg p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-center mb-3 text-sm text-gray-400">
                  <span>{post.date}</span>
                  <span className="mx-2">•</span>
                  <span>{post.category}</span>
                </div>
                <h2 className="text-xl font-bold mb-3 text-[#FF9500]">{post.title}</h2>
                <p className="text-gray-300 mb-4">{post.excerpt}</p>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-400">By {post.author}</span>
                  <Link href={`/blog/${post.id}`} className="text-[#FF9500] hover:underline">
                    Read more →
                  </Link>
                </div>
              </article>
            ))}
          </div>
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
