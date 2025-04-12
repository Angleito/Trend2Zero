

import Image from 'next/image';
import Link from 'next/link';
export default function TrackerLoading() {
  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      <div className="bg-black border-b border-gray-800 py-4 px-6 flex items-center justify-between">
        <div className="flex items-center">
          <div className="w-8 h-8 bg-gray-800 rounded-full animate-pulse"></div>
          <div className="ml-3 h-6 w-32 bg-gray-800 rounded animate-pulse"></div>
        </div>
        <div className="flex space-x-4">
          <div className="h-8 w-20 bg-gray-800 rounded animate-pulse"></div>
          <div className="h-8 w-20 bg-gray-800 rounded animate-pulse"></div>
        </div>
      </div>

      <main className="flex-grow p-6">
        <div className="container mx-auto max-w-6xl">
          <div className="h-10 w-48 mx-auto bg-gray-800 rounded animate-pulse mb-8"></div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="md:col-span-2 overflow-x-auto">
              <div className="flex space-x-4 pb-2">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-10 w-24 bg-gray-800 rounded animate-pulse"></div>
                ))}
              </div>
            </div>
            <div>
              <div className="h-10 w-full bg-gray-800 rounded animate-pulse"></div>
            </div>
          </div>

          <div className="border border-gray-800 rounded-lg overflow-hidden">
            <div className="p-4 border-b border-gray-800 bg-gray-900">
              <div className="h-8 w-48 bg-gray-800 rounded animate-pulse"></div>
            </div>
            <div className="overflow-x-auto">
              <div className="min-w-full">
                {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                  <div key={i} className="border-b border-gray-800 p-4 flex justify-between items-center">
                    <div className="flex items-center">
                      <div className="h-8 w-8 bg-gray-800 rounded-full animate-pulse"></div>
                      <div className="ml-3 h-6 w-32 bg-gray-800 rounded animate-pulse"></div>
                    </div>
                    <div className="flex space-x-4">
                      <div className="h-6 w-20 bg-gray-800 rounded animate-pulse"></div>
                      <div className="h-6 w-20 bg-gray-800 rounded animate-pulse"></div>
                      <div className="h-6 w-20 bg-gray-800 rounded animate-pulse"></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-8 text-center">
            <div className="h-6 w-24 bg-gray-800 rounded animate-pulse inline-block"></div>
          </div>
        </div>
      </main>
    </div>
  );
}
