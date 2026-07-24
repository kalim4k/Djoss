import React, { useState, useEffect, useRef } from 'react';
import { X, Play, Pause, RotateCcw, Volume2, Sparkles, AlertCircle, RefreshCw } from 'lucide-react';
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
  const [audioError, setAudioError] = useState<string | null>(null);
  const [audioScriptText, setAudioScriptText] = useState<string>('');

  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (!isOpen) {
      // Pause audio when modal is closed (keep src cached for fast replay)
      if (audioRef.current) {
        audioRef.current.pause();
      }
      if ('speechSynthesis' in window) {
        window.speechSynthesis.pause();
      }
      setIsPlaying(false);
      return;
    }

    // Play cached audio if already loaded
    if (audioRef.current && audioRef.current.src && audioRef.current.src.length > 50) {
      audioRef.current.currentTime = 0;
      audioRef.current.play()
        .then(() => setIsPlaying(true))
        .catch(() => setIsPlaying(false));
      setIsLoading(false);
      return;
    }

    // Otherwise load or fetch audio
    loadAudio();

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
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
      // Call backend to fetch or generate audio
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

        // Auto-play as per spec
        try {
          await audioRef.current.play();
          setIsPlaying(true);
        } catch (e) {
          console.log("Autoplay prevented by browser:", e);
          setIsPlaying(false);
        }
      } else if (data.useWebSpeech) {
        // Fallback Web Speech synthesis
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
    const p1 = reportData?.meName || "toi";
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
    
    // Clean audio tags like [laughs], [sarcastically] for browser speech synthesis
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

  const rewind10Seconds = () => {
    if (audioRef.current && audioRef.current.src) {
      audioRef.current.currentTime = Math.max(0, audioRef.current.currentTime - 10);
    } else if ('speechSynthesis' in window) {
      // For web speech, restart synthesis
      window.speechSynthesis.cancel();
      startWebSpeechFallback(audioScriptText || buildDefaultFallbackScript());
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 bg-stone-900/80 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200"
      onClick={onClose}
      id="audio-player-modal-backdrop"
    >
      <div 
        className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl border border-stone-200/80 relative text-center space-y-5 animate-in zoom-in-95 duration-200"
        onClick={e => e.stopPropagation()}
        id="audio-player-modal-content"
      >
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors cursor-pointer"
          aria-label="Fermer"
          id="audio-modal-close-btn"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Mascot Avatar Header */}
        <div className="flex flex-col items-center pt-2 space-y-2">
          <div className="relative">
            <MascotAvatar expression="cool" size={88} className="shadow-md rounded-full bg-amber-50 p-1 border-2 border-amber-300" />
            <div className="absolute -bottom-1 -right-1 bg-[#BE123C] text-white p-1.5 rounded-full border-2 border-white shadow-xs">
              <Volume2 className="w-4 h-4" />
            </div>
          </div>

          <div className="space-y-1">
            <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-[#BE123C] bg-red-50 px-2.5 py-0.5 rounded-md border border-red-200/60">
              <Sparkles className="w-3 h-3 text-amber-500 fill-amber-500" /> Le Vocal Exclusif
            </span>
            <h3 className="font-serif font-black text-xl text-stone-900">
              Rapport Audio de Djoss
            </h3>
            <p className="text-xs text-stone-500 font-medium px-4 line-clamp-2">
              {reportTitle || reportData?.titre || "Le résumé cash & viral sans filtre"}
            </p>
          </div>
        </div>

        {/* Audio Player Controls */}
        <div className="bg-stone-50 p-5 rounded-2xl border border-stone-200/80 space-y-4">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-4 space-y-2 text-stone-500">
              <RefreshCw className="w-6 h-6 animate-spin text-[#BE123C]" />
              <span className="text-xs font-bold">Préparation de l'audio de Djoss...</span>
            </div>
          ) : audioError ? (
            <div className="flex flex-col items-center py-3 text-red-600 space-y-2">
              <AlertCircle className="w-6 h-6" />
              <span className="text-xs font-semibold">{audioError}</span>
              <button 
                onClick={loadAudio}
                className="text-xs font-bold underline hover:text-red-800"
              >
                Réessayer
              </button>
            </div>
          ) : (
            <>
              {/* Audio Minimal Controls */}
              <div className="flex items-center justify-center gap-6 py-2">
                {/* Rewind 10s Button */}
                <button
                  onClick={rewind10Seconds}
                  className="p-3 rounded-full bg-white text-stone-700 hover:text-stone-900 hover:bg-stone-100 border border-stone-200 shadow-xs transition-all active:scale-95 flex items-center justify-center cursor-pointer"
                  title="Reculer de 10 secondes"
                  id="btn-audio-rewind-10"
                >
                  <RotateCcw className="w-5 h-5" />
                </button>

                {/* Main Play / Pause Button */}
                <button
                  onClick={togglePlayPause}
                  className="w-16 h-16 rounded-full bg-[#BE123C] hover:bg-[#9F0E31] text-white shadow-lg transition-all active:scale-95 flex items-center justify-center cursor-pointer"
                  title={isPlaying ? "Mettre en pause" : "Écouter"}
                  id="btn-audio-play-pause"
                >
                  {isPlaying ? (
                    <Pause className="w-7 h-7 fill-white" />
                  ) : (
                    <Play className="w-7 h-7 fill-white ml-1" />
                  )}
                </button>
              </div>

              {/* Status Indicator */}
              <div className="text-[11px] font-bold text-stone-500 flex items-center justify-center gap-1.5 pt-1">
                <span className={`w-2 h-2 rounded-full ${isPlaying ? 'bg-emerald-500 animate-pulse' : 'bg-stone-300'}`} />
                <span>{isPlaying ? "En cours de lecture..." : "Appuie sur play pour écouter"}</span>
              </div>
            </>
          )}
        </div>

        <p className="text-[10px] text-stone-400 font-medium italic">
          💡 Format vocal viral généré par l'IA de Djoss L'Analyste
        </p>
      </div>
    </div>
  );
}
