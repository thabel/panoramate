import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import {
  Image,
  Zap,
  Users,
  Globe,
  ArrowRight,
  Check,
} from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-dark-900 via-dark-900 to-dark-950">
      {/* Navigation */}
      <nav className="border-b border-dark-800 sticky top-0 z-40 bg-dark-900/95 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="text-2xl font-bold bg-gradient-to-r from-primary-400 to-primary-600 bg-clip-text text-transparent">
            Panoramate
          </div>
          <div className="flex gap-4">
            <Link href="/login">
              <Button variant="ghost">Sign In</Button>
            </Link>
            <Link href="/register">
              <Button variant="primary">Get Started</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        <h1 className="text-5xl md:text-6xl font-bold text-white mb-6 leading-tight">
          Create Stunning <span className="bg-gradient-to-r from-primary-400 to-primary-600 bg-clip-text text-transparent">360° Virtual Tours</span> in Minutes
        </h1>
        <p className="text-xl text-dark-300 mb-8 max-w-2xl mx-auto">
          Panoramate makes it easy to create, customize, and share immersive 360° virtual tours.
          Perfect for real estate, hospitality, tourism, and more.
        </p>
        <div className="flex gap-4 justify-center flex-wrap">
          <Link href="/register">
            <Button variant="primary" size="lg" className="flex items-center gap-2">
              Start Free Trial
              <ArrowRight size={20} />
            </Button>
          </Link>
          <Link href="#features">
            <Button variant="secondary" size="lg">
              Learn More
            </Button>
          </Link>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <h2 className="text-3xl font-bold text-white mb-12 text-center">
          Powerful Features
        </h2>
        <div className="grid md:grid-cols-2 gap-8 mb-12">
          <div className="bg-dark-800 border border-dark-700 rounded-lg p-8">
            <Image className="text-primary-400 mb-4" size={32} />
            <h3 className="text-xl font-semibold text-white mb-2">Easy Upload</h3>
            <p className="text-dark-300">
              Upload 360° images with a simple drag-and-drop interface. Support for multiple formats.
            </p>
          </div>
          <div className="bg-dark-800 border border-dark-700 rounded-lg p-8">
            <Zap className="text-primary-400 mb-4" size={32} />
            <h3 className="text-xl font-semibold text-white mb-2">Interactive Editor</h3>
            <p className="text-dark-300">
              Add hotspots, links, and information points to create immersive experiences.
            </p>
          </div>
          <div className="bg-dark-800 border border-dark-700 rounded-lg p-8">
            <Globe className="text-primary-400 mb-4" size={32} />
            <h3 className="text-xl font-semibold text-white mb-2">Share Anywhere</h3>
            <p className="text-dark-300">
              Generate shareable links and embed code. Perfect for websites and social media.
            </p>
          </div>
          <div className="bg-dark-800 border border-dark-700 rounded-lg p-8">
            <Users className="text-primary-400 mb-4" size={32} />
            <h3 className="text-xl font-semibold text-white mb-2">Team Collaboration</h3>
            <p className="text-dark-300">
              Invite team members and work together on projects in real-time.
            </p>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <h2 className="text-3xl font-bold text-white mb-12 text-center">
          Simple Pricing
        </h2>
        <div className="grid md:grid-cols-3 gap-8">
          {/* Starter */}
          <div className="bg-dark-800 border border-dark-700 rounded-lg p-8 hover:border-primary-500 transition-colors">
            <h3 className="text-2xl font-bold text-white mb-2">Starter</h3>
            <p className="text-dark-400 mb-6">Perfect for getting started</p>
            <div className="mb-6">
              <span className="text-5xl font-bold text-white">$29</span>
              <span className="text-dark-400">/month</span>
            </div>
            <ul className="space-y-3 mb-8">
              <li className="flex items-center gap-2 text-dark-300">
                <Check size={18} className="text-primary-400" />
                5 Virtual Tours
              </li>
              <li className="flex items-center gap-2 text-dark-300">
                <Check size={18} className="text-primary-400" />
                50 Scenes per Tour
              </li>
              <li className="flex items-center gap-2 text-dark-300">
                <Check size={18} className="text-primary-400" />
                2 GB Storage
              </li>
              <li className="flex items-center gap-2 text-dark-300">
                <Check size={18} className="text-primary-400" />
                Public Sharing
              </li>
              <li className="flex items-center gap-2 text-dark-300">
                <Check size={18} className="text-primary-400" />
                Email Support
              </li>
            </ul>
            <Link href="/register">
              <Button variant="secondary" className="w-full">
                Get Started
              </Button>
            </Link>
          </div>

          {/* Professional */}
          <div className="bg-dark-800 border-2 border-primary-500 rounded-lg p-8 relative">
            <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
              <span className="bg-primary-600 text-white px-3 py-1 rounded-full text-sm font-semibold">
                Most Popular
              </span>
            </div>
            <h3 className="text-2xl font-bold text-white mb-2 mt-4">Professional</h3>
            <p className="text-dark-400 mb-6">For growing teams</p>
            <div className="mb-6">
              <span className="text-5xl font-bold text-white">$79</span>
              <span className="text-dark-400">/month</span>
            </div>
            <ul className="space-y-3 mb-8">
              <li className="flex items-center gap-2 text-dark-300">
                <Check size={18} className="text-primary-400" />
                20 Virtual Tours
              </li>
              <li className="flex items-center gap-2 text-dark-300">
                <Check size={18} className="text-primary-400" />
                200 Scenes per Tour
              </li>
              <li className="flex items-center gap-2 text-dark-300">
                <Check size={18} className="text-primary-400" />
                10 GB Storage
              </li>
              <li className="flex items-center gap-2 text-dark-300">
                <Check size={18} className="text-primary-400" />
                Team Members (10)
              </li>
              <li className="flex items-center gap-2 text-dark-300">
                <Check size={18} className="text-primary-400" />
                Priority Support
              </li>
            </ul>
            <Link href="/register">
              <Button variant="primary" className="w-full">
                Get Started
              </Button>
            </Link>
          </div>

          {/* Enterprise */}
          <div className="bg-dark-800 border border-dark-700 rounded-lg p-8 hover:border-primary-500 transition-colors">
            <h3 className="text-2xl font-bold text-white mb-2">Enterprise</h3>
            <p className="text-dark-400 mb-6">For large scale operations</p>
            <div className="mb-6">
              <span className="text-5xl font-bold text-white">$199</span>
              <span className="text-dark-400">/month</span>
            </div>
            <ul className="space-y-3 mb-8">
              <li className="flex items-center gap-2 text-dark-300">
                <Check size={18} className="text-primary-400" />
                Unlimited Tours
              </li>
              <li className="flex items-center gap-2 text-dark-300">
                <Check size={18} className="text-primary-400" />
                Unlimited Scenes
              </li>
              <li className="flex items-center gap-2 text-dark-300">
                <Check size={18} className="text-primary-400" />
                100 GB Storage
              </li>
              <li className="flex items-center gap-2 text-dark-300">
                <Check size={18} className="text-primary-400" />
                Unlimited Team
              </li>
              <li className="flex items-center gap-2 text-dark-300">
                <Check size={18} className="text-primary-400" />
                24/7 Support
              </li>
            </ul>
            <Link href="/register">
              <Button variant="secondary" className="w-full">
                Contact Sales
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        <h2 className="text-4xl font-bold text-white mb-4">
          Ready to Create Your First Tour?
        </h2>
        <p className="text-xl text-dark-300 mb-8">
          Start your 14-day free trial today. No credit card required.
        </p>
        <Link href="/register">
          <Button variant="primary" size="lg" className="flex items-center gap-2 mx-auto">
            Start Free Trial
            <ArrowRight size={20} />
          </Button>
        </Link>
      </section>

      {/* Footer */}
      <footer className="border-t border-dark-800 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center text-dark-400">
            <p>© 2024 Panoramate. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
