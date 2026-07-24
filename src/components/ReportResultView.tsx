import React, { useState } from 'react';
import { Lock, Share2, Check, Shield, Home, MessageSquare, Award, Flag, Star, ArrowLeft, Volume2, Sparkles, Play } from 'lucide-react';
import { MascotAvatar } from './MascotAvatar';
import { PromptCReport, ReportSection, Bloc } from '../types';
import { AudioPlayerModal } from './AudioPlayerModal';

export const MOCK_PROMPT_C_REPORT: PromptCReport = {
  titre: "Exemple de rapport d'analyse Djoss",
  verdict: "PAS FRIENDZONE",
  moduleName: "Rapport Démo",
  sections: [
    {
      id: "recap_choc",
      titre_affiche: "",
      blocs: [
        { 
          type: "texte", 
          contenu: "Ok, j'ai analysé minutieusement vos **1 420 messages** de discussion. Le constat de Djoss est **cash et sans pitié** : vous jouez la comédie des faux-semblants depuis le premier jour." 
        },
        { 
          type: "texte", 
          contenu: "Derrière les politesses et les **émojis de façade**, le rapport de force entre **Alex** et **Sam** révèle qui mène le jeu et qui subit le rythme. **Prépare-toi**, la suite va faire mal !" 
        }
      ]
    },
    {
      id: "casting",
      titre_affiche: "🎭 Les deux personnages",
      blocs: [
        { 
          type: "texte", 
          contenu: "Alex & Sam — Analyse basée sur les fréquences d'échange et la réactivité des messages." 
        },
        { 
          type: "citation", 
          auteur: "Alex", 
          texte: "« On s'appelle plus tard quand tu es dispo ? »" 
        },
        { 
          type: "texte", 
          contenu: "Une dynamique de communication fluide avec une présence régulière au fil de la discussion." 
        },
        { 
          type: "citation", 
          auteur: "Sam", 
          texte: "« Pas de souci, j'ai hâte ! »" 
        }
      ]
    },
    {
      id: "dynamique",
      titre_affiche: "⚡ La dynamique cachée",
      blocs: [
        { 
          type: "texte", 
          contenu: "Les échanges révèlent une attention mutuelle avec un temps de réponse équilibré." 
        },
        { 
          type: "citation", 
          auteur: "Sam", 
          texte: "« Merci pour le partage, c'était super ! »" 
        },
        { 
          type: "texte", 
          contenu: "Complicité constante observée sur l'ensemble de la période analysée." 
        }
      ]
    },
    {
      id: "verdict_final",
      titre_affiche: "🔮 Le verdict sans filtre",
      blocs: [
        { 
          type: "texte", 
          contenu: "L'analyse démontre un dialogue ouvert et réciproque entre les deux interlocuteurs." 
        }
      ]
    }
  ],
  position_coupure_teaser: {
    sectionId: "dynamique",
    blocIndex: 0
  },
  isUnlocked: false
};

interface ReportResultViewProps {
  report: PromptCReport;
  onUnlockClick: () => void;
  onBack?: () => void;
}

