'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher';
import { useUI } from '@/context/UIContext';
import { dictionaries } from '@/lib/i18n';
import { Menu, X } from 'lucide-react';

export function Header() {
  const { locale } = useUI();
  const t = dictionaries[locale].home;
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  return (
    <nav className="sticky top-0 z-40 border-b border-dark-800 bg-dark-900/95 backdrop-blur-sm">
      <div className="flex items-center justify-between px-4 py-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
        <Link href="/" className="text-xl font-bold sm:text-2xl text-transparent bg-gradient-to-r from-primary-400 to-primary-600 bg-clip-text hover:opacity-80 transition">
          BATIVY
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-4">
          <LanguageSwitcher />
          <Link href="/login">
            <Button variant="ghost">{t.nav.signIn}</Button>
          </Link>
          <Link href="/register">
            <Button variant="primary">{t.nav.getStarted}</Button>
          </Link>
        </div>

        {/* Mobile Menu Button */}
        <button
          onClick={toggleMenu}
          className="md:hidden p-2 hover:bg-dark-800 rounded-lg transition-colors"
          aria-label="Toggle menu"
        >
          {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden border-t border-dark-800 bg-dark-900">
          <div className="px-4 py-4 space-y-3">
            <div className="pb-3 border-b border-dark-800">
              <LanguageSwitcher />
            </div>
            <Link href="/login" onClick={() => setIsMenuOpen(false)}>
              <Button variant="ghost" className="w-full">
                {t.nav.signIn}
              </Button>
            </Link>
            <Link href="/register" onClick={() => setIsMenuOpen(false)}>
              <Button variant="primary" className="w-full">
                {t.nav.getStarted}
              </Button>
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}
