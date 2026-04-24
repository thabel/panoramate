'use client';

import React, { useState } from 'react';
import { TourWithImages } from '@/types';
import { TourCard } from './TourCard';
import { Plus, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';
import toast from 'react-hot-toast';

interface ToursGridProps {
  initialTours: TourWithImages[];
}

export function ToursGrid({ initialTours }: ToursGridProps) {
  const [tours, setTours] = useState<TourWithImages[]>(initialTours);

  const handleDelete = async (tourId: string) => {
    if (!confirm('Are you sure you want to delete this tour?')) return;

    try {
      const response = await fetch(`/api/tours/${tourId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('Tour deleted');
        setTours(tours.filter((t) => t.id !== tourId));
      } else {
        toast.error('Failed to delete tour');
      }
    } catch (error) {
      toast.error('Error deleting tour');
      console.error('Delete error:', error);
    }
  };

  if (tours.length === 0) {
    return (
      <div className="p-12 text-center border rounded-lg bg-dark-800 border-dark-700">
        <ImageIcon size={48} className="mx-auto mb-4 text-dark-500" />
        <h3 className="mb-2 text-xl font-semibold text-white">No tours yet</h3>
        <p className="mb-6 text-dark-400">
          Create your first 360° virtual tour to get started
        </p>
        <Link href="/tours/new">
          <Button variant="primary" className="flex items-center gap-2 mx-auto">
            <Plus size={18} />
            Create Tour
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {tours.map((tour) => (
        <TourCard
          key={tour.id}
          tour={tour}
          onDelete={handleDelete}
        />
      ))}
    </div>
  );
}
