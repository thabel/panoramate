'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { TourWithImages } from '@/types';
import { MarzipanoViewer } from '@/components/viewer/MarzipanoViewer';
import { Button } from '@/components/ui/Button';
import { UploadZone } from '@/components/dashboard/UploadZone';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Badge } from '@/components/ui/Badge';
import { Save, ChevronLeft, ChevronRight, Image as ImageIcon, Plus, Trash2, X, MapPin, Share2 } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { ShareModal } from '@/components/dashboard/ShareModal';
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
  const [addHotspotMode, setAddHotspotMode] = useState(false);
  const [isHotspotModalOpen, setIsHotspotModalOpen] = useState(false);
  const [isManageHotspotModalOpen, setIsManageHotspotModalOpen] = useState(false);
  const [selectedHotspot, setSelectedHotspot] = useState<any>(null);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [newHotspotCoords, setNewHotspotCoords] = useState<{ yaw: number; pitch: number } | null>(null);
  const [hotspotForm, setHotspotForm] = useState({
    type: 'LINK',
    title: '',
    targetImageId: '',
  });

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
        const updatedImages = tour!.images.filter((img) => img.id !== imageId);
        setTour({
          ...tour!,
          images: updatedImages,
        });
        
        if (tour!.images[currentSceneIndex].id === imageId) {
          setCurrentSceneIndex(0);
        } else if (currentSceneIndex >= updatedImages.length) {
          setCurrentSceneIndex(Math.max(0, updatedImages.length - 1));
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

  const handlePanoramaClick = (yaw: number, pitch: number) => {
    if (addHotspotMode) {
      setNewHotspotCoords({ yaw, pitch });
      
      const potentialTargets = tour?.images.filter(img => img.id !== tour.images[currentSceneIndex].id) || [];
      const firstTarget = potentialTargets[0];
      
      setHotspotForm({
        type: 'LINK',
        title: firstTarget ? `To ${firstTarget.title || 'Next Scene'}` : 'New Hotspot',
        targetImageId: firstTarget?.id || '',
      });
      
      setIsHotspotModalOpen(true);
      setAddHotspotMode(false);
    }
  };

  const handleCreateHotspot = async () => {
    if (!newHotspotCoords || !tour) return;

    try {
      const currentImageId = tour.images[currentSceneIndex].id;
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/tours/${params.id}/images/${currentImageId}/hotspots`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token || ''}`,
        },
        body: JSON.stringify({
          ...newHotspotCoords,
          ...hotspotForm,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const newHotspot = data.data;
        
        setTour({
          ...tour,
          images: tour.images.map(img => 
            img.id === currentImageId 
              ? { ...img, hotspots: [...((img as any).hotspots || []), newHotspot] }
              : img
          )
        });
        
        setIsHotspotModalOpen(false);
        setNewHotspotCoords(null);
        toast.success('Hotspot created');
      } else {
        toast.error('Failed to create hotspot');
      }
    } catch (error) {
      toast.error('Error creating hotspot');
    }
  };

  const handleHotspotClick = (hotspot: any) => {
    setSelectedHotspot(hotspot);
    setIsManageHotspotModalOpen(true);
  };

  const confirmDeleteHotspot = async () => {
    if (!selectedHotspot || !tour) return;

    try {
      const currentImageId = tour.images[currentSceneIndex].id;
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/tours/${params.id}/images/${currentImageId}/hotspots`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token || ''}`,
        },
        body: JSON.stringify({ hotspotId: selectedHotspot.id }),
      });

      if (response.ok) {
        setTour({
          ...tour,
          images: tour.images.map(img => 
            img.id === currentImageId 
              ? { ...img, hotspots: (img as any).hotspots.filter((h: any) => h.id !== selectedHotspot.id) }
              : img
          )
        });
        setIsManageHotspotModalOpen(false);
        setSelectedHotspot(null);
        toast.success('Hotspot deleted');
      } else {
        toast.error('Failed to delete hotspot');
      }
    } catch (error) {
      toast.error('Error deleting hotspot');
    }
  };

  const navigateToHotspotTarget = () => {
    if (!selectedHotspot || !tour) return;
    
    if (selectedHotspot.type === 'LINK' && selectedHotspot.targetImageId) {
      const targetIndex = tour.images.findIndex(img => img.id === selectedHotspot.targetImageId);
      if (targetIndex !== -1) {
        setCurrentSceneIndex(targetIndex);
        setIsManageHotspotModalOpen(false);
        setSelectedHotspot(null);
      }
    } else {
      toast.error('This hotspot has no target scene');
    }
  };

  const handleHotspotMove = async (hotspot: any, newYaw: number, newPitch: number) => {
    try {
      const currentImageId = tour!.images[currentSceneIndex].id;
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/tours/${params.id}/images/${currentImageId}/hotspots`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token || ''}`,
        },
        body: JSON.stringify({
          hotspotId: hotspot.id,
          yaw: newYaw,
          pitch: newPitch,
        }),
      });

      if (response.ok) {
        setTour({
          ...tour!,
          images: tour!.images.map(img => 
            img.id === currentImageId 
              ? { 
                  ...img, 
                  hotspots: (img as any).hotspots.map((h: any) => 
                    h.id === hotspot.id ? { ...h, yaw: newYaw, pitch: newPitch } : h
                  ) 
                }
              : img
          )
        });
        toast.success('Hotspot moved');
      } else {
        toast.error('Failed to move hotspot');
      }
    } catch (error) {
      toast.error('Error moving hotspot');
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
          </div>
        </div>
      </div>
    );
  }

  const currentScene = tour.images[currentSceneIndex];

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-dark-900">
      {/* Header */}
      <div className="flex items-center justify-between flex-shrink-0 h-16 px-6 py-4 border-b bg-dark-800 border-dark-700 z-20">
        <div className="flex items-center gap-4">
          <div className="text-xl font-bold text-transparent bg-gradient-to-r from-primary-400 to-primary-600 bg-clip-text">
            Panoramate
          </div>
          <div className="w-px h-6 bg-dark-700" />
          <h1 className="text-lg font-semibold text-white truncate max-w-[300px]">{tour.title}</h1>
          <Badge variant="default" className="ml-2">
            Scene {currentSceneIndex + 1} / {tour.images.length}
          </Badge>
        </div>

        <div className="flex gap-3">
          <Button
            variant="secondary"
            onClick={() => setIsShareModalOpen(true)}
            className="flex items-center gap-2"
          >
            <Share2 size={18} />
            Share
          </Button>
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
            className="flex items-center gap-2 px-6"
          >
            <Save size={18} />
            Save
          </Button>
        </div>
      </div>

      {/* Main Editor Area */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* Left Action Sidebar */}
        <aside className="w-20 bg-dark-800 border-r border-dark-700 flex flex-col items-center py-6 gap-6 z-20">
          <button
            onClick={() => setAddHotspotMode(!addHotspotMode)}
            title={addHotspotMode ? 'Cancel Add Hotspot' : 'Add Hotspot'}
            className={`p-3 rounded-xl transition-all duration-200 ${
              addHotspotMode 
                ? 'bg-primary-600 text-white shadow-[0_0_15px_rgba(99,102,241,0.4)]' 
                : 'text-dark-400 hover:text-white hover:bg-dark-700'
            }`}
          >
            <MapPin size={24} />
          </button>
          
          <button
            onClick={() => setIsUploadModalOpen(true)}
            title="Add New Scene"
            className="p-3 rounded-xl text-dark-400 hover:text-white hover:bg-dark-700 transition-all duration-200"
          >
            <Plus size={24} />
          </button>

          <div className="w-8 h-px bg-dark-700 my-2" />

          <button
            onClick={handleSave}
            title="Save Tour"
            className="p-3 rounded-xl text-dark-400 hover:text-white hover:bg-dark-700 transition-all duration-200"
          >
            <Save size={24} />
          </button>
        </aside>

        {/* Viewer Area */}
        <div className="flex-1 relative overflow-hidden">
          <div className="absolute inset-0 pb-24">
            <MarzipanoViewer
              scenes={tour.images}
              initialSceneId={currentScene.id}
              editorMode={true}
              addHotspotMode={addHotspotMode}
              onPanoramaClick={handlePanoramaClick}
              onHotspotClick={handleHotspotClick}
              onHotspotMove={handleHotspotMove}
              hotspots={tour.images.flatMap(img => (img as any).hotspots || [])}
            />
          </div>

          {/* Scene Navigation (Bottom) */}
          <div className="absolute bottom-0 left-0 right-0 z-10 flex items-center h-24 gap-6 px-6 py-2 border-t bg-dark-900/80 backdrop-blur-md border-dark-700">
            <button
              onClick={() => setCurrentSceneIndex(Math.max(0, currentSceneIndex - 1))}
              disabled={currentSceneIndex === 0}
              className="flex-shrink-0 p-2.5 transition-all rounded-full bg-dark-800 hover:bg-dark-700 border border-dark-700 disabled:opacity-30 shadow-lg text-white"
            >
              <ChevronLeft size={24} />
            </button>

            <div className="flex items-center flex-1 gap-4 py-1 overflow-x-auto no-scrollbar scroll-smooth">
              {tour.images.map((image, index) => (
                <div key={image.id} className="relative flex-shrink-0 group">
                  <button
                    onClick={() => setCurrentSceneIndex(index)}
                    className={`relative w-28 h-16 rounded-xl overflow-hidden border-2 transition-all duration-300 ${
                      index === currentSceneIndex
                        ? 'border-primary-500 scale-105 shadow-[0_0_15px_rgba(99,102,241,0.4)]'
                        : 'border-transparent hover:border-dark-500 opacity-60 hover:opacity-100'
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
                    className="absolute z-20 p-1.5 text-white transition-all bg-red-500 rounded-full opacity-0 -top-2 -right-2 group-hover:opacity-100 shadow-xl hover:bg-red-600 hover:scale-110"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}

              <button
                onClick={() => setIsUploadModalOpen(true)}
                className="flex flex-col items-center justify-center flex-shrink-0 w-28 h-16 gap-1.5 transition-all border-2 border-dashed rounded-xl border-dark-600 hover:border-primary-500 hover:bg-dark-800/50 text-dark-400 hover:text-primary-400 group"
              >
                <div className="p-1 transition-colors rounded-full bg-dark-700 group-hover:bg-primary-500/20">
                  <Plus size={18} />
                </div>
                <span className="text-[11px] font-semibold uppercase tracking-wider">Add Scene</span>
              </button>
            </div>

            <button
              onClick={() =>
                setCurrentSceneIndex(
                  Math.min(tour.images.length - 1, currentSceneIndex + 1)
                )
              }
              disabled={currentSceneIndex === tour.images.length - 1}
              className="flex-shrink-0 p-2.5 transition-all rounded-full bg-dark-800 hover:bg-dark-700 border border-dark-700 disabled:opacity-30 shadow-lg text-white"
            >
              <ChevronRight size={24} />
            </button>
          </div>
        </div>
      </div>

      <Modal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        title="Add New Scenes"
      >
        <div className="p-4">
          <UploadZone tourId={params.id} onUploadComplete={handleUploadComplete} />
        </div>
      </Modal>

      <Modal
        isOpen={isHotspotModalOpen}
        onClose={() => {
          setIsHotspotModalOpen(false);
          setAddHotspotMode(false);
          setNewHotspotCoords(null);
        }}
        title="Configure Hotspot"
      >
        <div className="p-6 space-y-4">
          <div>
            <label className="block mb-1 text-sm font-medium text-dark-300">Type</label>
            <select
              value={hotspotForm.type}
              onChange={(e) => setHotspotForm({ ...hotspotForm, type: e.target.value })}
              className="w-full px-3 py-2 text-white border rounded-lg outline-none bg-dark-700 border-dark-600 focus:border-primary-500"
            >
              <option value="LINK">Link to Scene</option>
              <option value="INFO">Information Box</option>
            </select>
          </div>

          <div>
            <label className="block mb-1 text-sm font-medium text-dark-300">Title</label>
            <input
              type="text"
              value={hotspotForm.title}
              onChange={(e) => setHotspotForm({ ...hotspotForm, title: e.target.value })}
              placeholder="Hotspot title"
              className="w-full px-3 py-2 text-white border rounded-lg outline-none bg-dark-700 border-dark-600 focus:border-primary-500"
            />
          </div>

          {hotspotForm.type === 'LINK' && (
            <div>
              <label className="block mb-1 text-sm font-medium text-dark-300">Target Scene</label>
              <select
                value={hotspotForm.targetImageId}
                onChange={(e) => setHotspotForm({ ...hotspotForm, targetImageId: e.target.value })}
                className="w-full px-3 py-2 text-white border rounded-lg outline-none bg-dark-700 border-dark-600 focus:border-primary-500"
              >
                <option value="">Select a scene</option>
                {tour.images
                  .filter(img => img.id !== tour.images[currentSceneIndex].id)
                  .map(img => (
                    <option key={img.id} value={img.id}>
                      {img.title || `Scene ${img.order + 1}`}
                    </option>
                  ))
                }
              </select>
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <Button
              variant="secondary"
              onClick={() => {
                setIsHotspotModalOpen(false);
                setAddHotspotMode(false);
                setNewHotspotCoords(null);
              }}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleCreateHotspot}
              className="flex-1"
              disabled={hotspotForm.type === 'LINK' && !hotspotForm.targetImageId}
            >
              Create Hotspot
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={isManageHotspotModalOpen}
        onClose={() => {
          setIsManageHotspotModalOpen(false);
          setSelectedHotspot(null);
        }}
        title="Manage Hotspot"
      >
        <div className="p-6 space-y-4">
          <div className="flex items-center gap-4 p-4 border rounded-lg bg-dark-700 border-dark-600">
            <div className="p-3 rounded-full bg-primary-500/20 text-primary-400">
              <MapPin size={24} />
            </div>
            <div>
              <p className="text-sm font-medium text-dark-300">Hotspot Title</p>
              <p className="text-lg font-bold text-white">{selectedHotspot?.title || 'Unnamed Hotspot'}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Button
              variant="secondary"
              onClick={navigateToHotspotTarget}
              className="flex items-center justify-center gap-2 py-6"
            >
              <ChevronRight size={20} />
              Go to Scene
            </Button>
            
            <Button
              variant="secondary"
              onClick={confirmDeleteHotspot}
              className="flex items-center justify-center gap-2 py-6 text-red-400 hover:text-red-300 hover:bg-red-500/10"
            >
              <Trash2 size={20} />
              Delete
            </Button>
          </div>

          <Button
            variant="secondary"
            onClick={() => {
              setIsManageHotspotModalOpen(false);
              setSelectedHotspot(null);
            }}
            className="w-full"
          >
            Cancel
          </Button>
        </div>
      </Modal>
    </div>
  );
}
