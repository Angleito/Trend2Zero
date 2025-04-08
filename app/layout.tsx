'use client';

import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap', // Improve font loading performance
  preload: true
})

// Metadata moved to Head component for client-side rendering

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html
      lang="en"
      className="dark"
      translate="no"
    >
      <head>
        <title>Trend2Zero - Global Assets Priced in Bitcoin</title>
        <meta name="description" content="Visualize how every asset trends to zero in Bitcoin terms" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <meta name="keywords" content="bitcoin, asset pricing, cryptocurrency, financial visualization, trend to zero" />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://trend2zero.com" />
        <meta property="og:title" content="Trend2Zero - Global Assets Priced in Bitcoin" />
        <meta property="og:description" content="Visualize how every asset trends to zero in Bitcoin terms" />
        <meta property="og:site_name" content="Trend2Zero" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Trend2Zero" />
        <meta name="twitter:description" content="Visualize how every asset trends to zero in Bitcoin terms" />
      </head>
      <body
        className={`${inter.className} bg-black text-white min-h-screen antialiased`}
        data-theme="dark"
      >
        <div
          id="app-root"
          role="application"
          aria-label="Trend2Zero Application"
          className="flex flex-col min-h-screen"
        >
          {children}
        </div>
      </body>
    </html>
  )
}