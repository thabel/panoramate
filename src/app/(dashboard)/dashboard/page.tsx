'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { TourWithImages } from '@/types';
import { Button } from '@/components/ui/Button';
import { StatsCard } from '@/components/ui/StatsCard';
import { UsageBar } from '@/components/ui/UsageBar';
import { TourCard } from '@/components/dashboard/TourCard';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Plus, Image, Eye, Users, HardDrive , 
  FileStack 
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function DashboardPage() {
  const { organization } = useAuth();
  const [tours, setTours] = useState<TourWithImages[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchTours();
  }, []);

  const fetchTours = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/tours?limit=6', {
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
    if (!confirm('Are you sure you want to delete this tour?')) return;

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
      } else {
        toast.error('Failed to delete tour');
      }
    } catch (error) {
      toast.error('Error deleting tour');
      console.error('Delete error:', error);
    }
  };

  if (!organization) return null;

  const totalImages = tours.reduce((acc, tour) => acc + tour.images.length, 0);
  const totalViews = tours.reduce((acc, tour) => acc + tour.viewCount, 0);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Dashboard</h1>
        <p className="text-dark-400">Welcome back! Here's your tour overview.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          icon={FileStack}
          label="Total Tours"
          value={tours.length}
        />
        <StatsCard
          icon={Image}
          label="Total Scenes"
          value={totalImages}
        />
        <StatsCard
          icon={Eye}
          label="Total Views"
          value={totalViews}
        />
        <StatsCard
          icon={Users}
          label="Team Members"
          value={1}
        />
      </div>

      {/* Storage Usage */}
      <div className="bg-dark-800 border border-dark-700 rounded-lg p-6">
        <h2 className="text-xl font-semibold text-white mb-4">Storage Usage</h2>
        <UsageBar
          label="Total Storage"
          used={organization.usedStorageMb}
          max={organization.totalStorageMb}
          unit=" MB"
        />
        <p className="text-sm text-dark-400 mt-2">
          {organization.usedStorageMb} MB of {organization.totalStorageMb} MB used
        </p>
      </div>

      {/* Recent Tours */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">Recent Tours</h2>
          <Link href="/tours/new">
            <Button variant="primary" size="sm" className="flex items-center gap-2">
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
            <h3 className="text-xl font-semibold text-white mb-2">No tours yet</h3>
            <p className="text-dark-400 mb-6">
              Create your first 360° virtual tour to get started
            </p>
            <Link href="/tours/new">
              <Button variant="primary" className="flex items-center gap-2 mx-auto">
                <Plus size={18} />
                Create Tour
              </Button>
            </Link>
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
    </div>
  );
}
