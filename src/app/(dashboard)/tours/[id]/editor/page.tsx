
'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useUI } from '@/context/UIContext';
import { useSearchParams } from 'next/navigation';
import { TourWithImages, TourImage } from '@/types';
import { MarzipanoViewer } from '@/components/viewer/MarzipanoViewer';
import { Button } from '@/components/ui/Button';
import { UploadZone } from '@/components/dashboard/UploadZone';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Badge } from '@/components/ui/Badge';
import { Save, ChevronLeft, ChevronRight, Image as ImageIcon, Plus, Trash2, X, MapPin, Share2, Edit2, Search, Settings, Music, Volume2, Link as LinkIcon, Info, ExternalLink, Video, FileText, ArrowRight, Zap } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { ShareModal } from '@/components/dashboard/ShareModal';
import { logger } from '@/lib/logger';
import toast from 'react-hot-toast';

export default function TourEditorPage({
  params,
}: {
  params: { id: string };
}) {
  const searchParams = useSearchParams();
  const { isHotspotPanelOpen, setIsHotspotPanelOpen, isHotspotPanelCollapsed, setIsHotspotPanelCollapsed } = useUI();
  const [mounted, setMounted] = useState(false);
  const [tour, setTour] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentSceneIndex, setCurrentSceneIndex] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [addHotspotMode, setAddHotspotMode] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isRenameModalOpen, setIsRenameModalOpen] = useState(false);
  const [newSceneTitle, setNewSceneTitle] = useState('');
  const [selectedHotspot, setSelectedHotspot] = useState<any | null>(null);
  const [isHotspotActionModalOpen, setIsHotspotActionModalOpen] = useState(false);
  const [newHotspotCoords, setNewHotspotCoords] = useState<{ yaw: number; pitch: number } | null>(null);
  const [sceneSearchQuery, setSceneSearchQuery] = useState('');
  const [selectionMode, setSelectionMode] = useState<'name' | 'image'>('name');
  const [hotspotForm, setHotspotForm] = useState({
    type: 'LINK',
    title: '',
    targetImageId: '',
    content: '',
    url: '',
    videoUrl: '',
    imageUrl: '',
    animationType: 'NONE',
    color: '#6366f1',
    scale: 1.0,
    iconUrl: '',
  });
  const [showSceneMenu, setShowSceneMenu] = useState(true);
  const [showHotspotTitles, setShowHotspotTitles] = useState(true);

  // Memoize hotspots to prevent new array reference on every render
  const allHotspots = useMemo(() => {
    if (!tour) return [];
    return tour.images.flatMap((img: any) => (img.hotspots || []).map((h: any) => ({ ...h, imageId: img.id })));
  }, [tour]);

  useEffect(() => {
    setMounted(true);
    fetchTour();
  }, []);

  const handleAudioUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !tour) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/tours/${tour.id}/audio`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token || ''}`,
        },
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        setTour({
          ...tour,
          backgroundAudioUrl: data.data.backgroundAudioUrl,
        });
        toast.success('Audio uploaded');
      } else {
        toast.error('Failed to upload audio');
      }
    } catch (error) {
      toast.error('Error uploading audio');
    }
  };

  const handleRemoveAudio = async () => {
    if (!tour || !confirm('Are you sure you want to remove the background audio?')) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/tours/${tour.id}/audio`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token || ''}`,
        },
      });

      if (response.ok) {
        setTour({
          ...tour,
          backgroundAudioUrl: undefined,
        });
        toast.success('Audio removed');
      } else {
        toast.error('Failed to remove audio');
      }
    } catch (error) {
      toast.error('Error removing audio');
    }
  };

  const handleVolumeChange = async (volume: number) => {
    if (!tour) return;
    
    // Update local state first for responsiveness
    setTour({ ...tour, backgroundAudioVolume: volume });

    try {
      const token = localStorage.getItem('token');
      await fetch(`/api/tours/${tour.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token || ''}`,
        },
        body: JSON.stringify({
          backgroundAudioVolume: volume,
        }),
      });
    } catch (error) {
      console.error('Error updating volume:', error);
    }
  };

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
        const updatedImages = tour!.images.filter((img: TourImage) => img.id !== imageId);
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
      console.log("thabel/trying adding ahost stop", { yaw, pitch });
      logger.debug({ yaw, pitch }, 'Panorama clicked in hotspot mode, setting coordinates');
      setNewHotspotCoords({ yaw, pitch });
      setHotspotForm({
        ...hotspotForm,
        targetImageId: tour?.images.find((img: TourImage) => img.id !== tour.images[currentSceneIndex].id)?.id || '',
      });
      setIsHotspotPanelOpen(true);
      // We keep addHotspotMode true until it's actually created or cancelled
    }
  };

  const uploadHotspotIcon = async (file: File) => {
    if (!tour) return;

    const formData = new FormData();
    formData.append('icon', file);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/tours/${tour.id}/icons`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token || ''}`,
        },
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        setHotspotForm({ ...hotspotForm, iconUrl: data.data.iconUrl });
        toast.success('Icon uploaded successfully');
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to upload icon');
      }
    } catch (error) {
      console.error('Error uploading icon:', error);
      toast.error('Error uploading icon');
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
        logger.info({ tourId: params.id, imageId: currentImageId, hotspotId: newHotspot.id }, 'Hotspot created successfully');
        
        setTour({
          ...tour,
          images: tour.images.map((img: TourImage) =>
            img.id === currentImageId
              ? { ...img, hotspots: [...((img as any).hotspots || []), newHotspot] }
              : img
          )
        });
        
        setIsHotspotPanelOpen(false);
        setAddHotspotMode(false);
        setNewHotspotCoords(null);
        setSceneSearchQuery('');
        setHotspotForm({
          type: 'LINK',
          title: '',
          targetImageId: '',
          content: '',
          url: '',
          videoUrl: '',
          imageUrl: '',
          animationType: 'NONE',
          color: '#6366f1',
          scale: 1.0,
          iconUrl: '',
        });
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
    setIsHotspotActionModalOpen(true);
  };

  const confirmDeleteHotspot = async () => {
    if (!selectedHotspot || !tour) return;
    if (!confirm('Are you sure you want to delete this hotspot?')) return;

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
          images: tour.images.map((img: TourImage) =>
            img.id === currentImageId
              ? { ...img, hotspots: (img as any).hotspots.filter((h: any) => h.id !== selectedHotspot.id) }
              : img
          )
        });
        setIsHotspotActionModalOpen(false);
        setSelectedHotspot(null);
        toast.success('Hotspot deleted');
      } else {
        toast.error('Failed to delete hotspot');
      }
    } catch (error) {
      toast.error('Error deleting hotspot');
    }
  };

  const goToTargetScene = () => {
    if (!selectedHotspot || selectedHotspot.type !== 'LINK' || !selectedHotspot.targetImageId) return;

    const index = tour!.images.findIndex((img: TourImage) => img.id === selectedHotspot.targetImageId);
    if (index !== -1) {
      setCurrentSceneIndex(index);
      setIsHotspotActionModalOpen(false);
      setSelectedHotspot(null);
    } else {
      toast.error('Target scene not found');
    }
  };

  const handleRenameScene = async () => {
    if (!tour || !newSceneTitle.trim()) return;

    try {
      const currentImageId = tour.images[currentSceneIndex].id;
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/tours/${params.id}/images`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token || ''}`,
        },
        body: JSON.stringify({
          imageId: currentImageId,
          title: newSceneTitle.trim(),
        }),
      });

      if (response.ok) {
        setTour({
          ...tour,
          images: tour.images.map((img: TourImage, idx: number) =>
            idx === currentSceneIndex ? { ...img, title: newSceneTitle.trim() } : img
          ),
        });
        setIsRenameModalOpen(false);
        toast.success('Scene renamed');
      } else {
        toast.error('Failed to rename scene');
      }
    } catch (error) {
      toast.error('Error renaming scene');
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !tour) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/tours/${tour.id}/logo`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token || ''}`,
        },
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        setTour({
          ...tour,
          customLogoUrl: data.data.customLogoUrl,
        });
        toast.success('Logo uploaded');
      } else {
        toast.error('Failed to upload logo');
      }
    } catch (error) {
      toast.error('Error uploading logo');
    }
  };

  const handleRemoveLogo = async () => {
    if (!tour || !confirm('Are you sure you want to remove the logo?')) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/tours/${tour.id}/logo`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token || ''}`,
        },
      });

      if (response.ok) {
        setTour({
          ...tour,
          customLogoUrl: undefined,
        });
        toast.success('Logo removed');
      } else {
        toast.error('Failed to remove logo');
      }
    } catch (error) {
      toast.error('Error removing logo');
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
          showSceneMenu,
          showHotspotTitles,
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

  const renderHotspotPanel = () => {
    if (!isHotspotPanelOpen || !mounted) return null;

    const slot = document.getElementById('hotspot-panel-slot');
    if (!slot) return null;

    return createPortal(
      <div className="flex flex-col h-full overflow-hidden text-white">
        {isHotspotPanelCollapsed ? (
          <div className="flex flex-col items-center py-6 gap-6">
             <button
              onClick={() => setIsHotspotPanelCollapsed(false)}
              className="p-2 transition-colors rounded-lg hover:bg-dark-700 text-primary-400"
              title="Expand Panel"
            >
              <ChevronLeft size={20} />
            </button>
            <div className="w-px h-12 bg-dark-700" />
            <div className="vertical-text text-[10px] font-bold text-dark-400 uppercase tracking-[0.2em] whitespace-nowrap select-none" style={{ writingMode: 'vertical-rl' }}>
              Configuration
            </div>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between px-6 py-4 border-b border-dark-700 bg-dark-900/50">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsHotspotPanelCollapsed(true)}
                  className="p-1 transition-colors rounded-lg hover:bg-dark-700 text-dark-400"
                  title="Collapse Panel"
                >
                  <ChevronRight size={20} />
                </button>
                <h2 className="text-lg font-semibold text-white">Configure Hotspot</h2>
              </div>
              <button
                onClick={() => {
                  setIsHotspotPanelOpen(false);
                  setAddHotspotMode(false);
                  setNewHotspotCoords(null);
                  setSceneSearchQuery('');
                }}
                className="p-1 transition-colors rounded-lg hover:bg-dark-700 text-dark-400"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="flex-1 p-6 space-y-6 overflow-y-auto scrollbar-hide">
              <div className="space-y-4">
                <div>
                  <label className="block mb-2 text-sm font-medium text-dark-300">Hotspot Type</label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { value: 'LINK', label: 'Link to Scene', icon: LinkIcon, color: 'from-blue-500 to-blue-600' },
                      { value: 'INFO', label: 'Information', icon: Info, color: 'from-indigo-500 to-indigo-600' },
                      { value: 'URL', label: 'External Link', icon: ExternalLink, color: 'from-green-500 to-green-600' },
                      { value: 'VIDEO', label: 'Video', icon: Video, color: 'from-red-500 to-red-600' },
                    ].map(({ value, label, icon: IconComponent, color }) => (
                      <button
                        key={value}
                        onClick={() => setHotspotForm({ ...hotspotForm, type: value })}
                        className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-xs font-medium transition-all border ${
                          hotspotForm.type === value
                            ? `bg-gradient-to-r ${color} text-white border-transparent shadow-lg scale-105`
                            : 'bg-dark-700 text-dark-300 border-dark-600 hover:border-dark-500 hover:text-white'
                        }`}
                      >
                        <IconComponent size={16} />
                        <span>{label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="flex items-center block gap-2 mb-2 text-sm font-medium text-dark-300">
                    <Zap size={16} className="text-primary-400" />
                    Hotspot Title
                  </label>
                  <input
                    type="text"
                    value={hotspotForm.title}
                    onChange={(e) => setHotspotForm({ ...hotspotForm, title: e.target.value })}
                    placeholder="e.g. Living Room"
                    className="w-full px-3 py-2 text-sm text-white transition-all border rounded-lg outline-none bg-dark-700 border-dark-600 focus:border-primary-500"
                  />
                </div>
              </div>

              {/* Customization Options */}
              <div className="pt-4 space-y-4 border-t border-dark-700">
                <div className="flex items-center gap-2 p-3 rounded-lg bg-primary-500/10 border border-primary-500/20">
                  <Zap size={18} className="text-primary-400 flex-shrink-0" />
                  <div>
                    <p className="text-xs font-semibold text-primary-400">Customize Appearance</p>
                    <p className="text-[11px] text-primary-300">Animations & Colors</p>
                  </div>
                </div>

                {/* Animation Type */}
                <div>
                  <label className="block mb-2 text-sm font-medium text-dark-300">Animation</label>
                  <select
                    value={hotspotForm.animationType || 'NONE'}
                    onChange={(e) => setHotspotForm({ ...hotspotForm, animationType: e.target.value })}
                    className="w-full px-3 py-2 text-sm text-white transition-all border rounded-lg outline-none bg-dark-700 border-dark-600 focus:border-primary-500"
                  >
                    <option value="NONE">None</option>
                    <option value="PULSE">Pulse</option>
                    <option value="GLOW">Glow</option>
                    <option value="BOUNCE">Bounce</option>
                    <option value="FLOAT">Float</option>
                  </select>
                </div>

                {/* Color Picker */}
                <div>
                  <label className="block mb-2 text-sm font-medium text-dark-300">Color</label>
                  <input
                    type="color"
                    value={hotspotForm.color || '#6366f1'}
                    onChange={(e) => setHotspotForm({ ...hotspotForm, color: e.target.value })}
                    className="w-full h-10 rounded-lg cursor-pointer transition-all border border-dark-600"
                  />
                </div>

                {/* Scale/Size */}
                <div>
                  <label className="block mb-2 text-sm font-medium text-dark-300">
                    Size: {(hotspotForm.scale || 1.0).toFixed(1)}x
                  </label>
                  <input
                    type="range"
                    min="0.5"
                    max="2"
                    step="0.1"
                    value={hotspotForm.scale || 1.0}
                    onChange={(e) => setHotspotForm({ ...hotspotForm, scale: parseFloat(e.target.value) })}
                    className="w-full h-2 bg-dark-700 rounded-lg cursor-pointer appearance-none"
                  />
                </div>
              </div>

              {/* Link to Scene */}
              {hotspotForm.type === 'LINK' && (
                <div className="pt-4 space-y-4 border-t border-dark-700">
                  <div className="flex flex-col gap-3">
                    <label className="flex items-center gap-2 text-sm font-semibold text-white">
                      Target Scene
                    </label>
                    <div className="flex w-full p-1 border rounded-lg bg-dark-900 border-dark-700">
                      <button
                        onClick={() => setSelectionMode('name')}
                        className={`flex-1 py-1.5 px-2 text-xs font-medium rounded-md transition-all flex items-center justify-center gap-1 ${
                          selectionMode === 'name' ? 'bg-primary-600 text-white' : 'text-dark-400'
                        }`}
                      >
                        By name
                      </button>
                      <button
                        onClick={() => setSelectionMode('image')}
                        className={`flex-1 py-1.5 px-2 text-xs font-medium rounded-md transition-all flex items-center justify-center gap-1 ${
                          selectionMode === 'image' ? 'bg-primary-600 text-white' : 'text-dark-400'
                        }`}
                      >
                        By image
                      </button>
                    </div>
                  </div>

                  {selectionMode === 'name' ? (
                    <div className="space-y-3">
                      <div className="relative">
                        <Search className="absolute -translate-y-1/2 left-3 top-1/2 text-dark-400" size={16} />
                        <input
                          type="text"
                          placeholder="Search scene..."
                          value={sceneSearchQuery}
                          onChange={(e) => setSceneSearchQuery(e.target.value)}
                          className="w-full py-2 pl-10 pr-4 text-xs text-white border rounded-lg outline-none bg-dark-900 border-dark-700 focus:border-primary-500"
                        />
                      </div>
                      <div className="pr-1 space-y-1 overflow-y-auto max-h-48 scrollbar-thin">
                        {tour.images
                          .filter((img: TourImage) =>
                            img.id !== tour.images[currentSceneIndex].id &&
                            (img.title || `Scene ${img.order + 1}`).toLowerCase().includes(sceneSearchQuery.toLowerCase())
                          )
                          .map((img: TourImage) => (
                            <button
                              key={img.id}
                              onClick={() => setHotspotForm({ ...hotspotForm, targetImageId: img.id })}
                              className={`w-full text-left px-3 py-2.5 rounded-lg text-xs transition-all border ${
                                hotspotForm.targetImageId === img.id
                                  ? 'bg-primary-600/20 border-primary-500 text-white'
                                  : 'bg-dark-900/40 border-transparent text-dark-300'
                              }`}
                            >
                              {img.title || `Scene ${img.order + 1}`}
                            </button>
                          ))
                        }
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-2 pr-1 overflow-y-auto max-h-48 scrollbar-thin">
                      {tour.images
                        .filter((img: TourImage) => img.id !== tour.images[currentSceneIndex].id)
                        .map((img: TourImage) => (
                          <button
                            key={img.id}
                            onClick={() => setHotspotForm({ ...hotspotForm, targetImageId: img.id })}
                            className={`relative group rounded-lg overflow-hidden border-2 transition-all ${
                              hotspotForm.targetImageId === img.id
                                ? 'border-primary-500'
                                : 'border-transparent'
                            }`}
                          >
                            <img
                              src={`/api/uploads/${img.filename}`}
                              alt={img.title || 'Scene'}
                              className="object-cover w-full h-16"
                            />
                          </button>
                        ))
                      }
                    </div>
                  )}
                </div>
              )}

              {/* Information Box */}
              {hotspotForm.type === 'INFO' && (
                <div className="pt-4 space-y-4 border-t border-dark-700">
                  <div>
                    <label className="flex items-center block gap-2 mb-2 text-sm font-medium text-dark-300">
                      Content Text
                    </label>
                    <textarea
                      value={hotspotForm.content}
                      onChange={(e) => setHotspotForm({ ...hotspotForm, content: e.target.value })}
                      placeholder="Enter information text..."
                      rows={4}
                      className="w-full px-3 py-2 text-sm text-white transition-all border rounded-lg outline-none resize-none bg-dark-700 border-dark-600 focus:border-primary-500"
                    />
                  </div>
                </div>
              )}

              {/* External Link */}
              {hotspotForm.type === 'URL' && (
                <div className="pt-4 space-y-4 border-t border-dark-700">
                  <div>
                    <label className="flex items-center block gap-2 mb-2 text-sm font-medium text-dark-300">
                      Website URL
                    </label>
                    <input
                      type="url"
                      value={hotspotForm.url}
                      onChange={(e) => setHotspotForm({ ...hotspotForm, url: e.target.value })}
                      placeholder="https://example.com"
                      className="w-full px-3 py-2 text-sm text-white transition-all border rounded-lg outline-none bg-dark-700 border-dark-600 focus:border-primary-500"
                    />
                  </div>
                </div>
              )}

              {/* Video */}
              {hotspotForm.type === 'VIDEO' && (
                <div className="pt-4 space-y-4 border-t border-dark-700">
                  <div>
                    <label className="flex items-center block gap-2 mb-2 text-sm font-medium text-dark-300">
                      Video URL
                    </label>
                    <input
                      type="url"
                      value={hotspotForm.videoUrl}
                      onChange={(e) => setHotspotForm({ ...hotspotForm, videoUrl: e.target.value })}
                      placeholder="YouTube or Vimeo URL"
                      className="w-full px-3 py-2 text-sm text-white transition-all border rounded-lg outline-none bg-dark-700 border-dark-600 focus:border-primary-500"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-3 p-6 border-t border-dark-700 bg-dark-900/50">
              <Button
                variant="secondary"
                onClick={() => {
                  setIsHotspotPanelOpen(false);
                  setAddHotspotMode(false);
                  setNewHotspotCoords(null);
                }}
                className="flex-1 text-xs"
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleCreateHotspot}
                className="flex-1 text-xs"
                disabled={
                  (hotspotForm.type === 'LINK' && !hotspotForm.targetImageId) ||
                  (hotspotForm.type === 'INFO' && !hotspotForm.content) ||
                  (hotspotForm.type === 'URL' && !hotspotForm.url) ||
                  (hotspotForm.type === 'VIDEO' && !hotspotForm.videoUrl)
                }
              >
                Create
              </Button>
            </div>
          </>
        )}
      </div>,
      slot
    );
  };

  return (
    <div className="flex flex-col h-full overflow-hidden bg-dark-900">
      {/* Header */}
      <div className="z-20 flex items-center justify-between flex-shrink-0 h-12 px-4 py-2 border-b bg-dark-800 border-dark-700">
        <div className="flex items-center gap-3">
          <h1 className="text-sm font-semibold text-white truncate max-w-[250px]">{tour.title}</h1>
          <Badge variant="default" className="text-xs">
            {currentSceneIndex + 1} / {tour.images.length}
          </Badge>
        </div>

        <div className="flex gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setIsUploadModalOpen(true)}
            title="Add Scene"
            className="px-3 py-1"
          >
            <Plus size={16} />
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setIsShareModalOpen(true)}
            title="Share"
            className="px-3 py-1"
          >
            <Share2 size={16} />
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => window.history.back()}
            title="Back"
            className="px-3 py-1"
          >
            <ChevronLeft size={16} />
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleSave}
            isLoading={isSaving}
            className="px-4 py-1"
          >
            <Save size={16} />
          </Button>
        </div>
      </div>

      {/* Main Editor Area */}
      <div className="relative flex flex-1 overflow-hidden">
        {/* Left Action Sidebar */}
        <aside className="z-30 flex flex-col items-center w-20 gap-6 py-6 border-r bg-dark-800 border-dark-700">
          <button
            onClick={() =>{
              const nextMode = !addHotspotMode;
              setAddHotspotMode(nextMode);
              if (!nextMode) {
                setIsHotspotPanelOpen(false);
                setNewHotspotCoords(null);
              }
            }}
            className={`flex flex-col items-center gap-1 p-2 w-16 rounded-xl transition-all duration-200 ${
              addHotspotMode 
                ? 'bg-primary-600 text-white' 
                : 'text-dark-400 hover:text-white hover:bg-dark-700'
            }`}
          >
            <MapPin size={22} />
            <span className="text-[10px] font-medium">Hotspot</span>
          </button>
          
          <button
            onClick={() => {
              setNewSceneTitle(currentScene.title || `Scene ${currentSceneIndex + 1}`);
              setIsRenameModalOpen(true);
            }}
            className="flex flex-col items-center w-16 gap-1 p-2 transition-all duration-200 rounded-xl text-dark-400 hover:text-white hover:bg-dark-700"
          >
            <Edit2 size={22} />
            <span className="text-[10px] font-medium">Rename</span>
          </button>

          <button
            onClick={() => setIsSettingsModalOpen(true)}
            className="flex flex-col items-center w-16 gap-1 p-2 transition-all duration-200 rounded-xl text-dark-400 hover:text-white hover:bg-dark-700"
          >
            <Settings size={22} />
            <span className="text-[10px] font-medium">Settings</span>
          </button>

          <div className="w-8 h-px my-2 bg-dark-700" />

          <button
            onClick={handleSave}
            className="flex flex-col items-center w-16 gap-1 p-2 transition-all duration-200 rounded-xl text-dark-400 hover:text-white hover:bg-dark-700"
          >
            <Save size={22} />
            <span className="text-[10px] font-medium">Save</span>
          </button>
        </aside>

        {/* Viewer Area */}
        <div className="relative flex-1 overflow-hidden">
          <div className="absolute inset-0 pb-24">
            <MarzipanoViewer
              scenes={tour.images}
              initialSceneId={currentScene.id}
              editorMode={true}
              addHotspotMode={addHotspotMode}
              tempHotspot={newHotspotCoords}
              onPanoramaClick={handlePanoramaClick}
              onHotspotClick={handleHotspotClick}
              hotspots={allHotspots}
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
              {tour.images.map((image: TourImage, index: number) => (
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
                      alt={image.title || `Scene ${index + 1}`}
                      className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-110"
                    />
                    <div className="absolute inset-x-0 bottom-0 p-1 text-[8px] font-bold text-center text-white truncate bg-black/40 backdrop-blur-[2px]">
                      {image.title || `Scene ${index + 1}`}
                    </div>
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

        {/* Portaled Panel Content */}
        {renderHotspotPanel()}
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
        isOpen={isHotspotActionModalOpen}
        onClose={() => {
          setIsHotspotActionModalOpen(false);
          setSelectedHotspot(null);
        }}
        title="Hotspot Actions"
      >
        <div className="p-6 space-y-4">
          <div className="mb-6 text-center">
            <h3 className="text-lg font-semibold text-white">
              {selectedHotspot?.title || 'Unnamed Hotspot'}
            </h3>
            <p className="mt-1 text-sm text-dark-400">
              Type: {selectedHotspot?.type === 'LINK' ? 'Scene Link' : 'Information'}
            </p>
          </div>

          <div className="flex flex-col gap-3">
            {selectedHotspot?.type === 'LINK' && (
              <Button
                variant="primary"
                onClick={goToTargetScene}
                className="flex items-center justify-center w-full gap-2"
              >
                <ChevronRight size={18} />
                Go to Target Scene
              </Button>
            )}
            
            <Button
              variant="secondary"
              onClick={confirmDeleteHotspot}
              className="flex items-center justify-center w-full gap-2 text-red-400 hover:text-red-300 border-red-900/50 hover:bg-red-900/20"
            >
              <Trash2 size={18} />
              Delete Hotspot
            </Button>
            
            <Button
              variant="ghost"
              onClick={() => {
                setIsHotspotActionModalOpen(false);
                setSelectedHotspot(null);
              }}
              className="w-full"
            >
              Cancel
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={isRenameModalOpen}
        onClose={() => setIsRenameModalOpen(false)}
        title="Rename Scene"
      >
        <div className="p-6 space-y-4">
          <div>
            <label className="block mb-1 text-sm font-medium text-dark-300">Scene Title</label>
            <input
              type="text"
              value={newSceneTitle}
              onChange={(e) => setNewSceneTitle(e.target.value)}
              placeholder="e.g. Living Room"
              className="w-full px-3 py-2 text-white border rounded-lg outline-none bg-dark-700 border-dark-600 focus:border-primary-500"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleRenameScene();
              }}
            />
          </div>
          <div className="flex gap-3 pt-4">
            <Button
              variant="secondary"
              onClick={() => setIsRenameModalOpen(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleRenameScene}
              className="flex-1"
              disabled={!newSceneTitle.trim()}
            >
              Rename
            </Button>
          </div>
        </div>
      </Modal>

      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        tourId={params.id}
        tourTitle={tour.title}
        isPublic={tour.isPublic}
      />

      <Modal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        title="Tour Settings"
      >
        <div className="p-6 space-y-6">
          <div>
            <h3 className="mb-4 text-sm font-medium text-dark-300">Tour Logo</h3>
            <div className="flex items-center gap-6">
              <div className="relative flex items-center justify-center w-24 h-24 overflow-hidden border rounded-lg bg-dark-700 border-dark-600">
                {tour.customLogoUrl ? (
                  <>
                    <img
                      src={`/api/uploads/${tour.customLogoUrl}`}
                      alt="Tour logo"
                      className="object-contain w-full h-full p-2"
                    />
                    <button
                      onClick={handleRemoveLogo}
                      className="absolute p-1 text-white transition-colors bg-red-500 rounded-full shadow-lg top-1 right-1 hover:bg-red-600"
                      title="Remove logo"
                    >
                      <X size={12} />
                    </button>
                  </>
                ) : (
                  <ImageIcon className="text-dark-500" size={32} />
                )}
              </div>
              
              <div className="flex-1 space-y-3">
                <p className="text-xs text-dark-400">
                  Upload your brand logo to display it on the public tour viewer.
                  Best results with PNG or SVG with transparent background.
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => document.getElementById('logo-upload')?.click()}
                    className="text-xs"
                  >
                    {tour.customLogoUrl ? 'Change Logo' : 'Upload Logo'}
                  </Button>
                  <input
                    id="logo-upload"
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={handleLogoUpload}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-dark-700">
            <h3 className="mb-4 text-sm font-medium text-dark-300">Background Audio</h3>
            <div className="space-y-6">
              <div className="flex items-center gap-6">
                <div className="relative flex items-center justify-center w-24 h-24 overflow-hidden border rounded-lg bg-dark-700 border-dark-600">
                  {tour.backgroundAudioUrl ? (
                    <div className="flex flex-col items-center gap-1">
                      <Music className="text-primary-400" size={32} />
                      <span className="text-[10px] text-dark-400 px-2 truncate max-w-full text-center">
                        {tour.backgroundAudioUrl.split('/').pop()}
                      </span>
                      <button
                        onClick={handleRemoveAudio}
                        className="absolute p-1 text-white transition-colors bg-red-500 rounded-full shadow-lg top-1 right-1 hover:bg-red-600"
                        title="Remove audio"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ) : (
                    <Music className="text-dark-500" size={32} />
                  )}
                </div>
                
                <div className="flex-1 space-y-3">
                  <p className="text-xs text-dark-400">
                    Add background music to your tour. It will play automatically when someone opens the public link.
                    Supports MP3, WAV, or OGG.
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => document.getElementById('audio-upload')?.click()}
                      className="text-xs"
                    >
                      {tour.backgroundAudioUrl ? 'Change Audio' : 'Upload Audio'}
                    </Button>
                    <input
                      id="audio-upload"
                      type="file"
                      className="hidden"
                      accept="audio/*"
                      onChange={handleAudioUpload}
                    />
                  </div>
                </div>
              </div>

              {tour.backgroundAudioUrl && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs text-dark-300">
                    <div className="flex items-center gap-2">
                      <Volume2 size={14} />
                      <span>Volume</span>
                    </div>
                    <span>{Math.round((tour.backgroundAudioVolume || 0.5) * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={tour.backgroundAudioVolume || 0.5}
                    onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                    className="w-full h-1.5 bg-dark-700 rounded-lg appearance-none cursor-pointer accent-primary-500"
                  />
                </div>
              )}
            </div>
          </div>

          <div className="pt-6 space-y-4 border-t border-dark-700">
            <h3 className="text-sm font-medium text-dark-300">Viewer Settings</h3>
            <div className="space-y-3">
              <label className="flex items-center gap-3 p-3 transition-all rounded-lg cursor-pointer hover:bg-dark-800">
                <input
                  type="checkbox"
                  checked={showSceneMenu}
                  onChange={(e) => setShowSceneMenu(e.target.checked)}
                  className="w-4 h-4 rounded accent-primary-500"
                />
                <div className="flex-1">
                  <p className="text-sm font-medium text-white">Show Scene Navigation Menu</p>
                  <p className="text-xs text-dark-400">Allow viewers to search and browse scenes</p>
                </div>
              </label>

              <label className="flex items-center gap-3 p-3 transition-all rounded-lg cursor-pointer hover:bg-dark-800">
                <input
                  type="checkbox"
                  checked={showHotspotTitles}
                  onChange={(e) => setShowHotspotTitles(e.target.checked)}
                  className="w-4 h-4 rounded accent-primary-500"
                />
                <div className="flex-1">
                  <p className="text-sm font-medium text-white">Show Hotspot Titles</p>
                  <p className="text-xs text-dark-400">Display labels when hovering over hotspots</p>
                </div>
              </label>
            </div>
          </div>

          <div className="pt-6 border-t border-dark-700">
            <Button
              variant="primary"
              onClick={() => setIsSettingsModalOpen(false)}
              className="w-full"
            >
              Done
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
