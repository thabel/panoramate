'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ArrowLeft, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { useUI } from '@/context/UIContext';

const translations = {
  en: {
    backToHome: 'Back to Home',
    notice: {
      title: 'How it works',
      message: 'Your request will be reviewed and confirmed by our team. You\'ll receive a confirmation email once your account is approved.',
    },
    tabs: {
      free: 'Free Trial',
      professional: 'Professional',
    },
    free: {
      title: 'Create Your Free Account',
      subtitle: 'Start your 15-day free trial',
      fields: {
        firstName: 'First Name',
        lastName: 'Last Name',
        email: 'Email',
      },
      submit: 'Create Account',
      submitting: 'Creating...',
      success: 'Account created! Check your email for confirmation.',
      error: 'Failed to create account',
    },
    professional: {
      title: 'Request a Professional Plan',
      subtitle: 'Our team will review your request and contact you',
      fields: {
        firstName: 'First Name',
        lastName: 'Last Name',
        email: 'Email',
        phone: 'Phone Number',
        company: 'Company',
        country: 'Country',
        numberOfTours: 'Number of Virtual Tours Needed',
        imagesPerTour: 'Number of 360° Images per Tour',
        teamMembers: 'Number of Team Members',
        frequency: 'Subscription Type',
      },
      frequency_options: {
        monthly: 'Monthly',
        annual: 'Annual',
      },
      submit: 'Submit Request',
      submitting: 'Submitting...',
      success: 'Request submitted! We will review and contact you soon.',
      error: 'Failed to submit request',
    },
  },
  fr: {
    backToHome: 'Retour à l\'accueil',
    notice: {
      title: 'Comment ça marche',
      message: 'Votre demande sera examinée et confirmée par notre équipe. Vous recevrez un email de confirmation une fois votre compte approuvé.',
    },
    tabs: {
      free: 'Essai Gratuit',
      professional: 'Professional',
    },
    free: {
      title: 'Créer votre compte gratuit',
      subtitle: 'Commencez votre essai gratuit de 15 jours',
      fields: {
        firstName: 'Prénom',
        lastName: 'Nom',
        email: 'Email',
      },
      submit: 'Créer un compte',
      submitting: 'Création en cours...',
      success: 'Compte créé! Vérifiez votre email pour la confirmation.',
      error: 'Erreur lors de la création du compte',
    },
    professional: {
      title: 'Demander un plan Professional',
      subtitle: 'Notre équipe examinera votre demande et vous contactera',
      fields: {
        firstName: 'Prénom',
        lastName: 'Nom',
        email: 'Email',
        phone: 'Téléphone',
        company: 'Sociéte',
        country: 'Pays',
        numberOfTours: 'Nombre de visites virtuelles dont vous avez besoin',
        imagesPerTour: 'Nombre des images 360 degrés par visite virtuelle',
        teamMembers: 'Nombre de personnes qui vont accéder à votre abonnement',
        frequency: 'Type d\'abonnement',
      },
      frequency_options: {
        monthly: 'Mensuel',
        annual: 'Annuel',
      },
      submit: 'Envoyer la demande',
      submitting: 'Envoi en cours...',
      success: 'Demande soumise! Nous examinerons et vous contacterons bientôt.',
      error: 'Erreur lors de l\'envoi de la demande',
    },
  },
};

