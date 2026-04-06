
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
import { Save, ChevronLeft, ChevronRight, Image as ImageIcon, Plus, Trash2, X, Share2, Edit2, Search, Settings, Music, Volume2, Link as LinkIcon, Info, ExternalLink, Video, FileText, ArrowRight, Zap } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { ShareModal } from '@/components/dashboard/ShareModal';
import { HOTSPOT_ICONS, getHotspotIconConfig, iconIdToType } from '@/lib/hotspotIcons';
import { getHostpotIconType, HOTSPOT_ICONS_SVG } from '@/lib/hotspotIconsSvg';
import { logger } from '@/lib/logger';
import toast from 'react-hot-toast';
import { MapPin as MapPinIcon } from 'lucide-react';

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
  const [newHotspotCoords, setNewHotspotCoords] = useState<{ yaw: number; pitch: number; iconName?: string } | null>(null);
  const [sceneSearchQuery, setSceneSearchQuery] = useState('');
  const [selectionMode, setSelectionMode] = useState<'name' | 'image'>('image');
  const [hotspotForm, setHotspotForm] = useState({
    type: 'LINK',
    title: '',
    targetImageId: '',
    content: '',
    url: '',
    videoUrl: '',
    imageUrl: '',
    animationType: 'PULSE',
    scale: 1.0,
    iconUrl: '',
    iconName: 'info',
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
      logger.debug({ yaw, pitch }, 'Panorama clicked in hotspot mode, opening config panel');
      setNewHotspotCoords({ yaw, pitch, iconName: hotspotForm.iconName });
      setHotspotForm({
        ...hotspotForm,
        type: getHostpotIconType(hotspotForm.iconName),
        targetImageId: tour?.images.find((img: TourImage) => img.id !== tour.images[currentSceneIndex].id)?.id || '',
      });
      // Open config panel directly
      setIsHotspotPanelOpen(true);
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
        const hotspotType = getHostpotIconType(hotspotForm.iconName);
        
        setIsHotspotPanelOpen(false);
        setAddHotspotMode(false);
        setNewHotspotCoords(null);
        setSceneSearchQuery('');
        setHotspotForm({
          type: hotspotType,
          title: '',
          targetImageId: '',
          content: '',
          url: '',
          videoUrl: '',
          imageUrl: '',
          animationType: 'NONE',
          color: '#3b3b3b',
          scale: 1.0,
          iconUrl: '',
          iconName: 'info',
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
    if (!selectedHotspot || (selectedHotspot.type !== 'LINK' && selectedHotspot.type !== 'LINK_SCENE') || !selectedHotspot.targetImageId) return;

    const index = tour!.images.findIndex((img: TourImage) => img.id === selectedHotspot.targetImageId);
    if (index !== -1) {
      setCurrentSceneId(index);
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
  const renderIconBoxer = (size: number, iconName: string) => {
    // Map doublearrow to MapPin as requested
    const effectiveIconName = iconName === 'doublearrow' ? 'MapPin' : iconName;
    const svgString = HOTSPOT_ICONS_SVG[effectiveIconName] || HOTSPOT_ICONS_SVG['info'];
    
    return (
      <div 
        style={{ width: size, height: size, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        className="text-white [&>svg]:w-full [&>svg]:h-full"
        dangerouslySetInnerHTML={{ __html: svgString }}
      />
    );
  };

  const handleHotspotFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: 'videoUrl' | 'imageUrls') => {
    const files = e.target.files;
    if (!files || files.length === 0 || !tour) return;

    setIsSaving(true);
    const formData = new FormData();
    Array.from(files).forEach(file => {
      formData.append('files', file);
    });

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/tours/${tour.id}/hotspot-uploads`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token || ''}`,
        },
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        const uploadedUrls = data.data.urls;
        
        if (field === 'videoUrl') {
          // For video, we take the first one
          setHotspotForm({ ...hotspotForm, videoUrl: uploadedUrls[0] });
        } else if (field === 'imageUrls') {
          // For images, we can have multiple
          const currentUrls = hotspotForm.imageUrls ? JSON.parse(hotspotForm.imageUrls) : [];
          const newUrls = JSON.stringify([...currentUrls, ...uploadedUrls]);
          setHotspotForm({ ...hotspotForm, imageUrls: newUrls });
        }
        toast.success('Files uploaded');
      } else {
        toast.error('Failed to upload files');
      }
    } catch (error) {
      toast.error('Error uploading files');
    } finally {
      setIsSaving(false);
    }
  };

  const renderHotspotPanel = () => {
    if (!isHotspotPanelOpen || !mounted) return null;
    console.log("selected icon",hotspotForm);
    const slot = document.getElementById('hotspot-panel-slot');
    if (!slot) return null;

    return createPortal(
      <div className="flex flex-col h-full overflow-hidden text-white">
        {isHotspotPanelCollapsed ? (
          <div className="flex flex-col items-center gap-6 py-6">
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
                  <label className="block mb-3 text-sm font-medium text-dark-300">Hotspot Icon</label>
                  
                  {/* Primary Icons Group */}
                  <div className="mb-4">
                    <p className="mb-2 text-[10px] font-bold text-dark-500 uppercase tracking-wider">Main Actions</p>
                    <div className="grid grid-cols-4 gap-2">
                      {[ 'MapPin','info'].map((iconName) => (
                        <button
                          key={iconName}
                          onClick={() => {
                            setHotspotForm({ ...hotspotForm, iconName ,   type: getHostpotIconType(iconName) });
                            if (newHotspotCoords) {
                              setNewHotspotCoords({ ...newHotspotCoords, iconName });
                            }
                          }}
                          className={`flex items-center justify-center p-2 rounded-lg transition-all ${
                            hotspotForm.iconName === iconName
                              ? 'bg-primary-500/30 border border-primary-500'
                              : 'bg-dark-700 border border-dark-600 hover:border-dark-500'
                          }`}
                          title={`${iconName} Icon`}
                        >
                          {renderIconBoxer(20, iconName)}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Other Icons Group */}
                  <div>
                    <p className="mb-2 text-[10px] font-bold text-dark-500 uppercase tracking-wider">Other Icons</p>
                    <div className="grid grid-cols-4 gap-2">
                      {Object.keys(HOTSPOT_ICONS_SVG)
                        .filter(name => !['info', 'MapPin'].includes(name))
                        .map((iconName) => (
                          <button
                            key={iconName}
                            onClick={() => {
                              setHotspotForm({ ...hotspotForm, iconName , type: getHostpotIconType(iconName) });
                              if (newHotspotCoords) {
                                setNewHotspotCoords({ ...newHotspotCoords, iconName });
                              }
                            }}
                            className={`flex items-center justify-center p-2 rounded-lg transition-all ${
                              hotspotForm.iconName === iconName
                                ? 'bg-primary-500/30 border border-primary-500'
                                : 'bg-dark-700 border border-dark-600 hover:border-dark-500'
                            }`}
                            title={`${iconName} Icon`}
                          >
                            {renderIconBoxer(20, iconName)}
                          </button>
                        ))}
                    </div>
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

              {/* Link to Scene */}
              {hotspotForm.iconName === 'MapPin' && (
                <div className="pt-4 space-y-4 border-t border-dark-700">
                  <div className="flex flex-col gap-3">
                    <label className="flex items-center gap-2 text-sm font-semibold text-white">
                      Target Scene
                    </label>
                    <div className="flex w-full p-1 border rounded-lg bg-dark-900 border-dark-700">
                     
                      <button
                        onClick={() => setSelectionMode('image')}
                        className={`flex-1 py-1.5 px-2 text-xs font-medium rounded-md transition-all flex items-center justify-center gap-1 ${
                          selectionMode === 'image' ? 'bg-primary-600 text-white' : 'text-dark-400'
                        }`}
                      >
                        By image
                      </button>
                      
                      <button
                        onClick={() => setSelectionMode('name')}
                        className={`flex-1 py-1.5 px-2 text-xs font-medium rounded-md transition-all flex items-center justify-center gap-1 ${
                          selectionMode === 'name' ? 'bg-primary-600 text-white' : 'text-dark-400'
                        }`}
                      >
                        By name
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
                          // TODO: add image name on the bottom of the thumbnail .
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
                      URL
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
                  <div className="space-y-4">
                    <div>
                      <label className="flex items-center block gap-2 mb-2 text-sm font-medium text-dark-300">
                        Video URL (YouTube/Vimeo)
                      </label>
                      <input
                        type="url"
                        value={hotspotForm.videoUrl}
                        onChange={(e) => setHotspotForm({ ...hotspotForm, videoUrl: e.target.value })}
                        placeholder="https://youtube.com/..."
                        className="w-full px-3 py-2 text-sm text-white transition-all border rounded-lg outline-none bg-dark-700 border-dark-600 focus:border-primary-500"
                      />
                    </div>
                    
                    <div className="relative">
                      <div className="absolute inset-0 flex items-center" aria-hidden="true">
                        <div className="w-full border-t border-dark-700"></div>
                      </div>
                      <div className="relative flex justify-center text-xs uppercase">
                        <span className="px-2 text-dark-400 bg-dark-800">Or Upload Video</span>
                      </div>
                    </div>

                    <div>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => document.getElementById('hotspot-video-upload')?.click()}
                        className="w-full text-xs"
                      >
                        <Video size={14} className="mr-2" />
                        {hotspotForm.videoUrl && !hotspotForm.videoUrl.startsWith('http') ? 'Change Video' : 'Upload Video File'}
                      </Button>
                      <input
                        id="hotspot-video-upload"
                        type="file"
                        className="hidden"
                        accept="video/*"
                        onChange={(e) => handleHotspotFileUpload(e, 'videoUrl')}
                      />
                      {hotspotForm.videoUrl && !hotspotForm.videoUrl.startsWith('http') && (
                        <p className="mt-1 text-[10px] text-primary-400 truncate">
                          File: {hotspotForm.videoUrl.split('/').pop()}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Image Gallery */}
              {hotspotForm.type === 'IMAGE' && (
                <div className="pt-4 space-y-4 border-t border-dark-700">
                  <div className="space-y-4">
                    <div>
                      <label className="flex items-center block gap-2 mb-2 text-sm font-medium text-dark-300">
                        Image URL
                      </label>
                      <input
                        type="url"
                        value={hotspotForm.imageUrl}
                        onChange={(e) => setHotspotForm({ ...hotspotForm, imageUrl: e.target.value })}
                        placeholder="https://example.com/image.jpg"
                        className="w-full px-3 py-2 text-sm text-white transition-all border rounded-lg outline-none bg-dark-700 border-dark-600 focus:border-primary-500"
                      />
                    </div>

                    <div className="relative">
                      <div className="absolute inset-0 flex items-center" aria-hidden="true">
                        <div className="w-full border-t border-dark-700"></div>
                      </div>
                      <div className="relative flex justify-center text-xs uppercase">
                        <span className="px-2 text-dark-400 bg-dark-800">Or Upload Images</span>
                      </div>
                    </div>

                    <div>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => document.getElementById('hotspot-images-upload')?.click()}
                        className="w-full text-xs"
                      >
                        <LucideIcons.Image size={14} className="mr-2" />
                        Upload Gallery Images
                      </Button>
                      <input
                        id="hotspot-images-upload"
                        type="file"
                        multiple
                        className="hidden"
                        accept="image/*"
                        onChange={(e) => handleHotspotFileUpload(e, 'imageUrls')}
                      />
                      
                      {hotspotForm.imageUrls && (
                        <div className="mt-3 space-y-2">
                          <p className="text-[10px] font-bold text-dark-500 uppercase">Gallery Items ({JSON.parse(hotspotForm.imageUrls).length})</p>
                          <div className="grid grid-cols-4 gap-2">
                            {JSON.parse(hotspotForm.imageUrls).map((url: string, idx: number) => (
                              <div key={idx} className="relative group aspect-square">
                                <img 
                                  src={`/api/uploads/${url}`} 
                                  className="object-cover w-full h-full border rounded border-dark-600"
                                />
                                <button 
                                  onClick={() => {
                                    const urls = JSON.parse(hotspotForm.imageUrls);
                                    urls.splice(idx, 1);
                                    setHotspotForm({ ...hotspotForm, imageUrls: JSON.stringify(urls) });
                                  }}
                                  className="absolute p-0.5 text-white bg-red-500 rounded-full -top-1 -right-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                  <X size={10} />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
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
                  isSaving ||
                  (hotspotForm.type === 'LINK_SCENE' && !hotspotForm.targetImageId) ||
                  (hotspotForm.type === 'INFO' && !hotspotForm.content) ||
                  (hotspotForm.type === 'URL' && !hotspotForm.url) ||
                  (hotspotForm.type === 'VIDEO' && !hotspotForm.videoUrl) ||
                  (hotspotForm.type === 'IMAGE' && !hotspotForm.imageUrl && (!hotspotForm.imageUrls || JSON.parse(hotspotForm.imageUrls).length === 0))
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
      <div className="z-20 flex items-center justify-between flex-shrink-0 h-16 px-6 py-4 border-b bg-dark-800 border-dark-700">
        <div className="flex items-center gap-4">
          <div className="text-xl font-bold text-transparent bg-gradient-to-r from-primary-400 to-primary-600 bg-clip-text">
            Panoramate
          </div>
          <div className="w-px h-6 bg-dark-700" />
          <h1 className="text-lg font-semibold text-white truncate max-w-[200px]">{tour.title}</h1>
          <div className="w-px h-6 bg-dark-700" />
          <div className="flex items-center gap-2">
         
            <Badge variant="default" className="ml-2">
              {currentSceneIndex + 1} / {tour.images.length}
            </Badge>
          </div>
        </div>

        <div className="flex gap-3">
          <Button
            variant="secondary"
            onClick={() => setIsUploadModalOpen(true)}
            className="flex items-center gap-2"
          >
            <Plus size={18} />
            Add Scene
          </Button>
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
            <MapPinIcon size={22} />
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
              Type: {selectedHotspot?.type === 'LINK_SCENE' ? 'Scene Link' : 'Information'}
            </p>
          </div>

          <div className="flex flex-col gap-3">
            {selectedHotspot?.type === 'LINK_SCENE' && (
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
