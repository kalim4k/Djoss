import React, { useState } from 'react';
import { X, Check, FileText, Volume2, ShieldCheck, Loader2, ArrowRight, Sparkles, AlertCircle } from 'lucide-react';
import { MascotAvatar } from './MascotAvatar';

export type UnlockOption = 'pack';

interface UnlockModalProps {
  isOpen: boolean;
  onClose: () => void;
  slug?: string;
  defaultName?: string;
  onPayClick?: (optionChoisie: UnlockOption) => void;
}

export function UnlockModal({ isOpen, onClose, slug, defaultName = '', onPayClick }: UnlockModalProps) {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleDirectPayment = async () => {
    setErrorMessage(null);
    setIsLoading(true);

    try {
      const activeSlug = slug || window.location.pathname.split('/').pop() || 'demo';

      const res = await fetch('/api/payments/moneyfusion/initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug: activeSlug,
          phone: '01010101',
          clientName: defaultName.trim() || 'Client Djoss'
        })
      });

      const data = await res.json();

      if (res.ok && data.success && data.url) {
        // Redirect directly to MoneyFusion payment page
        window.location.href = data.url;
      } else {
        setErrorMessage(data.error || "Impossible d'initier le paiement. Veuillez réessayer.");
        setIsLoading(false);
      }
    } catch (err: any) {
      console.error("[UnlockModal] Erreur paiement MoneyFusion:", err);
      setErrorMessage("Une erreur de connexion s'est produite. Vérifiez votre réseau.");
      setIsLoading(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-md transition-all duration-300 animate-fade-in"
      onClick={onClose}
      id="unlock-modal-backdrop"
    >
      <div 
        className="relative w-full max-w-[380px] bg-white rounded-3xl p-6 shadow-2xl border border-stone-200/80 text-stone-900 max-h-[92vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
        id="unlock-modal-content"
      >
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors cursor-pointer"
          aria-label="Fermer"
          id="unlock-modal-close-btn"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Mascot & Header */}
        <div className="text-center pt-1 pb-3">
          <div className="inline-flex items-center justify-center relative mb-3">
            <MascotAvatar expression="wise" size={64} className="rounded-full ring-4 ring-rose-50 shadow-sm" />
            <span className="absolute -bottom-1 -right-1 bg-amber-400 text-stone-950 p-1.5 rounded-full shadow-sm border-2 border-white">
              <Sparkles className="w-3.5 h-3.5 fill-current" />
            </span>
          </div>

          <h3 className="font-serif font-black text-xl text-stone-900 tracking-tight">
            Débloquer l'Analyse
          </h3>
          <p className="text-xs text-stone-500 font-medium mt-1 max-w-[260px] mx-auto">
            Accède immédiatement au rapport écrit complet et à la note vocale audio.
          </p>
        </div>

        {/* Clean Light Pricing Card */}
        <div className="bg-gradient-to-b from-stone-50 to-rose-50/30 rounded-2xl p-4 border border-stone-200/80 space-y-3 text-left my-2">
          
          <div className="flex items-center justify-between pb-3 border-b border-stone-200/70">
            <div>
              <span className="text-[10px] uppercase font-extrabold tracking-wider text-rose-600 block">
                Offre Complète
              </span>
              <div className="flex items-baseline gap-2 mt-0.5">
                <span className="font-serif font-black text-2xl text-stone-900 font-mono">800 FCFA</span>
                <span className="text-xs text-stone-400 line-through font-mono">2 000 FCFA</span>
              </div>
            </div>
            
            <span className="bg-rose-100 text-rose-700 border border-rose-200 text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider">
              -60%
            </span>
          </div>

          {/* Included Items */}
          <div className="space-y-2.5 text-xs font-medium text-stone-700">
            <div className="flex items-start gap-2.5">
              <div className="p-1.5 rounded-lg bg-white shadow-xs border border-stone-200/60 text-rose-600 shrink-0 mt-0.5">
                <FileText className="w-3.5 h-3.5" />
              </div>
              <span className="leading-snug">
                <strong>Rapport Écrit Complet</strong> avec toutes les punchlines, conseils et statistiques.
              </span>
            </div>

            <div className="flex items-start gap-2.5">
              <div className="p-1.5 rounded-lg bg-white shadow-xs border border-stone-200/60 text-amber-600 shrink-0 mt-0.5">
                <Volume2 className="w-3.5 h-3.5" />
              </div>
              <span className="leading-snug">
                <strong>Note Vocale Audio</strong> exclusive de Djoss avec explications cash.
              </span>
            </div>

            <div className="flex items-start gap-2.5">
              <div className="p-1.5 rounded-lg bg-white shadow-xs border border-stone-200/60 text-emerald-600 shrink-0 mt-0.5">
                <Check className="w-3.5 h-3.5" />
              </div>
              <span className="leading-snug">
                Accès permanent et réutilisable.
              </span>
            </div>
          </div>
        </div>

        {/* Error Banner */}
        {errorMessage && (
          <div className="p-3 my-2 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-[11px] flex items-start gap-2 text-left">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <span className="leading-snug">{errorMessage}</span>
          </div>
        )}

        {/* Single Direct Payment Action Button */}
        <div className="pt-2 space-y-3">
          <button 
            onClick={handleDirectPayment}
            disabled={isLoading}
            className="w-full bg-[#BE123C] hover:bg-[#9F0E31] active:scale-[0.98] disabled:opacity-75 text-white py-3.5 px-4 rounded-2xl font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-rose-900/15 transition-all cursor-pointer"
            id="unlock-pay-btn"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-white" />
                <span>Connexion à MoneyFusion...</span>
              </>
            ) : (
              <>
                <span>Débloquer pour 800 FCFA</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>

          {/* Mobile Money Icons & Security */}
          <div className="text-center space-y-2 pt-1">
            <div className="flex items-center justify-center gap-1.5 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full bg-stone-100 text-stone-600 text-[9px] font-bold">Wave</span>
              <span className="px-2.5 py-0.5 rounded-full bg-stone-100 text-stone-600 text-[9px] font-bold">Orange</span>
              <span className="px-2.5 py-0.5 rounded-full bg-stone-100 text-stone-600 text-[9px] font-bold">MTN</span>
              <span className="px-2.5 py-0.5 rounded-full bg-stone-100 text-stone-600 text-[9px] font-bold">Moov</span>
              <span className="px-2.5 py-0.5 rounded-full bg-stone-100 text-stone-600 text-[9px] font-bold">Flooz</span>
            </div>

            <div className="flex items-center justify-center gap-1 text-[10px] text-stone-400 font-medium">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Paiement sécurisé via MoneyFusion</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


