import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
  preload: true
})

export const metadata = {
  title: 'Trend2Zero - Global Assets Priced in Bitcoin',
  description: 'Visualize how every asset trends to zero in Bitcoin terms',
  icons: {
    icon: [
      { url: '/favicon.ico' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' }
    ],
    apple: '/apple-touch-icon.png'
  },
  openGraph: {
    type: 'website',
    url: 'https://trend2zero.com',
    title: 'Trend2Zero - Global Assets Priced in Bitcoin',
    description: 'Visualize how every asset trends to zero in Bitcoin terms',
    siteName: 'Trend2Zero'
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Trend2Zero',
    description: 'Visualize how every asset trends to zero in Bitcoin terms'
  }
}

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