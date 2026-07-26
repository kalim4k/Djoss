import React from 'react';
import { X, FileText, Scale, Sparkles, CreditCard, ShieldAlert } from 'lucide-react';

interface TermsOfUseModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function TermsOfUseModal({ isOpen, onClose }: TermsOfUseModalProps) {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/75 backdrop-blur-md animate-fade-in"
      onClick={onClose}
      id="terms-of-use-modal-backdrop"
    >
      <div 
        className="relative w-full max-w-2xl max-h-[85vh] bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-stone-200 text-stone-900 flex flex-col animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
        id="terms-of-use-modal-content"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-stone-100 pb-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200/60 shadow-xs">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-serif font-black text-xl text-stone-900 leading-tight">
                Conditions Générales d'Utilisation
              </h3>
              <p className="text-xs text-stone-500 font-medium">
                CGU & Licence d'utilisation du service Djoss
              </p>
            </div>
          </div>

          <button 
            onClick={onClose}
            className="p-2 rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors cursor-pointer"
            aria-label="Fermer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body Content */}
        <div className="overflow-y-auto space-y-6 my-4 pr-2 text-stone-700 text-xs sm:text-sm font-medium leading-relaxed custom-scrollbar">
          
          {/* Intro Box */}
          <div className="bg-amber-50/70 border border-amber-200/60 p-4 rounded-2xl flex items-start gap-3 text-amber-950">
            <Sparkles className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="font-bold text-xs uppercase tracking-wider text-amber-900">
                Bienvenue sur Djoss !
              </h4>
              <p className="text-xs text-amber-800 leading-relaxed font-medium">
                En utilisant le service Djoss pour analyser vos discussions WhatsApp, vous acceptez pleinement les présentes conditions d'utilisation.
              </p>
            </div>
          </div>

          {/* Section 1 */}
          <div className="space-y-2 text-left">
            <h4 className="font-serif font-black text-base text-stone-900 flex items-center gap-2">
              <Scale className="w-4 h-4 text-stone-700" />
              1. Objet du Service & Usage Divertissant
            </h4>
            <p>
              Djoss est une application d'analyse algorithmique et par Intelligence Artificielle basée sur des données de messagerie texte. Les rapports, verdicts et analyses fournis sont destinés exclusivement à des fins de **divertissement et de prise de recul humoristique**. Ils ne constituent sous aucun prétexte des avis psychologiques, légaux ou médicaux.
            </p>
          </div>

          {/* Section 2 */}
          <div className="space-y-2 text-left">
            <h4 className="font-serif font-black text-base text-stone-900 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-stone-700" />
              2. Propriété des Discussions Importées
            </h4>
            <p>
              L'utilisateur garantit être l'un des participants de la conversation WhatsApp importée ou posséder l'accord express des interlocuteurs pour analyser l'échange. L'utilisation du service pour analyser des discussions obtenues de manière illégale ou frauduleuse est strictement interdite.
            </p>
          </div>

          {/* Section 3 */}
          <div className="space-y-2 text-left">
            <h4 className="font-serif font-black text-base text-stone-900 flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-stone-700" />
              3. Tarif & Accès au Rapport Complet
            </h4>
            <p>
              L'aperçu et le pré-diagnostic de discussion sont 100% gratuits. L'accès au rapport d'analyse complet et détaillé (y compris la version audio) est proposé au tarif de **800 FCFA** par rapport généré. Chaque déblocage donne un accès permanent au rapport via son lien sécurisé.
            </p>
          </div>

          {/* Section 4 */}
          <div className="space-y-2 text-left">
            <h4 className="font-serif font-black text-base text-stone-900 flex items-center gap-2">
              <FileText className="w-4 h-4 text-stone-700" />
              4. Propriété Intellectuelle & Modifications
            </h4>
            <p>
              Le design, l’identité visuelle, la mascotte Djoss et les textes d'analyse sont protégés par le droit d'auteur. Djoss se réserve le droit de faire évoluer les algorithmes d'analyse pour améliorer en continu la précision et la qualité des rapports.
            </p>
          </div>

        </div>

        {/* Footer Action */}
        <div className="border-t border-stone-100 pt-4 shrink-0">
          <button 
            onClick={onClose}
            className="w-full bg-[#111111] hover:bg-stone-850 text-white py-3.5 rounded-2xl font-bold text-xs sm:text-sm shadow-md transition-all cursor-pointer"
          >
            J'accepte les conditions
          </button>
        </div>
      </div>
    </div>
  );
}
