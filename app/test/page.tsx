'use client';

import React from 'react';
import Link from 'next/link';

export default function TestPage() {
  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center">
      <h1 className="text-3xl font-bold mb-8">Test Page</h1>
      <p className="mb-4">This is a simple test page to verify routing.</p>
      <div className="flex space-x-4">
        <Link href="/" className="bg-[#FF9500] hover:bg-opacity-90 text-white px-4 py-2 rounded-lg transition-colors">
          Home
        </Link>
        <Link href="/tracker" className="bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors">
          Tracker
        </Link>
      </div>
    </div>
  );
}
