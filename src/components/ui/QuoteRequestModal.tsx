'use client';

import { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { X } from 'lucide-react';
import toast from 'react-hot-toast';

interface QuoteRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  locale: 'en' | 'fr';
}

const translations = {
  en: {
    title: 'Request a Quote',
    subtitle: 'Tell us about your needs and we\'ll get back to you shortly',
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
    cancel: 'Cancel',
    success: 'Quote request sent successfully!',
    error: 'Failed to send quote request',
  },
  fr: {
    title: 'Demande de Devis',
    subtitle: 'Parlez-nous de vos besoins et nous vous recontacterons très bientôt',
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
    cancel: 'Annuler',
    success: 'Demande de devis envoyée avec succès!',
    error: 'Erreur lors de l\'envoi de la demande',
  },
};

export function QuoteRequestModal({ isOpen, onClose, locale }: QuoteRequestModalProps) {
  const t = translations[locale];
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
        onClose();
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
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
        <div className="w-full max-w-2xl mx-4 bg-dark-800 rounded-lg shadow-xl border border-dark-700 max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-dark-700">
            <div>
              <h2 className="text-2xl font-bold text-white">{t.title}</h2>
              <p className="text-dark-400 mt-1">{t.subtitle}</p>
            </div>
            <button
              onClick={onClose}
              className="p-1 text-dark-400 hover:text-white transition"
            >
              <X size={24} />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Company */}
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  {t.fields.company}
                </label>
                <Input
                  type="text"
                  name="company"
                  value={formData.company}
                  onChange={handleChange}
                  required
                />
              </div>

              {/* Full Name */}
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  {t.fields.fullName}
                </label>
                <Input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  required
                />
              </div>

              {/* Country */}
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  {t.fields.country}
                </label>
                <Input
                  type="text"
                  name="country"
                  value={formData.country}
                  onChange={handleChange}
                  required
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  {t.fields.email}
                </label>
                <Input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  {t.fields.phone}
                </label>
                <Input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  required
                />
              </div>

              {/* Tours */}
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  {t.fields.tours}
                </label>
                <Input
                  type="number"
                  name="tours"
                  value={formData.tours}
                  onChange={handleChange}
                  min="1"
                  required
                />
              </div>

              {/* Images per Tour */}
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  {t.fields.imagesPerTour}
                </label>
                <Input
                  type="number"
                  name="imagesPerTour"
                  value={formData.imagesPerTour}
                  onChange={handleChange}
                  min="1"
                  required
                />
              </div>

              {/* Team Members */}
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  {t.fields.teamMembers}
                </label>
                <Input
                  type="number"
                  name="teamMembers"
                  value={formData.teamMembers}
                  onChange={handleChange}
                  min="1"
                  required
                />
              </div>

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

            {/* Buttons */}
            <div className="flex gap-4 justify-end pt-6 border-t border-dark-700">
              <Button variant="secondary" onClick={onClose}>
                {t.cancel}
              </Button>
              <Button
                variant="primary"
                type="submit"
                isLoading={isLoading}
                disabled={isLoading}
              >
                {isLoading ? t.submitting : t.submit}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </Modal>
  );
}
