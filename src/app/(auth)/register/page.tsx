'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import toast from 'react-hot-toast';
import { useUI } from '@/context/UIContext';
import { dictionaries } from '@/lib/i18n';

export default function RegisterPage() {
  const router = useRouter();
  const { locale } = useUI();
  const t = dictionaries[locale].auth.register;
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    organizationName: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = t.errors.firstNameRequired;
    }
    if (!formData.lastName.trim()) {
      newErrors.lastName = t.errors.lastNameRequired;
    }
    if (!formData.email.includes('@')) {
      newErrors.email = t.errors.validEmailRequired;
    }
    if (formData.password.length < 8) {
      newErrors.password = t.errors.passwordMinLength;
    }
    if (!formData.organizationName.trim()) {
      newErrors.organizationName = t.errors.organizationNameRequired;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      toast.error(t.errors.fixFormErrors);
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const error = await response.json();
        toast.error(error.error || t.errors.registrationFailed);
        return;
      }

      const data = await response.json();

      if (data.success) {
        localStorage.setItem('token', data.data.token);
        localStorage.setItem('organization', JSON.stringify(data.data.organization));
        toast.success(t.errors.accountCreated);
        router.push('/dashboard');
      }
    } catch (error) {
      toast.error(t.errors.genericError);
      console.error('Register error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h1 className="mb-2 text-2xl font-bold text-white">{t.title}</h1>
      {/* <p className="mb-6 text-sm text-dark-400">
        14-day free trial • No credit card required
      </p> */}

      {/* <Alert variant="info">
        Start your free trial and create your first 360° virtual tour today!
      </Alert> */}

      <div className="grid grid-cols-2 gap-4">
        <Input
          label={t.firstNameLabel}
          type="text"
          name="firstName"
          value={formData.firstName}
          onChange={handleChange}
          placeholder="John"
          error={errors.firstName}
        />
        <Input
          label={t.lastNameLabel}
          type="text"
          name="lastName"
          value={formData.lastName}
          onChange={handleChange}
          placeholder="Doe"
          error={errors.lastName}
        />
      </div>

      <Input
        label={t.emailLabel}
        type="email"
        name="email"
        value={formData.email}
        onChange={handleChange}
        placeholder="you@example.com"
        error={errors.email}
      />

      <Input
        label={t.passwordLabel}
        type="password"
        name="password"
        value={formData.password}
        onChange={handleChange}
        placeholder="••••••••"
        helperText={t.passwordHelper}
        error={errors.password}
      />

      <Input
        label={t.organizationNameLabel}
        type="text"
        name="organizationName"
        value={formData.organizationName}
        onChange={handleChange}
        placeholder="Your Company"
        error={errors.organizationName}
      />

      <Button
        type="submit"
        variant="primary"
        className="w-full"
        isLoading={isLoading}
      >
        {t.submit}
      </Button>

      <p className="text-sm text-center text-dark-400">
        {t.hasAccount}{' '}
        <Link href="/login" className="text-primary-400 hover:text-primary-300">
          {t.signIn}
        </Link>
      </p>
    </form>
  );
}
