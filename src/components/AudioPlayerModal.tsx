import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, Volume2, VolumeX, PhoneOff, Mic, MicOff, RefreshCw, AlertCircle, Sparkles, X } from 'lucide-react';
import { MascotAvatar } from './MascotAvatar';

interface AudioPlayerModalProps {
  isOpen: boolean;
  onClose: () => void;
  reportId?: string;
  reportTitle?: string;
  reportData?: any;
}

export function AudioPlayerModal({
  isOpen,
  onClose,
  reportId,
  reportTitle,
  reportData
}: AudioPlayerModalProps) {
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [audioError, setAudioError] = useState<string | null>(null);
  const [audioScriptText, setAudioScriptText] = useState<string>('');
  const [callDuration, setCallDuration] = useState<number>(0);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // DJOSS Mascot Official Profile Image
  const djossProfileImg = "https://ysbiedwkakdqadxtuwab.supabase.co/storage/v1/object/public/uploads/0bc4684d-8d4b-4583-984a-4a17512a1ad7.png";

  useEffect(() => {
    if (!isOpen) {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      setIsPlaying(false);
      if (timerRef.current) clearInterval(timerRef.current);
      setCallDuration(0);
      return;
    }

    // Call duration timer
    timerRef.current = setInterval(() => {
      setCallDuration(prev => prev + 1);
    }, 1000);

    // Play cached audio if already loaded
    if (audioRef.current && audioRef.current.src && audioRef.current.src.length > 50) {
      audioRef.current.currentTime = 0;
      audioRef.current.play()
        .then(() => setIsPlaying(true))
        .catch(() => setIsPlaying(false));
      setIsLoading(false);
      return;
    }

    loadAudio();

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isOpen, reportId]);

  const loadAudio = async () => {
    setIsLoading(true);
    setAudioError(null);

    // If reportData already has audio base64 pre-fetched
    if (reportData?.audioBase64) {
      const audioSrc = `data:audio/mp3;base64,${reportData.audioBase64}`;
      if (!audioRef.current) {
        audioRef.current = new Audio();
      }
      audioRef.current.src = audioSrc;
      audioRef.current.onended = () => setIsPlaying(false);
      
      if (reportData.audioScript) {
        setAudioScriptText(reportData.audioScript);
      }

      try {
        await audioRef.current.play();
        setIsPlaying(true);
      } catch (e) {
        console.log("Autoplay prevented by browser:", e);
        setIsPlaying(false);
      }
      setIsLoading(false);
      return;
    }

    try {
      const res = await fetch(`/api/generate-audio/${reportId || 'current'}`);
      
      if (!res.ok) {
        throw new Error("Impossible de charger l'audio de Djoss pour le moment.");
      }

      const data = await res.json();
      if (data.script) {
        setAudioScriptText(data.script);
        if (reportData) reportData.audioScript = data.script;
      }

      if (data.audioBase64 || data.audioUrl) {
        const audioSrc = data.audioUrl || `data:audio/mp3;base64,${data.audioBase64}`;
        if (reportData && data.audioBase64) {
          reportData.audioBase64 = data.audioBase64;
        }

        if (!audioRef.current) {
          audioRef.current = new Audio();
        }
        audioRef.current.src = audioSrc;
        audioRef.current.onended = () => setIsPlaying(false);
        audioRef.current.onerror = () => {
          console.warn("Audio playback error, falling back to speech synthesis");
          startWebSpeechFallback(data.script);
        };

        try {
          await audioRef.current.play();
          setIsPlaying(true);
        } catch (e) {
          console.log("Autoplay prevented by browser:", e);
          setIsPlaying(false);
        }
      } else if (data.useWebSpeech) {
        startWebSpeechFallback(data.script || buildDefaultFallbackScript());
      }
    } catch (err: any) {
      console.warn("API Audio generation error, using fallback Web Speech:", err);
      const fallbackScript = buildDefaultFallbackScript();
      setAudioScriptText(fallbackScript);
      startWebSpeechFallback(fallbackScript);
    } finally {
      setIsLoading(false);
    }
  };

  const buildDefaultFallbackScript = () => {
    const title = reportTitle || reportData?.titre || "Analyse Djoss";
    const verdict = reportData?.verdict ? `Verdict : ${reportData?.verdict}.` : "";
    return `Ah on dit quoi ! C'est Djoss en personne. J'ai scanné toute votre discussion et c'est la magie ! ${title}. ${verdict} Tu envoies des pavés de 50 lignes pour recevoir un 'ok' en retour. Le goumin frappe à ta porte et tu lui ouvres en grand ! Prends ton drap en douce et dis le gbê. On est ensemble !`;
  };

  const startWebSpeechFallback = (text: string) => {
    if (!('speechSynthesis' in window)) {
      setAudioError("La synthèse vocale n'est pas supportée sur ce navigateur.");
      return;
    }

    window.speechSynthesis.cancel();
    const cleanText = text.replace(/\[.*?\]/g, '').trim();

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = 'fr-FR';
    utterance.pitch = 0.95;
    utterance.rate = 1.05;

    utterance.onend = () => setIsPlaying(false);
    utterance.onerror = () => setIsPlaying(false);

    window.speechSynthesis.speak(utterance);
    setIsPlaying(true);
  };

  const togglePlayPause = () => {
    if (audioRef.current && audioRef.current.src) {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        audioRef.current.play().then(() => setIsPlaying(true)).catch(console.error);
      }
    } else if ('speechSynthesis' in window) {
      if (isPlaying) {
        window.speechSynthesis.pause();
        setIsPlaying(false);
      } else if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
        setIsPlaying(true);
      } else {
        startWebSpeechFallback(audioScriptText || buildDefaultFallbackScript());
      }
    }
  };

  const toggleMute = () => {
    if (audioRef.current) {
      audioRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainingSecs = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${remainingSecs.toString().padStart(2, '0')}`;
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 bg-gradient-to-b from-[#a3c5f5] via-[#c6dbf8] to-[#97bbed] flex flex-col justify-between p-6 sm:p-10 select-none animate-in fade-in duration-300"
      id="djoss-call-screen"
    >
      {/* Top Header / Live Call Info */}
      <div className="flex items-center justify-between w-full max-w-4xl mx-auto pt-2">
        <div className="flex items-center gap-2.5 bg-white/40 backdrop-blur-md px-4 py-2 rounded-full border border-white/40 shadow-xs">
          <span className={`w-2.5 h-2.5 rounded-full ${isPlaying ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
          <span className="text-xs sm:text-sm font-black text-stone-900 tracking-wide">
            {isLoading ? "Connexion à Djoss..." : isPlaying ? `En appel avec Djoss (${formatTime(callDuration)})` : "Appel en pause"}
          </span>
        </div>

        <button 
          onClick={onClose}
          className="p-3 rounded-full bg-white/40 hover:bg-white/70 backdrop-blur-md text-stone-800 transition-all cursor-pointer border border-white/40 shadow-xs"
          title="Fermer l'appel"
          id="btn-close-call"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Main Center Avatar Section (Exactly like Call UI) */}
      <div className="flex flex-col items-center justify-center my-auto relative space-y-6">
        
        {/* Animated Sound Waves / Ripples when playing */}
        {isPlaying && (
          <>
            <div className="absolute w-56 h-56 sm:w-72 sm:h-72 rounded-full bg-white/25 animate-ping pointer-events-none -z-10" />
            <div className="absolute w-72 h-72 sm:w-96 sm:h-96 rounded-full bg-white/15 animate-pulse pointer-events-none -z-10" />
          </>
        )}

        {/* Profile Picture in Center */}
        <div className="relative group">
          <div className="w-36 h-36 sm:w-48 sm:h-48 rounded-full border-4 border-white/90 shadow-2xl overflow-hidden bg-amber-50 flex items-center justify-center transition-transform duration-300">
            <img 
              src={djossProfileImg} 
              alt="Djoss Profile"
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
              onError={(e) => {
                // Fallback to MascotAvatar if img fails
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
            <MascotAvatar expression="cool" size={160} className="w-full h-full" />
          </div>

          {/* Audio Playing Badge */}
          {isPlaying && (
            <div className="absolute bottom-2 right-2 bg-emerald-500 text-white p-2 rounded-full border-2 border-white shadow-md animate-bounce">
              <Sparkles className="w-4 h-4 fill-white" />
            </div>
          )}
        </div>

        {/* Title or Loading Info */}
        <div className="text-center space-y-1 max-w-sm px-4">
          <h2 className="font-serif font-black text-xl sm:text-2xl text-stone-900 drop-shadow-xs">
            Djoss L'Analyste
          </h2>
          <p className="text-xs sm:text-sm text-stone-700 font-semibold line-clamp-1">
            {isLoading ? "Préparation du rapport vocal..." : reportTitle || reportData?.titre || "Rapport Audio Exclusif"}
          </p>
        </div>

        {/* Loading Spinner / Error Banner */}
        {isLoading && (
          <div className="flex items-center gap-2 bg-white/50 backdrop-blur-md px-4 py-2 rounded-full border border-white/40 text-stone-800 text-xs font-bold animate-pulse">
            <RefreshCw className="w-4 h-4 animate-spin text-[#BE123C]" />
            <span>Djoss est en train de parler...</span>
          </div>
        )}

        {audioError && (
          <div className="flex items-center gap-2 bg-red-100 text-red-900 px-4 py-2 rounded-2xl border border-red-200 text-xs font-bold">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{audioError}</span>
          </div>
        )}
      </div>

      {/* Bottom Row: Name Overlay (Left) & Call Control Bar (Center) */}
      <div className="w-full max-w-4xl mx-auto flex items-end justify-between relative pb-2 sm:pb-4">
        
        {/* Bottom Left Name Tag (Exact match to screenshot) */}
        <div 
          className="bg-slate-900/60 backdrop-blur-md text-white font-bold text-xs sm:text-sm px-4 py-2.5 rounded-2xl border border-white/20 shadow-lg flex items-center gap-2"
          id="caller-name-tag"
        >
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>Djoss</span>
        </div>

        {/* Bottom Center Call Control Bar */}
        <div className="absolute left-1/2 -translate-x-1/2 bottom-0 flex items-center justify-center gap-3 sm:gap-4">
          
          {/* Mute / Audio Toggle Button */}
          <button
            onClick={toggleMute}
            className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl shadow-lg flex items-center justify-center transition-all cursor-pointer border border-white/40 active:scale-95 ${
              isMuted 
                ? 'bg-amber-500 text-white' 
                : 'bg-white/90 hover:bg-white text-stone-800'
            }`}
            title={isMuted ? "Réactiver le son" : "Couper le son"}
            id="btn-call-mute"
          >
            {isMuted ? <VolumeX className="w-5 h-5 sm:w-6 sm:h-6" /> : <Volume2 className="w-5 h-5 sm:w-6 sm:h-6" />}
          </button>

          {/* Main Play / Pause Button (Strictly Pause/Play, No Rewind) */}
          <button
            onClick={togglePlayPause}
            disabled={isLoading}
            className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-white hover:bg-stone-50 text-stone-900 shadow-2xl flex items-center justify-center transition-transform cursor-pointer border border-white active:scale-95 disabled:opacity-50"
            title={isPlaying ? "Mettre en pause" : "Reprendre l'appel"}
            id="btn-call-play-pause"
          >
            {isPlaying ? (
              <Pause className="w-7 h-7 sm:w-8 sm:h-8 text-stone-900 fill-stone-900" />
            ) : (
              <Play className="w-7 h-7 sm:w-8 sm:h-8 text-stone-900 fill-stone-900 ml-1" />
            )}
          </button>

          {/* End Call / Raccrocher Button */}
          <button
            onClick={onClose}
            className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-[#BE123C] hover:bg-rose-800 text-white shadow-lg flex items-center justify-center transition-transform cursor-pointer active:scale-95"
            title="Raccrocher l'appel"
            id="btn-call-end"
          >
            <PhoneOff className="w-5 h-5 sm:w-6 sm:h-6 fill-white" />
          </button>
        </div>

      </div>
    </div>
  );
}
