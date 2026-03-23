import type { Metadata } from 'next';
import { Toaster } from 'react-hot-toast';
import Script from 'next/script';
import './globals.css';

export const metadata: Metadata = {
  title: 'Panoramate - Virtual Tour Creator',
  description: 'Create and share stunning 360° virtual tours in minutes',
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-dark-900 text-dark-50">
        {children}
        <Toaster position="top-right" />
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/npm/pannellum@2.5.6/build/pannellum.css"
        />
        <Script 
          src="https://cdn.jsdelivr.net/npm/pannellum@2.5.6/build/pannellum.js" 
          strategy="beforeInteractive" 
        />
      </body>
    </html>
  );
}
