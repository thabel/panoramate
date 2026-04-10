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
    <div className="flex items-center justify-center min-h-screen px-4 bg-gradient-to-b from-dark-900 to-dark-950">
      <div className="relative w-full max-w-md">
        <div className="absolute right-0 -top-14">
          <LanguageSwitcher />
        </div>
        <div className="mb-8 text-center">
          <div className="mb-2 text-3xl font-bold text-transparent bg-gradient-to-r from-primary-400 to-primary-600 bg-clip-text">
            BATIVY
          </div>
          <AuthHeaderSubtitle />
        </div>
        <div className="p-8 border rounded-lg bg-dark-800 border-dark-700">
          {children}
        </div>
      </div>
    </div>
  );
}
