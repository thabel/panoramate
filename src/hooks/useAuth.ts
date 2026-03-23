'use client';

import { useEffect, useState } from 'react';
import { AuthUser, Organization } from '@/types';

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAuth = async () => {
      try {
        const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

        if (!token) {
          setIsLoading(false);
          return;
        }

        const response = await fetch('/api/auth/me', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          localStorage.removeItem('token');
          setIsLoading(false);
          return;
        }

        const data = await response.json();

        if (data.success) {
          setUser(data.data.user);
          setOrganization(data.data.organization);
        }
      } catch (err) {
        console.error('Auth fetch error:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAuth();
  }, []);

  const logout = async () => {
    try {
      const token = localStorage.getItem('token');
      if (token) {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
      }
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      localStorage.removeItem('token');
      setUser(null);
      setOrganization(null);
      window.location.href = '/';
    }
  };

  return {
    user,
    organization,
    isLoading,
    error,
    logout,
  };
}
