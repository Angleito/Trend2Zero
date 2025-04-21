export const metadata = {
    title: 'Not Found - Trend2Zero',
    description: 'The page you are looking for does not exist.',
};
export const viewport = {
    themeColor: '#000000', // Dark blue abyss theme color
    width: 'device-width',
    initialScale: 1,
    maximumScale: 5,
    userScalable: true,
};
import Link from 'next/link';
export default function NotFound() {
    return (<div className="min-h-screen bg-black flex items-center justify-center">
      <div className="bg-gray-900 border border-gray-800 rounded-lg p-8 text-center">
        <h2 className="text-2xl font-bold text-white mb-4">404 - Page Not Found</h2>
        <p className="text-gray-400 mb-6">The page you are looking for does not exist.</p>
        <Link href="/" className="bg-[#FF9500] hover:bg-opacity-90 text-white px-6 py-2 rounded-md transition-colors">
          Back to Home
        </Link>
      </div>
    </div>);
}