export function ReportResultView({ report, onUnlockClick, onBack }: ReportResultViewProps) {
  const [copied, setCopied] = useState(false);
  const [userPhotos, setUserPhotos] = useState<string[]>(() => report.photos || []);
  const [isAudioModalOpen, setIsAudioModalOpen] = useState(false);

  // Sync state if report.photos is updated from external restore
  React.useEffect(() => {
    if (report.photos && report.photos.length > 0) {
      setUserPhotos(report.photos);
    }
  }, [report.photos]);

  const {
    titre,
    verdict,
    moduleName = "Rapport Djoss",
    sections = [],
    position_coupure_teaser = { sectionId: "", blocIndex: 0 },
    isUnlocked = false
  } = report;

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const fileList = Array.from(files).slice(0, 3);
      const promises = fileList.map((file: File) => {
        return new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(file);
        });
      });

      Promise.all(promises).then(base64Photos => {
        setUserPhotos(prev => {
          const updated = [...prev, ...base64Photos].slice(0, 3);
          if (report) {
            report.photos = updated;
            fetch('/api/projects', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                slug: report.id || 'current',
                photos: updated,
                promptCReport: report
              })
            }).catch(err => console.warn("Erreur sauvegarde photos dans la DB:", err));
          }
          return updated;
        });
      });
    }
  };

  const removePhoto = (indexToRemove: number) => {
    setUserPhotos(prev => {
      const updated = prev.filter((_, idx) => idx !== indexToRemove);
      if (report) {
        report.photos = updated;
        fetch('/api/projects', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            slug: report.id || 'current',
            photos: updated,
            promptCReport: report
          })
        }).catch(err => console.warn("Erreur suppression photo dans la DB:", err));
      }
      return updated;
    });
  };

  // Immediate audio generation as soon as report is unlocked
  React.useEffect(() => {
    if (isUnlocked && report) {
      if (!report.audioBase64) {
        console.log("[Djoss] Pré-génération de l'audio en arrière-plan dès le déblocage...");
        fetch(`/api/generate-audio/${report.id || 'current'}`)
          .then(res => res.json())
          .then(data => {
            if (data.audioBase64) {
              report.audioBase64 = data.audioBase64;
            }
            if (data.script) {
              report.audioScript = data.script;
            }
          })
          .catch(err => console.warn("Erreur pré-génération audio:", err));
      }
    }
  }, [isUnlocked, report]);

  // Find cutoff target
  let targetSectionId = "dynamique";
  let targetBlocIndex = 0;

  if (typeof position_coupure_teaser === 'string') {
    const parts = (position_coupure_teaser as string).split(':');
    targetSectionId = parts[0] || "dynamique";
    targetBlocIndex = parseInt(parts[1] || "0", 10);
  } else if (position_coupure_teaser && typeof position_coupure_teaser === 'object') {
    targetSectionId = (position_coupure_teaser as any).sectionId || "dynamique";
    targetBlocIndex = (position_coupure_teaser as any).blocIndex ?? 0;
  }

  const targetSectionIdx = sections.findIndex(s => s.id === targetSectionId);
  const effectiveCutoffSectionIdx = targetSectionIdx !== -1 ? targetSectionIdx : 1;

  // Visible sections when locked vs unlocked
  const visibleSections = isUnlocked 
    ? sections 
    : sections.filter((_, idx) => idx <= effectiveCutoffSectionIdx);

  // Locked sections to feature in the "À suivre" breakdown
  const lockedSections = sections.filter((_, idx) => idx > effectiveCutoffSectionIdx);

  return (
    <div className="w-full max-w-xl mx-auto space-y-6 text-stone-900 pb-12" id="report-result-view">
      {/* Navigation Header */}
      <div className="flex items-center justify-center">
        {/* Header with Djoss Avatar + Module Name */}
        <div className="flex items-center gap-2 bg-stone-100 px-3.5 py-1.5 rounded-full border border-stone-200/60 shadow-xs">
          <MascotAvatar expression="wise" size={24} />
          <span className="text-xs font-black uppercase text-stone-700 tracking-wider">
            {moduleName}
          </span>
        </div>
      </div>

      {/* Title & Verdict */}
      <div className="space-y-3 text-left">
        <h1 className="font-serif font-black text-2xl md:text-3xl text-stone-900 leading-tight">
          {titre}
        </h1>

        {verdict && (() => {
          const isPasFriendzone = verdict.toUpperCase().includes("PAS FRIENDZONE");
          return (
            <div className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl font-serif font-black text-sm shadow-xs ${
              isPasFriendzone 
                ? "bg-emerald-100/90 border border-emerald-300 text-emerald-800" 
                : "bg-red-100/80 border border-red-200 text-[#BE123C]"
            }`}>
              <span>{isPasFriendzone ? '💚' : '🔥'} Verdict Djoss :</span>
              <span className="uppercase tracking-wide">{verdict}</span>
            </div>
          );
        })()}
      </div>

      {/* Djoss Author Card (Matching Brandon layout) */}
      <div className="flex items-center gap-3.5 bg-stone-100/90 border border-stone-200/80 p-3.5 rounded-2xl shadow-xs text-left">
        <MascotAvatar expression="wise" size={56} className="shrink-0" />
        <div className="space-y-0.5">
          <div className="font-bold text-xs text-stone-900 flex items-center gap-1.5">
            <span>Djoss</span>
            <span className="text-[10px] font-bold text-stone-500">• L'IA sans filtre</span>
          </div>
          <p className="text-[11px] text-stone-600 leading-snug font-medium">
            Une IA sans filtre, avec trop d'opinions et un goût inexpliqué pour la vérité.
          </p>
        </div>
      </div>

      {/* Action Buttons: Listen Audio + Share */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <button
          onClick={() => {
            if (isUnlocked) {
              setIsAudioModalOpen(true);
            } else {
              onUnlockClick();
            }
          }}
          className="flex-1 bg-[#BE123C] hover:bg-[#9F0E31] text-white px-5 py-3 rounded-2xl font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md transition-all active:scale-[0.98] cursor-pointer"
          id="btn-listen-report-audio"
        >
          <Volume2 className="w-4 h-4 text-amber-300" />
          <span>ÉCOUTER LE RAPPORT</span>
          <span className="text-[10px] font-bold bg-white/20 text-white px-2 py-0.5 rounded-full">
            AUDIO
          </span>
        </button>

        <button 
          onClick={handleShare}
          className="px-5 py-3 rounded-2xl border border-stone-200 bg-white hover:bg-stone-50 font-bold text-xs text-stone-700 flex items-center justify-center gap-2 shadow-xs transition-all active:scale-[0.98] cursor-pointer"
          id="btn-share-report"
        >
          {copied ? (
            <>
              <Check className="w-4 h-4 text-emerald-600" />
              <span className="text-emerald-600">Lien copié !</span>
            </>
          ) : (
            <>
              <Share2 className="w-4 h-4 text-stone-500" />
              <span>Partager</span>
            </>
          )}
        </button>
      </div>

      {/* Audio Player Modal */}
      <AudioPlayerModal 
        isOpen={isAudioModalOpen}
        onClose={() => setIsAudioModalOpen(false)}
        reportId={report.id}
        reportTitle={titre}
        reportData={report}
      />


      {/* Confidentiality Banner */}
      <div className="bg-stone-100/90 border border-stone-200/60 rounded-2xl p-3.5 text-xs text-stone-600 flex items-center gap-2.5 shadow-xs text-left">
        <Shield className="w-4 h-4 text-emerald-600 shrink-0" />
        <span>
          La conversation ayant servi à créer ce rapport n'a pas été conservée. <span className="font-bold underline cursor-pointer">En savoir plus</span>
        </span>
      </div>

      {/* Photo Personalization Container (Matching Brandon screenshot style - 3 photos max) */}
      <div className="border-2 border-dashed border-stone-200/90 hover:border-amber-300 transition-all rounded-3xl p-6 text-center bg-stone-50/50 shadow-xs relative my-6">
        {userPhotos.length > 0 ? (
          <div className="space-y-4">
            <div className="flex justify-center items-center gap-3.5">
              {userPhotos.map((photo, idx) => (
                <div key={idx} className="relative group w-24 h-24 md:w-28 md:h-28 rounded-2xl overflow-hidden border-2 border-white shadow-md transition-transform hover:scale-105">
                  <img src={photo} alt={`Photo ${idx + 1}`} className="w-full h-full object-cover" />
                  <button 
                    onClick={() => removePhoto(idx)}
                    className="absolute top-1 right-1 bg-stone-900/80 hover:bg-black text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                    title="Supprimer la photo"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
            
            <div className="flex justify-center items-center gap-3">
              {userPhotos.length < 3 && (
                <label className="cursor-pointer bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all shadow-xs inline-flex items-center gap-2">
                  <span>Ajouter des photos ({userPhotos.length}/3)</span>
                  <input type="file" accept="image/*" multiple onChange={handlePhotoUpload} className="hidden" />
                </label>
              )}
              <span className="text-[11px] font-bold text-stone-500">
                {userPhotos.length} / 3 photo{userPhotos.length > 1 ? 's' : ''} ajoutée{userPhotos.length > 1 ? 's' : ''}
              </span>
            </div>
          </div>
        ) : (
          <label className="cursor-pointer flex flex-col items-center justify-center space-y-3 group py-2">
            <div className="flex -space-x-3 overflow-hidden py-1">
              <img className="inline-block h-12 w-12 rounded-2xl ring-2 ring-white object-cover shadow-sm" src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80" alt="Exemple 1" />
              <img className="inline-block h-12 w-12 rounded-2xl ring-2 ring-white object-cover shadow-sm" src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&q=80" alt="Exemple 2" />
              <img className="inline-block h-12 w-12 rounded-2xl ring-2 ring-white object-cover shadow-sm" src="https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=120&q=80" alt="Exemple 3" />
            </div>
            <div className="font-bold text-xs text-stone-700 group-hover:text-stone-900 transition-colors flex items-center gap-1.5">
              <span>Ajoute des photos (3 max)</span>
            </div>
            <p className="text-[11px] text-stone-500 font-medium">
              Glisse ou clique pour ajouter jusqu'à 3 photos pour immortaliser ce rapport
            </p>
            <input type="file" accept="image/*" multiple onChange={handlePhotoUpload} className="hidden" />
          </label>
        )}
      </div>

      {/* Report Sections Render */}
      <div className="space-y-8 text-left relative" id="report-sections-container">
        {visibleSections.map((section, sIdx) => {
          const isCutoffSection = !isUnlocked && sIdx === effectiveCutoffSectionIdx;
          
          // Filter blocks if cutoff section
          const blocksToRender = isCutoffSection 
            ? section.blocs.filter((_, bIdx) => bIdx <= targetBlocIndex + 1)
            : section.blocs;

          // Choose appropriate Djoss mascot expression stamp per section index
          const mascotExpressions: Array<'laughing' | 'cool' | 'thinking' | 'wise'> = [
            'laughing',
            'cool',
            'thinking',
            'wise'
          ];
          const currentMascotExpr = mascotExpressions[sIdx % mascotExpressions.length];

          return (
            <div key={section.id || sIdx} className="space-y-4 pt-2">
              {/* Mascot Divider Badge for subsequent sections */}
              {sIdx > 0 && (
                <div className="flex flex-col items-center justify-center my-4">
                  <MascotAvatar expression={currentMascotExpr} size={88} className="-mb-1" />
                  <div className="w-1.5 h-1.5 rounded-full bg-stone-300" />
                </div>
              )}

              {Boolean(section.titre_affiche) && (
                <h2 className="font-serif font-black text-xl text-stone-900 flex items-center gap-2 border-b border-stone-200 pb-2">
                  {section.titre_affiche}
                </h2>
              )}

              <div className="space-y-3">
                {blocksToRender.map((bloc: Bloc, bIdx: number) => {
                  const isBlurred = isCutoffSection && bIdx > targetBlocIndex;

                  return (
                    <div 
                      key={bIdx}
                      className={`transition-all duration-300 ${
                        isBlurred ? 'blur-xs select-none opacity-40 pointer-events-none' : ''
                      }`}
                    >
                      {(() => {
                        const b = bloc as any;
                        const isCitation = b.type === 'citation' || b.type === 'quote' || Boolean(b.auteur);
                        const textContent = String(b.contenu || b.texte || b.text || b.content || '').trim();
                        const author = String(b.auteur || b.author || 'Anonyme');

                        if (!textContent && !isCitation) return null;

                        const renderFormattedText = (text: string) => {
                          if (!text) return null;
                          const parts = text.split(/(\*\*.*?\*\*)/g);
                          return parts.map((part, idx) => {
                            if (part.startsWith('**') && part.endsWith('**') && part.length >= 4) {
                              return (
                                <strong key={idx} className="font-extrabold text-stone-950">
                                  {part.slice(2, -2)}
                                </strong>
                              );
                            }
                            return part;
                          });
                        };

                        if (isCitation) {
                          return (
                            <div className="my-3 flex flex-col items-start text-left">
                              <span className="text-[11px] font-bold text-emerald-800 ml-2 mb-1 opacity-80">
                                ~ {author}
                              </span>
                              <div className="bg-[#DCF8C6] text-stone-900 border border-emerald-200/80 px-4 py-3 rounded-2xl rounded-tl-xs shadow-xs text-sm font-sans max-w-[90%] leading-snug">
                                {renderFormattedText(textContent)}
                              </div>
                            </div>
                          );
                        }

                        return (
                          <p className="text-stone-800 leading-relaxed font-medium text-sm my-2 text-left">
                            {renderFormattedText(textContent)}
                          </p>
                        );
                      })()}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}

        {/* Teaser Cutoff Overlay & Unlock Button */}
        {!isUnlocked && (
          <div className="relative pt-4 pb-2 space-y-6 text-center" id="teaser-unlock-block">
            {/* Soft Overlay Gradient */}
            <div className="absolute -top-24 left-0 right-0 h-28 bg-gradient-to-b from-transparent via-stone-50/80 to-stone-50 pointer-events-none" />

            {/* Black Unlock Button */}
            <button 
              onClick={onUnlockClick}
              className="relative z-10 w-full bg-[#1F1F1F] hover:bg-[#333333] text-white py-4 rounded-2xl font-black text-sm flex items-center justify-center gap-2.5 shadow-xl transition-all active:scale-[0.98]"
              id="btn-unlock-report-main"
            >
              <Lock className="w-4 h-4 text-amber-400 fill-amber-400" />
              <span>Débloquer le rapport complet</span>
            </button>

            {/* Dynamic "À suivre dans le rapport complet" List */}
            <div className="pt-4 space-y-3 bg-white p-5 rounded-2xl border border-stone-200/80 shadow-xs text-left" id="a-suivre-list">
              <h3 className="font-serif font-black text-xs text-stone-500 text-center uppercase tracking-wider">
                🔒 À suivre dans le rapport complet :
              </h3>
              
              <div className="space-y-2 text-xs text-stone-700 font-semibold">
                {lockedSections.length > 0 ? (
                  lockedSections.map((sec, i) => (
                    <div key={sec.id || i} className="flex items-center justify-between p-3 rounded-xl bg-stone-50 border border-stone-200/50">
                      <div className="flex items-center gap-2.5">
                        <Lock className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                        <span className="font-bold text-stone-800">{sec.titre_affiche}</span>
                      </div>
                      <span className="text-[10px] font-black uppercase text-amber-700 bg-amber-50 border border-amber-200/60 px-2 py-0.5 rounded-md">
                        Bloqué
                      </span>
                    </div>
                  ))
                ) : (
                  <>
                    <div className="flex items-center gap-3 p-2.5 rounded-xl bg-stone-50">
                      <MessageSquare className="w-4 h-4 text-indigo-600 shrink-0" />
                      <span>Le dialecte privé (décodage complet)</span>
                    </div>
                    <div className="flex items-center gap-3 p-2.5 rounded-xl bg-stone-50">
                      <Award className="w-4 h-4 text-amber-500 shrink-0" />
                      <span>La cérémonie des récompenses</span>
                    </div>
                    <div className="flex items-center gap-3 p-2.5 rounded-xl bg-stone-50">
                      <Flag className="w-4 h-4 text-red-500 shrink-0" />
                      <span>Red flags et green flags de la conversation</span>
                    </div>
                    <div className="flex items-center gap-3 p-2.5 rounded-xl bg-stone-50">
                      <Star className="w-4 h-4 text-amber-400 shrink-0" />
                      <span>L'avis Yelp et conseil de Djoss</span>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Static Social Proof Block */}
            <div className="bg-stone-100/80 border border-stone-200/60 p-3.5 rounded-2xl text-center text-xs text-stone-600 font-semibold shadow-xs">
              🔥 <span className="font-black text-stone-900">+1 240 rapports</span> générés cette semaine par Djoss L'Analyste
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
