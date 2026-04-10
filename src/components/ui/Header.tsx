'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher';
import { useUI } from '@/context/UIContext';
import { dictionaries } from '@/lib/i18n';

export function Header() {
  const { locale } = useUI();
  const t = dictionaries[locale].home;

  return (
    <nav className="sticky top-0 z-40 border-b border-dark-800 bg-dark-900/95 backdrop-blur-sm">
      <div className="flex items-center justify-between px-4 py-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
        <Link href="/" className="text-2xl font-bold text-transparent bg-gradient-to-r from-primary-400 to-primary-600 bg-clip-text hover:opacity-80 transition">
          BATIVY
        </Link>
        <div className="flex items-center gap-4">
          <LanguageSwitcher />
          <Link href="/login">
            <Button variant="ghost">{t.nav.signIn}</Button>
          </Link>
          <Link href="/register">
            <Button variant="primary">{t.nav.getStarted}</Button>
          </Link>
        </div>
      </div>
    </nav>
  );
}
