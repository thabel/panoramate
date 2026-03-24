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
        <Script 
          src="https://www.marzipano.net/demos/common/es5-shim.js" 
          strategy="afterInteractive" 
        />
        <Script 
          src="https://www.marzipano.net/demos/common/eventShim.js" 
          strategy="afterInteractive" 
        />
        <Script 
          src="https://www.marzipano.net/demos/common/requestAnimationFrameShim.js" 
          strategy="afterInteractive" 
        />
        <Script 
          src="https://cdn.jsdelivr.net/npm/marzipano@0.10.2/dist/marzipano.min.js" 
          strategy="afterInteractive" 
        />
      </body>
    </html>
  );
}
