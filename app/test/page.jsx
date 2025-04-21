'use client';
import Link from 'next/link';
export default function TestPage() {
    return (<div className="min-h-screen bg-gray-100 text-gray-900 flex flex-col items-center justify-center p-8">
      <h1 className="text-4xl font-bold mb-8">Tailwind Configuration Test</h1>
      
      {/* Basic Tailwind Classes */}
      <section className="w-full max-w-3xl mb-12 bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-2xl font-semibold mb-4 border-b pb-2">Basic Tailwind Classes</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-blue-500 text-white p-4 rounded-md">Blue Background</div>
          <div className="bg-green-500 text-white p-4 rounded-md">Green Background</div>
          <div className="bg-red-500 text-white p-4 rounded-md">Red Background</div>
        </div>
      </section>
      
      {/* Forms Plugin Test */}
      <section className="w-full max-w-3xl mb-12 bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-2xl font-semibold mb-4 border-b pb-2">Forms Plugin Test</h2>
        <form className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Text Input</label>
            <input type="text" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring focus:ring-indigo-200 focus:ring-opacity-50" placeholder="Test input"/>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Checkbox</label>
            <input type="checkbox" className="rounded border-gray-300 text-indigo-600 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"/>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Select</label>
            <select className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring focus:ring-indigo-200 focus:ring-opacity-50">
              <option>Option 1</option>
              <option>Option 2</option>
              <option>Option 3</option>
            </select>
          </div>
        </form>
      </section>
      
      {/* Typography Plugin Test */}
      <section className="w-full max-w-3xl mb-12 bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-2xl font-semibold mb-4 border-b pb-2">Typography Plugin Test</h2>
        <div className="prose lg:prose-xl">
          <h3>Typography Example</h3>
          <p>This is a paragraph styled with the typography plugin. It should have proper spacing and styling.</p>
          <blockquote>This is a blockquote that should be properly styled by the typography plugin.</blockquote>
          <ul>
            <li>List item one</li>
            <li>List item two</li>
            <li>List item three</li>
          </ul>
        </div>
      </section>
      
      {/* Aspect Ratio Plugin Test */}
      <section className="w-full max-w-3xl mb-12 bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-2xl font-semibold mb-4 border-b pb-2">Aspect Ratio Plugin Test</h2>
        <div className="aspect-w-16 aspect-h-9 bg-gray-200 rounded-md">
          <div className="flex items-center justify-center">
            <p className="text-gray-500">16:9 Aspect Ratio Container</p>
          </div>
        </div>
      </section>
      
      {/* Animation Test */}
      <section className="w-full max-w-3xl mb-12 bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-2xl font-semibold mb-4 border-b pb-2">Animation Test</h2>
        <div className="flex space-x-8 items-center justify-center">
          <div className="w-16 h-16 bg-blue-500 rounded-full animate-spin"></div>
          <div className="w-16 h-16 bg-green-500 rounded-full animate-spin-slow"></div>
        </div>
        <p className="text-center mt-4 text-gray-600">The blue circle should spin faster than the green circle</p>
      </section>
      
      {/* Navigation Links */}
      <div className="flex space-x-4">
        <Link href="/" className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition-colors">
          Home
        </Link>
        <Link href="/tracker" className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors">
          Tracker
        </Link>
      </div>
    </div>);
}
