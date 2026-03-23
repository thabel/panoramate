'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { TourWithImages } from '@/types';
import { Button } from '@/components/ui/Button';
import { TourCard } from '@/components/dashboard/TourCard';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Plus, Search, Image } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ToursPage() {
  const [tours, setTours] = useState<TourWithImages[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchTours();
  }, [search]);

  const fetchTours = async () => {
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams();
      if (search) params.append('search', search);

      const response = await fetch(`/api/tours?${params}`, {
        headers: {
          Authorization: `Bearer ${token || ''}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setTours(data.data.tours);
      }
    } catch (error) {
      console.error('Fetch tours error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (tourId: string) => {
    if (!confirm('Delete this tour?')) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/tours/${tourId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token || ''}`,
        },
      });

      if (response.ok) {
        toast.success('Tour deleted');
        setTours(tours.filter((t) => t.id !== tourId));
      }
    } catch (error) {
      toast.error('Failed to delete tour');
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Tours</h1>
        <p className="text-dark-400">Manage all your virtual tours</p>
      </div>

      <div className="flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-3 text-dark-400" size={20} />
          <input
            type="text"
            placeholder="Search tours..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-dark-800 border border-dark-700 rounded-lg text-white placeholder-dark-500 focus:outline-none focus:border-primary-500"
          />
        </div>
        <Link href="/tours/new">
          <Button variant="primary" className="flex items-center gap-2">
            <Plus size={18} />
            New Tour
          </Button>
        </Link>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <LoadingSpinner size="md" />
        </div>
      ) : tours.length === 0 ? (
        <div className="bg-dark-800 border border-dark-700 rounded-lg p-12 text-center">
          <Image size={48} className="mx-auto text-dark-500 mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">No tours found</h3>
          <p className="text-dark-400 mb-6">
            {search
              ? 'Try a different search'
              : 'Create your first 360° virtual tour'}
          </p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tours.map((tour) => (
            <TourCard
              key={tour.id}
              tour={tour}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}
