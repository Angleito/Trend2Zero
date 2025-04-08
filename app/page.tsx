import Link from 'next/link';
import Image from 'next/image';
import StickyHeader from '../components/StickyHeader';

export default function Home() {
  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      <StickyHeader />

      <main className="flex-grow">
        {/* Hero Section */}
        <section className="py-20 px-4">
          <div className="container mx-auto max-w-5xl text-center">
            <h1 className="text-5xl md:text-6xl font-bold mb-6">
              Everything Trends to <span className="text-[#FF9500]">Zero</span> in Bitcoin Terms
            </h1>
            <p className="text-xl text-gray-300 mb-10 max-w-3xl mx-auto">
              Track global assets like stocks, gold, oil, and indices priced in Bitcoin. See the true value of assets through the lens of Bitcoin.
            </p>

            <div className="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-6">
              <Link
                href="/tracker"
                className="bg-[#FF9500] hover:bg-opacity-90 text-white px-8 py-4 rounded-lg text-lg font-medium transition-colors"
              >
                Launch Tracker
              </Link>
              <a
                href="https://bitcoin.org"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-gray-900 hover:bg-gray-800 text-white border border-gray-700 px-8 py-4 rounded-lg text-lg font-medium transition-colors"
              >
                Learn About Bitcoin
              </a>
            </div>
          </div>
        </section>

        {/* Feature Cards */}
        <section className="py-16 px-4 bg-black">
          <div className="container mx-auto max-w-6xl">
            <h2 className="text-3xl font-bold mb-12 text-center">Why Price in Bitcoin?</h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Card 1 */}
              <div className="bg-dark-card border border-dark-border rounded-lg p-8 hover:shadow-bitcoin transition-all duration-300">
                <div className="text-[#FF9500] text-4xl mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="h-12 w-12">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold mb-3">True Value Perspective</h3>
                <p className="text-gray-400">See how traditional assets perform against the world&apos;s hardest money. Most assets trend to zero when priced in Bitcoin.</p>
              </div>

              {/* Card 2 */}
              <div className="bg-dark-card border border-dark-border rounded-lg p-8 hover:shadow-bitcoin transition-all duration-300">
                <div className="text-[#FF9500] text-4xl mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="h-12 w-12">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold mb-3">Interactive Charts</h3>
                <p className="text-gray-400">Explore detailed price charts with multiple timeframes and toggle between linear and logarithmic views.</p>
              </div>

              {/* Card 3 */}
              <div className="bg-dark-card border border-dark-border rounded-lg p-8 hover:shadow-bitcoin transition-all duration-300">
                <div className="text-[#FF9500] text-4xl mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="h-12 w-12">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold mb-3">Comprehensive Data</h3>
                <p className="text-gray-400">Track returns across multiple timeframes (YTD, 1Y, 3Y, 5Y, MAX) with color-coded performance indicators.</p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-black border-t border-dark-border py-10 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center mb-6 md:mb-0">
              <Image
                src="/bitcoin-logo.svg"
                alt="Trend2Zero Logo"
                width={24}
                height={24}
                className="mr-2"
              />
              <span className="text-lg font-bold">Trend2<span className="text-[#FF9500]">Zero</span></span>
            </div>

            <nav className="mb-6 md:mb-0">
              <ul className="flex space-x-8">
                <li>
                  <Link href="/" className="text-gray-400 hover:text-[#FF9500] transition-colors">
                    Home
                  </Link>
                </li>
                <li>
                  <Link href="/tracker" className="text-gray-400 hover:text-[#FF9500] transition-colors">
                    Tracker
                  </Link>
                </li>
                <li>
                  <a
                    href="https://bitcoin.org"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-400 hover:text-[#FF9500] transition-colors"
                  >
                    Learn
                  </a>
                </li>
              </ul>
            </nav>

            <div className="flex space-x-4">
              <a href="https://twitter.com/bitcoin" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-[#FF9500] transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/>
                </svg>
              </a>
              <a href="https://github.com/bitcoin" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-[#FF9500] transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                </svg>
              </a>
            </div>
          </div>

          <div className="mt-8 pt-8 border-t border-dark-border text-center text-gray-500">
            <p>&copy; {new Date().getFullYear()} Trend2Zero. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
