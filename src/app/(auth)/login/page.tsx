'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import toast from 'react-hot-toast';
import { useUI } from '@/context/UIContext';
import { dictionaries } from '@/lib/i18n';

export default function LoginPage() {
  const router = useRouter();
  const { locale } = useUI();
  const t = dictionaries[locale].auth.login;
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        toast.error(error.error || t.loginFailed);
        return;
      }

      const data = await response.json();

      if (data.success) {
        localStorage.setItem('user', JSON.stringify(data.data.user));
        localStorage.setItem('organization', JSON.stringify(data.data.organization));
        toast.success(t.welcomeBackToast);
        router.push('/dashboard');
      }
    } catch (error) {
      toast.error(t.genericError);
      console.error('Login error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h1 className="mb-6 text-2xl font-bold text-white">{t.title}</h1>

      <Input
        label={t.emailLabel}
        type="email"
        name="email"
        value={formData.email}
        onChange={handleChange}
        placeholder="you@example.com"
        required
        error={errors.email}
      />

      <Input
        label={t.passwordLabel}
        type="password"
        name="password"
        value={formData.password}
        onChange={handleChange}
        placeholder="••••••••"
        required
        error={errors.password}
      />

      <div className="flex items-center">
        <input
          type="checkbox"
          name="rememberMe"
          checked={formData.rememberMe}
          onChange={handleChange}
          className="w-4 h-4 rounded border-dark-600 bg-dark-800 text-primary-600 focus:ring-primary-500"
        />
        <label className="ml-2 text-sm text-dark-300">{t.rememberMe}</label>
      </div>

      <Button
        type="submit"
        variant="primary"
        className="w-full"
        isLoading={isLoading}
      >
        {t.submit}
      </Button>

      <p className="text-sm text-center text-dark-400">
        {t.noAccount}{' '}
        <Link href="/register" className="text-primary-400 hover:text-primary-300">
          {t.signUp}
        </Link>
      </p>
    </form>
  );
}
