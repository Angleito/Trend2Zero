'use client';
import { useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
export default function Error({ error, reset, }) {
    useEffect(() => {
        // Log the error to an error reporting service
        console.error('Application error:', error);
    }, [error]);
    return (<div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-4">
      <div className="text-center max-w-2xl">
        <div className="mb-8 flex justify-center">
          <Image src="/bitcoin-logo.svg" alt="Bitcoin Logo" width={80} height={80} className="animate-pulse"/>
        </div>
        
        <h1 className="text-3xl md:text-4xl font-bold mb-4">Something went wrong</h1>
        
        <p className="text-gray-400 mb-8 text-lg">
          We apologize for the inconvenience. Our team has been notified and is working to fix the issue.
        </p>
        
        <div className="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-6">
          <button onClick={() => reset()} className="bg-[#FF9500] hover:bg-opacity-90 text-white px-8 py-4 rounded-lg text-lg font-medium transition-colors">
            Try Again
          </button>
          <Link href="/" className="bg-gray-900 hover:bg-gray-800 text-white border border-gray-700 px-8 py-4 rounded-lg text-lg font-medium transition-colors">
            Go Home
          </Link>
        </div>
        
        {process.env.NODE_ENV === 'development' && (<div className="mt-8 p-4 bg-gray-900 rounded-lg text-left overflow-auto max-h-64">
            <p className="text-red-500 font-mono text-sm mb-2">Error details:</p>
            <pre className="text-gray-400 font-mono text-xs whitespace-pre-wrap">
              {error.message}
              {'\n'}
              {error.stack}
            </pre>
          </div>)}
      </div>
    </div>);
}
