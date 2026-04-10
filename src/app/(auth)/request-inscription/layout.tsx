'use client';

import Link from 'next/link';
import { Header } from '@/components/ui/Header';
import { dictionaries } from '@/lib/i18n';
import { useUI } from '@/context/UIContext';

function AuthHeaderSubtitle() {
  const { locale } = useUI();
  return <p className="text-dark-400">{dictionaries[locale].auth.layoutSubtitle}</p>;
}

export default function RequestInscriptionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-dark-900 to-dark-950">
      <Header />
      <div className="flex items-center justify-center min-h-[calc(100vh-73px)] px-4 py-8">
        <div className="relative w-full max-w-lg md:max-w-5xl">
          <div className="mb-8 text-center md:mb-0">
            <Link href="/" className="inline-block mb-2 text-3xl font-bold text-transparent bg-gradient-to-r from-primary-400 to-primary-600 bg-clip-text hover:opacity-80 transition">
              BATIVY
            </Link>
            <AuthHeaderSubtitle />
          </div>
          <div className="p-8 border rounded-lg bg-dark-800 border-dark-700 md:mt-8">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
