import React from 'react';
import Link from 'next/link';
export default function NotFound() {
  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-4">
      <div className="text-center max-w-2xl">
        <div className="mb-8 flex justify-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-24 w-24 text-[#FF9500]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h1 className="text-4xl font-bold mb-4">Page Not Found</h1>
        <p className="text-xl text-gray-400 mb-8">The page you are looking for does not exist or has been moved.</p>
        <Link 
          href="/" 
          className="bg-[#FF9500] hover:bg-opacity-90 text-white px-8 py-4 rounded-lg text-lg font-medium transition-colors"
        >
          Return to Home
        </Link>
      </div>
    </div>
  );
}
