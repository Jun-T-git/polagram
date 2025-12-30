import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Footer } from '../components/layout/Footer';
import { Navbar } from '../components/layout/Navbar';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Polagraph - Interactive Sequence Diagrams',
  description: 'Interactive sequence diagram viewer and transformation engine.',
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
