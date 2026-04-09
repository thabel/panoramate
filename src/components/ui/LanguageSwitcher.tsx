'use client';

import { useUI } from '@/context/UIContext';
import type { Locale } from '@/lib/i18n';

interface LanguageSwitcherProps {
  className?: string;
}

export function LanguageSwitcher({ className = '' }: LanguageSwitcherProps) {
  const { locale, setLocale } = useUI();

  const baseButtonClass =
    'px-3 py-1 text-xs font-semibold rounded-md transition-colors border';

  const buttonClass = (targetLocale: Locale) =>
    `${baseButtonClass} ${
      locale === targetLocale
        ? 'bg-primary-600 border-primary-500 text-white'
        : 'bg-dark-800 border-dark-700 text-dark-300 hover:text-white hover:border-dark-500'
    }`;

  return (
    <div className={`inline-flex items-center gap-2 ${className}`} role="group" aria-label="Language switch">
      <button
        type="button"
        onClick={() => setLocale('en')}
        className={buttonClass('en')}
        aria-pressed={locale === 'en'}
      >
        EN
      </button>
      <button
        type="button"
        onClick={() => setLocale('fr')}
        className={buttonClass('fr')}
        aria-pressed={locale === 'fr'}
      >
        FR
      </button>
    </div>
  );
}
