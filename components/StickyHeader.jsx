'use client';
/**
 * NOTE: For testing and debugging this component, use Playwright only.
 * Do not use manual browser testing or other testing frameworks.
 * See tests/browser-test.js for examples.
 */
import { useState, useEffect } from 'react';
import Link from 'next/link';
import BitcoinTicker from './BitcoinTicker';
const StickyHeader = () => {
    const [isScrolled, setIsScrolled] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const handleScroll = () => {
                setIsScrolled(window.scrollY > 10);
            };
            window.addEventListener('scroll', handleScroll);
            return () => window.removeEventListener('scroll', handleScroll);
        }
    }, []);
    return (<header className={`sticky top-0 z-50 transition-all duration-300 ${isScrolled ? 'bg-gray-900/95 backdrop-blur-sm shadow-md' : 'bg-transparent'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          <div className="flex items-center">
            <Link href="/" className="flex items-center">
              <span className="text-2xl font-bold text-[#FF9500]">₿</span>
              <span className="ml-2 text-xl font-semibold text-white">Trend2Zero</span>
            </Link>
          </div>

          {/* Desktop navigation */}
          <nav className="hidden md:flex space-x-8">
            <Link href="/tracker" className="text-gray-300 hover:text-[#FF9500] transition-colors">
              Asset Tracker
            </Link>
            <Link href="/about" className="text-gray-300 hover:text-[#FF9500] transition-colors">
              About
            </Link>
            <Link href="/blog" className="text-gray-300 hover:text-[#FF9500] transition-colors">
              Blog
            </Link>
          </nav>

          {/* Bitcoin ticker */}
          <div className="hidden md:block">
            <BitcoinTicker />
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button type="button" className="text-gray-300 hover:text-white" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
              <span className="sr-only">Open main menu</span>
              {isMobileMenuOpen ? (<svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
                </svg>) : (<svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16"/>
                </svg>)}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {isMobileMenuOpen && (<div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
              <Link href="/tracker" className="block px-3 py-2 rounded-md text-base font-medium text-gray-300 hover:text-white hover:bg-gray-800" onClick={() => setIsMobileMenuOpen(false)}>
                Asset Tracker
              </Link>
              <Link href="/about" className="block px-3 py-2 rounded-md text-base font-medium text-gray-300 hover:text-white hover:bg-gray-800" onClick={() => setIsMobileMenuOpen(false)}>
                About
              </Link>
              <Link href="/blog" className="block px-3 py-2 rounded-md text-base font-medium text-gray-300 hover:text-white hover:bg-gray-800" onClick={() => setIsMobileMenuOpen(false)}>
                Blog
              </Link>
              <div className="px-3 py-2">
                <BitcoinTicker />
              </div>
            </div>
          </div>)}
      </div>
    </header>);
};
export default StickyHeader;
