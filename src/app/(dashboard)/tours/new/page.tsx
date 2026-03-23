'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import toast from 'react-hot-toast';

export default function NewTourPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      toast.error('Tour title is required');
      return;
    }

    setIsLoading(true);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/tours', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token || ''}`,
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const error = await response.json();
        toast.error(error.error || 'Failed to create tour');
        return;
      }

      const data = await response.json();

      if (data.success) {
        toast.success('Tour created!');
        router.push(`/tours/${data.data.id}`);
      }
    } catch (error) {
      toast.error('Error creating tour');
      console.error('Create tour error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl">
      <h1 className="text-3xl font-bold text-white mb-6">Create New Tour</h1>

      <form onSubmit={handleSubmit} className="bg-dark-800 border border-dark-700 rounded-lg p-8 space-y-6">
        <Input
          label="Tour Title"
          type="text"
          name="title"
          value={formData.title}
          onChange={handleChange}
          placeholder="My Amazing Property"
          required
        />

        <div>
          <label className="block text-sm font-medium text-dark-200 mb-2">
            Description
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="Add a description for your tour..."
            rows={4}
            className="w-full px-4 py-2 bg-dark-800 text-white rounded-lg border-2 border-dark-700 placeholder-dark-500 transition-colors focus:outline-none focus:border-primary-500"
          />
        </div>

        <div className="flex gap-4 pt-4">
          <Button
            type="submit"
            variant="primary"
            isLoading={isLoading}
          >
            Create Tour
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={() => router.back()}
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
