'use client';

import { type ChangeEvent } from 'react';
import { ImageIcon, Music, Volume2, X, Upload, Eye } from 'lucide-react';
import { Tour } from '@/lib/types';
import { Button } from '@/components/ui/Button';

type TourSettingsModalProps = {
  tour: Tour;
  onClose: () => void;
  onAudioUpload: (event: ChangeEvent<HTMLInputElement>) => void;
  onRemoveAudio: () => void;
  onVolumeChange: (volume: number) => void;
  onLogoUpload: (event: ChangeEvent<HTMLInputElement>) => void;
  onRemoveLogo: () => void;
  showSceneMenu: boolean;
  onShowSceneMenuChange: (value: boolean) => void;
  showHotspotTitles: boolean;
  onShowHotspotTitlesChange: (value: boolean) => void;
};

export default function TourSettingsModal({
  tour,
  onClose,
  onAudioUpload,
  onRemoveAudio,
  onVolumeChange,
  onLogoUpload,
  onRemoveLogo,
  showSceneMenu,
  onShowSceneMenuChange,
  showHotspotTitles,
  onShowHotspotTitlesChange,
}: TourSettingsModalProps) {
  return (
    /**
     * max-h-[70vh] keeps the Modal header (with its close button) always
     * visible. The body scrolls; the footer stays pinned at the bottom.
     */
    <div className="flex flex-col max-h-[70vh]">

      {/* ── Scrollable body ──────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto divide-y divide-dark-700/60 scrollbar-hide">

        {/* Tour Logo */}
        <section className="p-5 space-y-4">
          <SectionHeader icon={<ImageIcon size={14} />} title="Tour Logo" />
          <div className="flex items-start gap-4">
            <div className="relative flex-shrink-0">
              <div className="flex items-center justify-center w-20 h-20 overflow-hidden border shadow-inner rounded-xl border-dark-600 bg-dark-800">
                {tour.customLogoUrl ? (
                  <img
                    src={`/api/uploads/${tour.customLogoUrl}`}
                    alt="Tour logo"
                    className="object-contain w-full h-full p-2"
                  />
                ) : (
                  <ImageIcon className="text-dark-600" size={26} />
                )}
              </div>
              {tour.customLogoUrl && (
                <RemoveBadge onClick={onRemoveLogo} title="Remove logo" />
              )}
            </div>
            <div className="flex-1 space-y-2.5">
              <p className="text-xs leading-relaxed text-dark-400">
                PNG or SVG with transparent background. Displayed in the public viewer.
              </p>
              <UploadButton
                inputId="logo-upload"
                accept="image/*"
                onChange={onLogoUpload}
                label={tour.customLogoUrl ? 'Change Logo' : 'Upload Logo'}
              />
            </div>
          </div>
        </section>

        {/* Background Audio */}
        <section className="p-5 space-y-4">
          <SectionHeader icon={<Music size={14} />} title="Background Audio" />
          <div className="flex items-start gap-4">
            <div className="relative flex-shrink-0">
              <div className="flex flex-col items-center justify-center w-20 h-20 gap-1 overflow-hidden border shadow-inner rounded-xl border-dark-600 bg-dark-800">
                {tour.backgroundAudioUrl ? (
                  <>
                    <Music className="text-primary-400" size={22} />
                    <span className="max-w-[68px] truncate px-1 text-center text-[9px] text-dark-400">
                      {tour.backgroundAudioUrl.split('/').pop()}
                    </span>
                  </>
                ) : (
                  <Music className="text-dark-600" size={26} />
                )}
              </div>
              {tour.backgroundAudioUrl && (
                <RemoveBadge onClick={onRemoveAudio} title="Remove audio" />
              )}
            </div>
            <div className="flex-1 space-y-2.5">
              <p className="text-xs leading-relaxed text-dark-400">
                Plays automatically on the public link. Supports MP3, WAV, OGG.
              </p>
              <UploadButton
                inputId="audio-upload"
                accept="audio/*"
                onChange={onAudioUpload}
                label={tour.backgroundAudioUrl ? 'Change Audio' : 'Upload Audio'}
              />
            </div>
          </div>

          {tour.backgroundAudioUrl && (
            <div className="p-4 space-y-3 border rounded-xl border-dark-700 bg-dark-800/60">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 text-dark-300">
                  <Volume2 size={13} className="text-primary-400" />
                  <span className="font-medium">Volume</span>
                </div>
                <span className="font-semibold text-white tabular-nums">
                  {Math.round((tour.backgroundAudioVolume ?? 0.5) * 100)}%
                </span>
              </div>
              <div className="relative h-1.5 w-full rounded-full bg-dark-700">
                <div
                  className="absolute inset-y-0 left-0 rounded-full pointer-events-none bg-gradient-to-r from-primary-600 to-primary-400"
                  style={{ width: `${(tour.backgroundAudioVolume ?? 0.5) * 100}%` }}
                />
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={tour.backgroundAudioVolume ?? 0.5}
                  onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
              </div>
              <div className="flex justify-between text-[10px] text-dark-500 select-none">
                <span>0%</span><span>50%</span><span>100%</span>
              </div>
            </div>
          )}
        </section>

        {/* Viewer Settings */}
        <section className="p-5 space-y-3">
          <SectionHeader icon={<Eye size={14} />} title="Viewer Settings" />
          <ToggleRow
            checked={showSceneMenu}
            onChange={onShowSceneMenuChange}
            label="Scene Navigation Menu"
            description="Allow viewers to search and browse scenes"
          />
          <ToggleRow
            checked={showHotspotTitles}
            onChange={onShowHotspotTitlesChange}
            label="Show Hotspot Titles"
            description="Display labels when hovering over hotspots"
          />
        </section>
      </div>

      {/* ── Sticky footer — always visible at the bottom ─────────── */}
      <div className="flex-shrink-0 px-5 py-4 border-t border-dark-700 bg-dark-900/80 backdrop-blur">
        <Button variant="primary" onClick={onClose} className="w-full font-semibold">
          Done
        </Button>
      </div>
    </div>
  );
}

