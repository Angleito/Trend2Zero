import { Inter } from 'next/font/google';
import React from 'react';
import { ErrorBoundary } from './components/ErrorBoundary';
import './globals.css';
const inter = Inter({
    subsets: ['latin'],
    display: 'swap',
    variable: '--font-inter'
});
export const metadata = {
    title: {
        default: 'Trend2Zero | Financial Insights',
        template: '%s | Trend2Zero'
    },
    description: 'Comprehensive financial tracking and analysis platform',
    icons: {
        icon: '/favicon.ico',
        shortcut: '/favicon.ico',
    },
    openGraph: {
        title: 'Trend2Zero',
        description: 'Financial Insights Platform',
        type: 'website',
        locale: 'en_US',
    },
    robots: {
        index: true,
        follow: true,
        googleBot: {
            index: true,
            follow: true,
        }
    }
};
export default function RootLayout({ children, }) {
    return (<html lang="en" className={`${inter.variable}`}>
      <body>
        <ErrorBoundary>
          {children}
        </ErrorBoundary>
      </body>
    </html>);
}
