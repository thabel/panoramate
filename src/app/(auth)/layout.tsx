'use client';

import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher';
import { dictionaries } from '@/lib/i18n';
import { useUI } from '@/context/UIContext';

function AuthHeaderSubtitle() {
  const { locale } = useUI();
  return <p className="text-dark-400">{dictionaries[locale].auth.layoutSubtitle}</p>;
}

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-dark-900 to-dark-950 flex items-center justify-center px-4">
      <div className="w-full max-w-md relative">
        <div className="absolute -top-14 right-0">
          <LanguageSwitcher />
        </div>
        <div className="text-center mb-8">
          <div className="text-3xl font-bold bg-gradient-to-r from-primary-400 to-primary-600 bg-clip-text text-transparent mb-2">
            Panoramate
          </div>
          <AuthHeaderSubtitle />
        </div>
        <div className="bg-dark-800 border border-dark-700 rounded-lg p-8">
          {children}
        </div>
      </div>
    </div>
  );
}
