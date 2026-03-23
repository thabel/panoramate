'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { TourWithImages } from '@/types';
import { MarzipanoViewer } from '@/components/viewer/MarzipanoViewer';
import { Button } from '@/components/ui/Button';
import { UploadZone } from '@/components/dashboard/UploadZone';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Save, ChevronLeft, ChevronRight, Image as ImageIcon } from 'lucide-react';
import toast from 'react-hot-toast';

export default function TourEditorPage({
  params,
}: {
  params: { id: string };
}) {
  const searchParams = useSearchParams();
  const [tour, setTour] = useState<TourWithImages | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentSceneIndex, setCurrentSceneIndex] = useState(0);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchTour();
  }, []);

  const fetchTour = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/tours/${params.id}`, {
        headers: {
          Authorization: `Bearer ${token || ''}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setTour(data.data);

        const sceneParam = searchParams.get('scene');
        if (sceneParam) {
          const index = data.data.images.findIndex(
            (img: any) => img.id === sceneParam
          );
          if (index !== -1) {
            setCurrentSceneIndex(index);
          }
        }
      }
    } catch (error) {
      console.error('Fetch tour error:', error);
      toast.error('Failed to load tour');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUploadComplete = (files: any[]) => {
    if (tour) {
      setTour({
        ...tour,
        images: [...tour.images, ...files],
      });
    }
  };

  const handleSave = async () => {
    if (!tour) return;

    setIsSaving(true);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/tours/${tour.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token || ''}`,
        },
        body: JSON.stringify({
          status: 'PUBLISHED',
        }),
      });

      if (response.ok) {
        toast.success('Tour saved');
      } else {
        toast.error('Failed to save tour');
      }
    } catch (error) {
      toast.error('Error saving tour');
      console.error('Save error:', error);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!tour || tour.images.length === 0) {
    return (
      <div className="h-screen bg-dark-900 flex flex-col">
        {/* Header */}
        <div className="bg-dark-800 border-b border-dark-700 px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-white">{tour?.title || 'Tour'} - Editor</h1>
            <p className="text-dark-400 text-sm">Add scenes to start editing</p>
          </div>
          <Button
            variant="secondary"
            onClick={() => window.history.back()}
            className="flex items-center gap-2"
          >
            <ChevronLeft size={18} />
            Back
          </Button>
        </div>

        {/* Upload Zone Container */}
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="max-w-xl w-full space-y-8">
            <div className="text-center">
              <div className="bg-dark-800 p-6 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-6 border-2 border-dark-700">
                <ImageIcon className="text-primary-400" size={40} />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Your tour is empty</h2>
              <p className="text-dark-400">
                To start creating your virtual tour, you need to add at least one 360° scene.
              </p>
            </div>
            
            <div className="bg-dark-800 border border-dark-700 rounded-xl p-8 shadow-2xl">
              <UploadZone tourId={params.id} onUploadComplete={handleUploadComplete} />
            </div>
            
            <div className="text-center">
              <p className="text-dark-500 text-sm">
                After uploading, the editor will unlock and you'll be able to add hotspots and connect scenes.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const currentScene = tour.images[currentSceneIndex];

  return (
    <div className="h-screen bg-dark-900 flex flex-col">
      {/* Header */}
      <div className="bg-dark-800 border-b border-dark-700 px-4 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">{tour.title} - Editor</h1>
          <p className="text-dark-400 text-sm">
            Scene {currentSceneIndex + 1} of {tour.images.length}
          </p>
        </div>

        <div className="flex gap-2">
          <Button
            variant="secondary"
            onClick={() => window.history.back()}
            className="flex items-center gap-2"
          >
            <ChevronLeft size={18} />
            Back
          </Button>
          <Button
            variant="primary"
            onClick={handleSave}
            isLoading={isSaving}
            className="flex items-center gap-2"
          >
            <Save size={18} />
            Save
          </Button>
        </div>
      </div>

      {/* Main Editor */}
      <div className="flex-1 flex overflow-hidden">
        {/* Viewer */}
        <div className="flex-1 flex flex-col">
          <div className="flex-1 relative bg-black">
            <MarzipanoViewer
              scenes={tour.images}
              initialSceneId={currentScene.id}
              editorMode={true}
            />
          </div>

          {/* Scene Navigation */}
          <div className="bg-dark-800 border-t border-dark-700 px-4 py-4 flex items-center gap-4">
            <button
              onClick={() => setCurrentSceneIndex(Math.max(0, currentSceneIndex - 1))}
              disabled={currentSceneIndex === 0}
              className="p-2 hover:bg-dark-700 disabled:opacity-50 rounded-lg transition-colors"
            >
              <ChevronLeft size={20} />
            </button>

            <div className="flex-1 overflow-x-auto flex gap-2">
              {tour.images.map((image, index) => (
                <button
                  key={image.id}
                  onClick={() => setCurrentSceneIndex(index)}
                  className={`flex-shrink-0 w-20 h-16 rounded-lg overflow-hidden border-2 transition-colors ${
                    index === currentSceneIndex
                      ? 'border-primary-500'
                      : 'border-dark-600 hover:border-primary-400'
                  }`}
                >
                  <img
                    src={`/api/uploads/${image.filename}`}
                    alt={`Scene ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>

            <button
              onClick={() =>
                setCurrentSceneIndex(
                  Math.min(tour.images.length - 1, currentSceneIndex + 1)
                )
              }
              disabled={currentSceneIndex === tour.images.length - 1}
              className="p-2 hover:bg-dark-700 disabled:opacity-50 rounded-lg transition-colors"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
