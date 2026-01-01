import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Footer } from '../components/layout/Footer';
import { Navbar } from '../components/layout/Navbar';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  metadataBase: new URL('https://polagram.org/'), // Replace with actual domain if different
  title: {
    default: 'Polagram - Interactive Sequence Diagrams',
    template: '%s | Polagram',
  },
  description: 'Interactive sequence diagram viewer and transformation engine. Visualize complex flows with ease.',
  openGraph: {
    title: 'Polagram - Interactive Sequence Diagrams',
    description: 'Interactive sequence diagram viewer and transformation engine. Visualize complex flows with ease.',
    url: 'https://polagram.org/',
    siteName: 'Polagram',
    locale: 'ja_JP', // Or 'en_US' depending on target audience, code says 'ja' html lang
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Polagram - Interactive Sequence Diagrams',
    description: 'Interactive sequence diagram viewer and transformation engine.',
    creator: '@polagram', // Replace with actual handle if available
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" suppressHydrationWarning>
      <body className={`${inter.className} min-h-screen flex flex-col`} suppressHydrationWarning>
        <Navbar />
        <div className="flex-1">
          {children}
        </div>
        <Footer />
      </body>
    </html>
  );
}
