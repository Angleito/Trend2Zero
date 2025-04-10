'use client';

import React from 'react';
import Link from 'next/link';

export default function TestPage() {
  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-4">
      <h1 className="text-3xl font-bold mb-8">GitHub Actions Test Page</h1>
      
      <p className="mb-4 text-center max-w-lg">
        This is a simple test page to verify that the server is running correctly in GitHub Actions.
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
        <div className="bg-gray-800 p-4 rounded-lg">
          <h2 className="text-xl font-semibold mb-2">Server Status</h2>
          <p>✅ Server is running</p>
        </div>
        
        <div className="bg-gray-800 p-4 rounded-lg">
          <h2 className="text-xl font-semibold mb-2">Test Information</h2>
          <p>Environment: {process.env.NODE_ENV}</p>
          <p>Time: {new Date().toISOString()}</p>
        </div>
      </div>
      
      <div className="mt-8 flex space-x-4">
        <Link href="/" className="px-4 py-2 bg-blue-600 rounded-md hover:bg-blue-700 transition-colors">
          Home
        </Link>
        <Link href="/tracker" className="px-4 py-2 bg-gray-700 rounded-md hover:bg-gray-600 transition-colors">
          Tracker
        </Link>
      </div>
    </div>
  );
}
