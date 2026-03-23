'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { TourWithImages } from '@/types';
import { PannellumViewer } from '@/components/viewer/PannellumViewer';
import { Button } from '@/components/ui/Button';
import { UploadZone } from '@/components/dashboard/UploadZone';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Save, ChevronLeft, ChevronRight, Image as ImageIcon, Plus, Trash2, X } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
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
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

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
      setIsUploadModalOpen(false);
      toast.success('Scenes added');
    }
  };

  const handleDeleteScene = async (e: React.MouseEvent, imageId: string) => {
    e.stopPropagation();
    
    if (tour && tour.images.length <= 1) {
      toast.error('At least one scene is required');
      return;
    }

    if (!confirm('Are you sure you want to delete this scene?')) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/tours/${params.id}/images`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token || ''}`,
        },
        body: JSON.stringify({ imageId }),
      });

      if (response.ok) {
        setTour({
          ...tour!,
          images: tour!.images.filter((img) => img.id !== imageId),
        });
        
        // Adjust current scene index if needed
        if (tour!.images[currentSceneIndex].id === imageId) {
          setCurrentSceneIndex(0);
        } else if (currentSceneIndex >= tour!.images.length - 1) {
          setCurrentSceneIndex(Math.max(0, tour!.images.length - 2));
        }
        
        toast.success('Scene deleted');
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || 'Failed to delete scene');
      }
    } catch (error) {
      toast.error('Error deleting scene');
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
      <div className="flex items-center justify-center h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!tour || tour.images.length === 0) {
    return (
      <div className="flex flex-col h-screen bg-dark-900">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-4 border-b bg-dark-800 border-dark-700">
          <div>
            <h1 className="text-xl font-bold text-white">{tour?.title || 'Tour'} - Editor</h1>
            <p className="text-sm text-dark-400">Add scenes to start editing</p>
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
        <div className="flex items-center justify-center flex-1 p-8">
          <div className="w-full max-w-xl space-y-8">
            <div className="text-center">
              <div className="flex items-center justify-center w-24 h-24 p-6 mx-auto mb-6 border-2 rounded-full bg-dark-800 border-dark-700">
                <ImageIcon className="text-primary-400" size={40} />
              </div>
              <h2 className="mb-2 text-2xl font-bold text-white">Your tour is empty</h2>
              <p className="text-dark-400">
                To start creating your virtual tour, you need to add at least one 360° scene.
              </p>
            </div>
            
            <div className="p-8 border shadow-2xl bg-dark-800 border-dark-700 rounded-xl">
              <UploadZone tourId={params.id} onUploadComplete={handleUploadComplete} />
            </div>
            
            <div className="text-center">
              <p className="text-sm text-dark-500">
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
    <div className="flex flex-col h-screen bg-dark-900">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-4 border-b bg-dark-800 border-dark-700">
        <div>
          <h1 className="text-xl font-bold text-white">{tour.title} - Editor</h1>
          <p className="text-sm text-dark-400">
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
      <div className="flex flex-1 overflow-hidden">
        {/* Viewer */}
        <div className="flex flex-col flex-1 overflow-hidden">
          <div className="relative flex-1 bg-black overflow-hidden">
            <PannellumViewer
              scenes={tour.images}
              initialSceneId={currentScene.id}
              editorMode={true}
              hotspots={tour.images.flatMap(img => (img as any).hotspots || [])}
            />
          </div>

          {/* Scene Navigation */}
          <div className="flex items-center flex-shrink-0 h-24 gap-4 px-4 py-2 border-t bg-dark-800 border-dark-700 z-10">
            <button
              onClick={() => setCurrentSceneIndex(Math.max(0, currentSceneIndex - 1))}
              disabled={currentSceneIndex === 0}
              className="flex-shrink-0 p-2 transition-colors rounded-lg hover:bg-dark-700 disabled:opacity-50"
            >
              <ChevronLeft size={20} />
            </button>

            <div className="flex items-center flex-1 gap-3 py-1 overflow-x-auto custom-scrollbar">
              {tour.images.map((image, index) => (
                <div key={image.id} className="relative group">
                  <button
                    onClick={() => setCurrentSceneIndex(index)}
                    className={`flex-shrink-0 w-24 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                      index === currentSceneIndex
                        ? 'border-primary-500 scale-105 shadow-lg shadow-primary-500/20'
                        : 'border-dark-600 hover:border-primary-400 opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img
                      src={`/api/uploads/${image.filename}`}
                      alt={`Scene ${index + 1}`}
                      className="object-cover w-full h-full"
                    />
                  </button>
                  <button
                    onClick={(e) => handleDeleteScene(e, image.id)}
                    className="absolute z-20 p-1 text-white transition-opacity bg-red-500 rounded-full opacity-0 -top-1 -right-1 group-hover:opacity-100 shadow-lg hover:bg-red-600"
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}

              <button
                onClick={() => setIsUploadModalOpen(true)}
                className="flex flex-col items-center justify-center flex-shrink-0 w-24 h-16 gap-1 transition-all border-2 border-dashed rounded-lg border-dark-600 hover:border-primary-400 hover:bg-dark-700 text-dark-400 hover:text-primary-400"
              >
                <Plus size={20} />
                <span className="text-[10px] font-medium">Add Scene</span>
              </button>
            </div>

            <button
              onClick={() =>
                setCurrentSceneIndex(
                  Math.min(tour.images.length - 1, currentSceneIndex + 1)
                )
              }
              disabled={currentSceneIndex === tour.images.length - 1}
              className="flex-shrink-0 p-2 transition-colors rounded-lg hover:bg-dark-700 disabled:opacity-50"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
      </div>

      {/* Upload Modal */}
      <Modal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        title="Add New Scenes"
      >
        <div className="p-4">
          <UploadZone tourId={params.id} onUploadComplete={handleUploadComplete} />
        </div>
      </Modal>
    </div>
  );
}
