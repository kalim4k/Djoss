import React, { useState } from 'react';
import { X, Video } from 'lucide-react';

interface VideoTutorialModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialDevice?: 'android' | 'iphone';
}

export function VideoTutorialModal({ isOpen, onClose, initialDevice = 'iphone' }: VideoTutorialModalProps) {
  const [activeDevice, setActiveDevice] = useState<'android' | 'iphone'>(initialDevice);

  if (!isOpen) return null;

  const videoUrls = {
    iphone: "https://ysbiedwkakdqadxtuwab.supabase.co/storage/v1/object/public/uploads/ccc859c9-5dd2-4932-8c47-c736eb3827d2.mp4",
    android: "https://ysbiedwkakdqadxtuwab.supabase.co/storage/v1/object/public/uploads/969463de-8505-4145-affe-8db5c274b71d.mp4"
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/70 backdrop-blur-md animate-fade-in"
      onClick={onClose}
      id="video-tutorial-modal-backdrop"
    >
      <div 
        className="relative w-full max-w-md bg-white rounded-3xl p-5 sm:p-6 shadow-2xl border border-stone-200 text-stone-900 space-y-4 animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
        id="video-tutorial-modal-content"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-stone-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-50 text-amber-600 border border-amber-200/60 shadow-xs">
              <Video className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-serif font-black text-lg text-stone-900 leading-tight">
                Tutoriel Exporter WhatsApp
              </h3>
              <p className="text-[11px] text-stone-500 font-medium">
                Regarde la vidéo pour exporter ta discussion en 10s
              </p>
            </div>
          </div>

          <button 
            onClick={onClose}
            className="p-1.5 rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors cursor-pointer"
            aria-label="Fermer"
            id="btn-close-video-modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Device Switcher Tabs */}
        <div className="grid grid-cols-2 gap-2 bg-stone-100 p-1.5 rounded-2xl border border-stone-200/60 text-xs font-bold">
          <button
            onClick={() => setActiveDevice('iphone')}
            className={`py-2.5 px-3 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeDevice === 'iphone'
                ? 'bg-white text-stone-950 shadow-sm font-black'
                : 'text-stone-500 hover:text-stone-900 font-semibold'
            }`}
            id="tab-select-iphone"
          >
            <span>🍏 iPhone (iOS)</span>
          </button>

          <button
            onClick={() => setActiveDevice('android')}
            className={`py-2.5 px-3 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeDevice === 'android'
                ? 'bg-white text-stone-950 shadow-sm font-black'
                : 'text-stone-500 hover:text-stone-900 font-semibold'
            }`}
            id="tab-select-android"
          >
            <span>📱 Android</span>
          </button>
        </div>

        {/* Video Player */}
        <div className="relative rounded-2xl overflow-hidden bg-black border border-stone-200 shadow-inner flex items-center justify-center min-h-[240px]">
          <video
            key={activeDevice}
            src={videoUrls[activeDevice]}
            controls
            autoPlay
            playsInline
            className="w-full h-auto max-h-[60vh] object-contain rounded-2xl"
          />
        </div>

        {/* Action Button */}
        <button
          onClick={onClose}
          className="w-full bg-[#111111] hover:bg-stone-850 text-white py-3 rounded-2xl font-bold text-xs shadow-md transition-all cursor-pointer"
        >
          J'ai compris, je vais exporter !
        </button>
      </div>
    </div>
  );
}
