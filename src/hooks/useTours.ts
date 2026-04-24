'use client';

import { useEffect, useState } from 'react';
import { TourWithImages } from '@/types';

export function useTours() {
  const [tours, setTours] = useState<TourWithImages[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTours = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/tours');

      if (!response.ok) {
        throw new Error('Failed to fetch tours');
      }

      const data = await response.json();

      if (data.success) {
        setTours(data.data.tours);
        setError(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch tours');
      console.error('Fetch tours error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTours();
  }, []);

  const createTour = async (title: string, description?: string) => {
    try {
      const response = await fetch('/api/tours', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          description,
          settings: {
            autorotate: true,
            mouseViewMode: 'drag',
            showControls: true,
          },
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create tour');
      }

      const data = await response.json();

      if (data.success) {
        setTours([data.data, ...tours]);
        return data.data;
      }
    } catch (err) {
      console.error('Create tour error:', err);
      throw err;
    }
  };

  const deleteTour = async (id: string) => {
    try {
      const response = await fetch(`/api/tours/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete tour');
      }

      setTours(tours.filter((tour) => tour.id !== id));
    } catch (err) {
      console.error('Delete tour error:', err);
      throw err;
    }
  };

  const refetch = async () => {
    await fetchTours();
  };

  return {
    tours,
    isLoading,
    error,
    createTour,
    deleteTour,
    refetch,
  };
}