/* ── Sub-components ──────────────────────────────────────────────── */

function SectionHeader({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-primary-400">{icon}</span>
      <h3 className="text-sm font-semibold text-white">{title}</h3>
    </div>
  );
}

function RemoveBadge({ onClick, title }: { onClick: () => void; title: string }) {
  return (
    <button
      onClick={onClick}
      type="button"
      title={title}
      className="absolute -top-1.5 -right-1.5 z-10 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-white shadow-lg transition-all hover:bg-red-400 hover:scale-110 active:scale-95"
    >
      <X size={10} />
    </button>
  );
}

function UploadButton({
  inputId,
  accept,
  onChange,
  label,
}: {
  inputId: string;
  accept: string;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  label: string;
}) {
  return (
    <>
      <button
        type="button"
        onClick={() => document.getElementById(inputId)?.click()}
        className="inline-flex items-center gap-2 rounded-lg border border-dark-600 bg-dark-700 px-3 py-1.5 text-xs font-medium text-dark-200 transition-all hover:border-primary-500 hover:bg-dark-600 hover:text-white active:scale-95"
      >
        <Upload size={11} />
        {label}
      </button>
      <input id={inputId} type="file" className="hidden" accept={accept} onChange={onChange} />
    </>
  );
}

function ToggleRow({
  checked,
  onChange,
  label,
  description,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  description: string;
}) {
  return (
    <label className="flex items-center justify-between gap-4 px-4 py-3 transition-all border cursor-pointer rounded-xl border-dark-700 bg-dark-800/40 hover:border-dark-600 hover:bg-dark-800">
      <div className="min-w-0">
        <p className="text-sm font-medium text-white">{label}</p>
        <p className="text-xs text-dark-400 mt-0.5">{description}</p>
      </div>
      <div className="relative flex-shrink-0">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="sr-only"
        />
        <div className={`relative h-5 w-9 rounded-full transition-colors duration-200 ${checked ? 'bg-primary-500' : 'bg-dark-600'}`}>
          <span className={`absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform duration-200 ${checked ? 'translate-x-4' : 'translate-x-0'}`} />
        </div>
      </div>
    </label>
  );
}