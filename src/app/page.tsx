"use client";

import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher';
import { useUI } from '@/context/UIContext';
import { dictionaries } from '@/lib/i18n';
import {
  Image,
  Zap,
  Users,
  Globe,
  ArrowRight,
  Check,
} from 'lucide-react';

export default function Home() {
  const { locale } = useUI();
  const t = dictionaries[locale].home;
  const featureIcons = [Image, Zap, Globe, Users];

  return (
    <div className="min-h-screen bg-gradient-to-b from-dark-900 via-dark-900 to-dark-950">
      {/* Navigation */}
      <nav className="sticky top-0 z-40 border-b border-dark-800 bg-dark-900/95 backdrop-blur-sm">
        <div className="flex items-center justify-between px-4 py-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
          <div className="text-2xl font-bold text-transparent bg-gradient-to-r from-primary-400 to-primary-600 bg-clip-text">
            BATIVYMA
          </div>
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

      {/* Hero Section */}
      <section className="px-4 py-20 mx-auto text-center max-w-7xl sm:px-6 lg:px-8">
        <h1 className="mb-6 text-5xl font-bold leading-tight text-white md:text-6xl">
          {t.hero.titlePrefix}{' '}
          <span className="text-transparent bg-gradient-to-r from-primary-400 to-primary-600 bg-clip-text">{t.hero.titleHighlight}</span>{' '}
          {t.hero.titleSuffix}
        </h1>
        <p className="max-w-2xl mx-auto mb-8 text-xl text-dark-300">
          {t.hero.description}
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <Link href="/register">
            <Button variant="primary" size="lg" className="flex items-center gap-2">
              {t.hero.startTrial}
              <ArrowRight size={20} />
            </Button>
          </Link>
          <Link href="#features">
            <Button variant="secondary" size="lg">
              {t.hero.learnMore}
            </Button>
          </Link>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="px-4 py-20 mx-auto max-w-7xl sm:px-6 lg:px-8">
        <h2 className="mb-12 text-3xl font-bold text-center text-white">
          {t.features.sectionTitle}
        </h2>
        <div className="grid gap-8 mb-12 md:grid-cols-2">
          {t.features.cards.map((card, index) => {
            const Icon = featureIcons[index];

            return (
              <div key={card.title} className="p-8 border rounded-lg bg-dark-800 border-dark-700">
                <Icon className="mb-4 text-primary-400" size={32} />
                <h3 className="mb-2 text-xl font-semibold text-white">{card.title}</h3>
                <p className="text-dark-300">{card.description}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Pricing Section */}
      <section className="px-4 py-20 mx-auto max-w-7xl sm:px-6 lg:px-8">
        <h2 className="mb-12 text-3xl font-bold text-center text-white">
          {t.pricing.sectionTitle}
        </h2>
        <div className="grid gap-8 md:grid-cols-3">
          {/* Starter */}
          <div className="p-8 transition-colors border rounded-lg bg-dark-800 border-dark-700 hover:border-primary-500">
            <h3 className="mb-2 text-2xl font-bold text-white">{t.pricing.tiers.starter.name}</h3>
            <p className="mb-6 text-dark-400">{t.pricing.tiers.starter.subtitle}</p>
            <div className="mb-6">
              <span className="text-5xl font-bold text-white">$29</span>
              <span className="text-dark-400">{t.pricing.monthlySuffix}</span>
            </div>
            <ul className="mb-8 space-y-3">
              {t.pricing.tiers.starter.features.map((feature) => (
                <li key={feature} className="flex items-center gap-2 text-dark-300">
                  <Check size={18} className="text-primary-400" />
                  {feature}
                </li>
              ))}
            </ul>
            <Link href="/register">
              <Button variant="secondary" className="w-full">
                {t.pricing.tiers.starter.cta}
              </Button>
            </Link>
          </div>

          {/* Professional */}
          <div className="relative p-8 border-2 rounded-lg bg-dark-800 border-primary-500">
            <div className="absolute transform -translate-x-1/2 -top-3 left-1/2">
              <span className="px-3 py-1 text-sm font-semibold text-white rounded-full bg-primary-600">
                {t.pricing.mostPopular}
              </span>
            </div>
            <h3 className="mt-4 mb-2 text-2xl font-bold text-white">{t.pricing.tiers.professional.name}</h3>
            <p className="mb-6 text-dark-400">{t.pricing.tiers.professional.subtitle}</p>
            <div className="mb-6">
              <span className="text-5xl font-bold text-white">$79</span>
              <span className="text-dark-400">{t.pricing.monthlySuffix}</span>
            </div>
            <ul className="mb-8 space-y-3">
              {t.pricing.tiers.professional.features.map((feature) => (
                <li key={feature} className="flex items-center gap-2 text-dark-300">
                  <Check size={18} className="text-primary-400" />
                  {feature}
                </li>
              ))}
            </ul>
            <Link href="/register">
              <Button variant="primary" className="w-full">
                {t.pricing.tiers.professional.cta}
              </Button>
            </Link>
          </div>

          {/* Enterprise */}
          <div className="p-8 transition-colors border rounded-lg bg-dark-800 border-dark-700 hover:border-primary-500">
            <h3 className="mb-2 text-2xl font-bold text-white">{t.pricing.tiers.enterprise.name}</h3>
            <p className="mb-6 text-dark-400">{t.pricing.tiers.enterprise.subtitle}</p>
            <div className="mb-6">
              <span className="text-5xl font-bold text-white">$199</span>
              <span className="text-dark-400">{t.pricing.monthlySuffix}</span>
            </div>
            <ul className="mb-8 space-y-3">
              {t.pricing.tiers.enterprise.features.map((feature) => (
                <li key={feature} className="flex items-center gap-2 text-dark-300">
                  <Check size={18} className="text-primary-400" />
                  {feature}
                </li>
              ))}
            </ul>
            <Link href="/register">
              <Button variant="secondary" className="w-full">
                {t.pricing.tiers.enterprise.cta}
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-4 py-20 mx-auto text-center max-w-7xl sm:px-6 lg:px-8">
        <h2 className="mb-4 text-4xl font-bold text-white">
          {t.cta.title}
        </h2>
        <p className="mb-8 text-xl text-dark-300">
          {t.cta.description}
        </p>
        <Link href="/register">
          <Button variant="primary" size="lg" className="flex items-center gap-2 mx-auto">
            {t.cta.button}
            <ArrowRight size={20} />
          </Button>
        </Link>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-dark-800">
        <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
          <div className="text-center text-dark-400">
            <p>© 2026 BATIVY. {t.footer.rights}</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
