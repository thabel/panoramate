'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import { useUI } from '@/context/UIContext';

const translations = {
  en: {
    title: 'Request a Quote',
    subtitle: 'Tell us about your needs',
    fields: {
      company: 'Company',
      fullName: 'Full Name',
      country: 'Country',
      email: 'Email',
      phone: 'Phone Number',
      tours: 'Number of Virtual Tours Needed',
      imagesPerTour: 'Number of 360° Images per Tour',
      teamMembers: 'Number of Team Members',
      frequency: 'Subscription Type',
    },
    frequency_options: {
      monthly: 'Monthly',
      annual: 'Annual',
    },
    submit: 'Send Request',
    submitting: 'Sending...',
    backToHome: 'Back to Home',
    success: 'Quote request sent successfully!',
    error: 'Failed to send quote request',
  },
  fr: {
    title: 'Demande de Devis',
    subtitle: 'Parlez-nous de vos besoins',
    fields: {
      company: 'Sociéte',
      fullName: 'Nom et Prénoms',
      country: 'Pays',
      email: 'Email',
      phone: 'Téléphone',
      tours: 'Nombre de visites virtuelles dont vous avez besoin',
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
    backToHome: 'Retour à l\'accueil',
    success: 'Demande de devis envoyée avec succès!',
    error: 'Erreur lors de l\'envoi de la demande',
  },
};

export default function RequestQuotePage() {
  const { locale } = useUI();
  const t = translations[locale as keyof typeof translations];
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    company: '',
    fullName: '',
    country: '',
    email: '',
    phone: '',
    tours: '',
    imagesPerTour: '',
    teamMembers: '',
    frequency: 'monthly',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setIsLoading(true);
      const response = await fetch('/api/quote-request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast.success(t.success);
        setFormData({
          company: '',
          fullName: '',
          country: '',
          email: '',
          phone: '',
          tours: '',
          imagesPerTour: '',
          teamMembers: '',
          frequency: 'monthly',
        });
        // Redirect to home after success
        setTimeout(() => {
          window.location.href = '/';
        }, 2000);
      } else {
        toast.error(t.error);
      }
    } catch (error) {
      toast.error(t.error);
      console.error('Quote request error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-4">
        <Link href="/" className="text-dark-400 hover:text-primary-400 transition flex items-center gap-1">
          <ArrowLeft size={16} />
          <span className="text-sm">{t.backToHome}</span>
        </Link>
      </div>

      <div>
        <h1 className="text-2xl font-bold text-white mb-2">{t.title}</h1>
        <p className="text-dark-400 text-sm">{t.subtitle}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          {/* Company */}
          <div className="col-span-2">
            <Input
              label={t.fields.company}
              type="text"
              name="company"
              value={formData.company}
              onChange={handleChange}
              required
            />
          </div>

          {/* Full Name */}
          <div className="col-span-2">
            <Input
              label={t.fields.fullName}
              type="text"
              name="fullName"
              value={formData.fullName}
              onChange={handleChange}
              required
            />
          </div>

          {/* Country */}
          <Input
            label={t.fields.country}
            type="text"
            name="country"
            value={formData.country}
            onChange={handleChange}
            required
          />

          {/* Email */}
          <Input
            label={t.fields.email}
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
          />

          {/* Phone */}
          <Input
            label={t.fields.phone}
            type="tel"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            required
          />

          {/* Tours */}
          <Input
            label={t.fields.tours}
            type="number"
            name="tours"
            value={formData.tours}
            onChange={handleChange}
            min="1"
            required
          />

          {/* Images per Tour */}
          <Input
            label={t.fields.imagesPerTour}
            type="number"
            name="imagesPerTour"
            value={formData.imagesPerTour}
            onChange={handleChange}
            min="1"
            required
          />

          {/* Team Members */}
          <Input
            label={t.fields.teamMembers}
            type="number"
            name="teamMembers"
            value={formData.teamMembers}
            onChange={handleChange}
            min="1"
            required
          />

          {/* Frequency */}
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              {t.fields.frequency}
            </label>
            <select
              name="frequency"
              value={formData.frequency}
              onChange={handleChange}
              className="w-full px-4 py-2 rounded-lg bg-dark-700 border border-dark-600 text-white placeholder-dark-400 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
            >
              <option value="monthly">{t.frequency_options.monthly}</option>
              <option value="annual">{t.frequency_options.annual}</option>
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
          {isLoading ? t.submitting : t.submit}
        </Button>
      </form>
    </div>
  );
}