export default function RequestInscriptionPage() {
  const { locale } = useUI();
  const t = translations[locale as keyof typeof translations];
  const [activeTab, setActiveTab] = useState<'free' | 'professional'>('free');
  const [isLoading, setIsLoading] = useState(false);

  // Free form
  const [freeFormData, setFreeFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
  });

  // Professional form
  const [profFormData, setProfFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    company: '',
    country: '',
    numberOfTours: '',
    imagesPerTour: '',
    teamMembers: '',
    frequency: 'monthly',
  });

  const handleFreeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFreeFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleProfChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setProfFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleFreeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setIsLoading(true);
      const response = await fetch('/api/inscription-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'FREE',
          ...freeFormData,
        }),
      });

      if (response.ok) {
        toast.success(t.free.success);
        setFreeFormData({ firstName: '', lastName: '', email: '' });
        setTimeout(() => {
          window.location.href = '/';
        }, 2000);
      } else {
        toast.error(t.free.error);
      }
    } catch (error) {
      toast.error(t.free.error);
      console.error('Free inscription error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleProfSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setIsLoading(true);
      const response = await fetch('/api/inscription-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'PROFESSIONAL',
          ...profFormData,
        }),
      });

      if (response.ok) {
        toast.success(t.professional.success);
        setProfFormData({
          firstName: '',
          lastName: '',
          email: '',
          phone: '',
          company: '',
          country: '',
          numberOfTours: '',
          imagesPerTour: '',
          teamMembers: '',
          frequency: 'monthly',
        });
        setTimeout(() => {
          window.location.href = '/';
        }, 2000);
      } else {
        toast.error(t.professional.error);
      }
    } catch (error) {
      toast.error(t.professional.error);
      console.error('Professional inscription error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="grid md:grid-cols-2 gap-8 md:gap-12">
      {/* Left Column - Info Section (visible on md+) */}
      <div className="hidden md:flex flex-col justify-center">
        <div className="space-y-6">
          <div>
            <h2 className="text-3xl font-bold text-white mb-3">
              {activeTab === 'free' ? t.free.title : t.professional.title}
            </h2>
            <p className="text-dark-300">
              {activeTab === 'free' ? t.free.subtitle : t.professional.subtitle}
            </p>
          </div>

          {/* Notice Box */}
          <div className="p-4 rounded-lg bg-primary-500/10 border border-primary-500/20">
            <div className="flex gap-3">
              <CheckCircle size={20} className="text-primary-400 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-primary-400 text-sm mb-1">{t.notice.title}</h3>
                <p className="text-dark-300 text-sm">{t.notice.message}</p>
              </div>
            </div>
          </div>

          {/* Benefits List for Professional */}
          {activeTab === 'professional' && (
            <div className="space-y-3">
              <p className="text-sm font-medium text-dark-400">Included features:</p>
              <ul className="space-y-2 text-sm text-dark-300">
                <li className="flex items-center gap-2">
                  <CheckCircle size={16} className="text-primary-400 flex-shrink-0" />
                  <span>Custom pricing based on your needs</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle size={16} className="text-primary-400 flex-shrink-0" />
                  <span>Dedicated account manager</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle size={16} className="text-primary-400 flex-shrink-0" />
                  <span>Priority support</span>
                </li>
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* Right Column - Form Section */}
      <div className="space-y-6">
        {/* Back Link and Notice (mobile only) */}
        <div className="md:hidden space-y-4">
          <div className="flex items-center gap-2">
            <Link href="/" className="text-dark-400 hover:text-primary-400 transition flex items-center gap-1">
              <ArrowLeft size={16} />
              <span className="text-sm">{t.backToHome}</span>
            </Link>
          </div>

          <div className="p-4 rounded-lg bg-primary-500/10 border border-primary-500/20">
            <div className="flex gap-3">
              <CheckCircle size={20} className="text-primary-400 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-primary-400 text-sm mb-1">{t.notice.title}</h3>
                <p className="text-dark-300 text-sm">{t.notice.message}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 border-b border-dark-700">
          <button
            onClick={() => setActiveTab('free')}
            className={`px-4 py-3 font-medium transition text-sm ${
              activeTab === 'free'
                ? 'border-b-2 border-primary-500 text-primary-400'
                : 'text-dark-400 hover:text-dark-300'
            }`}
          >
            {t.tabs.free}
          </button>
          <button
            onClick={() => setActiveTab('professional')}
            className={`px-4 py-3 font-medium transition text-sm ${
              activeTab === 'professional'
                ? 'border-b-2 border-primary-500 text-primary-400'
                : 'text-dark-400 hover:text-dark-300'
            }`}
          >
            {t.tabs.professional}
          </button>
        </div>

        {/* Free Form */}
        {activeTab === 'free' && (
          <div>
            <div className="mb-6 md:hidden">
              <h1 className="text-2xl font-bold text-white mb-2">{t.free.title}</h1>
              <p className="text-dark-400 text-sm">{t.free.subtitle}</p>
            </div>

            <form onSubmit={handleFreeSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label={t.free.fields.firstName}
                  type="text"
                  name="firstName"
                  value={freeFormData.firstName}
                  onChange={handleFreeChange}
                  required
                />

                <Input
                  label={t.free.fields.lastName}
                  type="text"
                  name="lastName"
                  value={freeFormData.lastName}
                  onChange={handleFreeChange}
                  required
                />
              </div>

              <Input
                label={t.free.fields.email}
                type="email"
                name="email"
                value={freeFormData.email}
                onChange={handleFreeChange}
                required
              />

              <Button
                type="submit"
                variant="primary"
                className="w-full"
                isLoading={isLoading}
                disabled={isLoading}
              >
                {isLoading ? t.free.submitting : t.free.submit}
              </Button>
            </form>
          </div>
        )}

        {/* Professional Form */}
        {activeTab === 'professional' && (
          <div>
            <div className="mb-6 md:hidden">
              <h1 className="text-2xl font-bold text-white mb-2">{t.professional.title}</h1>
              <p className="text-dark-400 text-sm">{t.professional.subtitle}</p>
            </div>

            <form onSubmit={handleProfSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label={t.professional.fields.firstName}
                  type="text"
                  name="firstName"
                  value={profFormData.firstName}
                  onChange={handleProfChange}
                  required
                />

                <Input
                  label={t.professional.fields.lastName}
                  type="text"
                  name="lastName"
                  value={profFormData.lastName}
                  onChange={handleProfChange}
                  required
                />

                <Input
                  label={t.professional.fields.email}
                  type="email"
                  name="email"
                  value={profFormData.email}
                  onChange={handleProfChange}
                  required
                />

                <Input
                  label={t.professional.fields.phone}
                  type="tel"
                  name="phone"
                  value={profFormData.phone}
                  onChange={handleProfChange}
                  required
                />

                <Input
                  label={t.professional.fields.company}
                  type="text"
                  name="company"
                  value={profFormData.company}
                  onChange={handleProfChange}
                  required
                />

                <Input
                  label={t.professional.fields.country}
                  type="text"
                  name="country"
                  value={profFormData.country}
                  onChange={handleProfChange}
                  required
                />

                <Input
                  label={t.professional.fields.numberOfTours}
                  type="number"
                  name="numberOfTours"
                  value={profFormData.numberOfTours}
                  onChange={handleProfChange}
                  min="1"
                  required
                />

                <Input
                  label={t.professional.fields.imagesPerTour}
                  type="number"
                  name="imagesPerTour"
                  value={profFormData.imagesPerTour}
                  onChange={handleProfChange}
                  min="1"
                  required
                />

                <Input
                  label={t.professional.fields.teamMembers}
                  type="number"
                  name="teamMembers"
                  value={profFormData.teamMembers}
                  onChange={handleProfChange}
                  min="1"
                  required
                />

                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    {t.professional.fields.frequency}
                  </label>
                  <select
                    name="frequency"
                    value={profFormData.frequency}
                    onChange={handleProfChange}
                    className="w-full px-4 py-2 rounded-lg bg-dark-700 border border-dark-600 text-white placeholder-dark-400 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                  >
                    <option value="monthly">{t.professional.frequency_options.monthly}</option>
                    <option value="annual">{t.professional.frequency_options.annual}</option>
                  </select>
                </div>
              </div>

              <Button
                type="submit"
                variant="primary"
                className="w-full"
                isLoading={isLoading}
                disabled={isLoading}
              >
                {isLoading ? t.professional.submitting : t.professional.submit}
              </Button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
