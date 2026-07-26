import React from 'react';
import { ArrowLeft, FileText, Scale, Sparkles, CreditCard, ShieldAlert } from 'lucide-react';
import { MascotAvatar } from './MascotAvatar';

interface TermsOfUseViewProps {
  onBack: () => void;
}

export function TermsOfUseView({ onBack }: TermsOfUseViewProps) {
  return (
    <div className="w-full max-w-3xl mx-auto space-y-6 text-stone-900 pb-16 animate-fade-in" id="terms-of-use-page">
      {/* Navigation Header */}
      <div className="flex items-center justify-between border-b border-stone-200/80 pb-4">
        <button 
          onClick={onBack}
          className="flex items-center gap-2 text-stone-600 hover:text-stone-950 font-bold text-xs sm:text-sm transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Retour à l'accueil</span>
        </button>

        <div className="flex items-center gap-2 bg-stone-100 px-3 py-1.5 rounded-full border border-stone-200/60">
          <MascotAvatar expression="wise" size={22} />
          <span className="text-xs font-black uppercase tracking-wider text-stone-700">Djoss CGU</span>
        </div>
      </div>

      {/* Main Page Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-10 border border-stone-200/80 shadow-sm space-y-8 text-left">
        
        {/* Page Title */}
        <div className="space-y-2 border-b border-stone-100 pb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-xl bg-amber-100/80 text-amber-800 text-xs font-bold mb-1">
            <FileText className="w-4 h-4" />
            <span>Document Légal</span>
          </div>
          <h1 className="font-serif font-black text-2xl sm:text-3xl text-stone-900 leading-tight">
            Conditions Générales d'Utilisation
          </h1>
          <p className="text-xs sm:text-sm text-stone-500 font-medium">
            Règles d'utilisation du service d'analyse de discussion Djoss
          </p>
        </div>

        {/* Intro Box */}
        <div className="bg-amber-50/70 border border-amber-200/60 p-5 rounded-2xl flex items-start gap-3.5 text-amber-950 shadow-xs">
          <Sparkles className="w-6 h-6 text-amber-500 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h3 className="font-bold text-xs uppercase tracking-wider text-amber-900">
              Bienvenue sur la plateforme Djoss
            </h3>
            <p className="text-xs sm:text-sm text-amber-850 leading-relaxed font-medium">
              En accédant au service Djoss et en générant un rapport d'analyse de conversation WhatsApp, vous acceptez sans réserve l'ensemble des conditions d'utilisation énoncées ci-dessous.
            </p>
          </div>
        </div>

        {/* Content Sections */}
        <div className="space-y-6 text-stone-700 text-xs sm:text-sm font-medium leading-relaxed">
          
          {/* Section 1 */}
          <section className="space-y-2.5">
            <h2 className="font-serif font-black text-lg text-stone-900 flex items-center gap-2">
              <Scale className="w-4 h-4 text-stone-800" />
              1. Usage Divertissant & Humour
            </h2>
            <p>
              Djoss est un service récréatif basé sur des algorithmes d'analyse linguistique et d'Intelligence Artificielle. Les verdicts, notes et commentaires générés sont fournis à des fins de **divertissement et de prise de recul**. Ils n'engagent pas la responsabilité de l'éditeur et ne remplacent en aucun cas un avis professionnel ou psychologique.
            </p>
          </section>

          {/* Section 2 */}
          <section className="space-y-2.5">
            <h2 className="font-serif font-black text-lg text-stone-900 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-stone-800" />
              2. Consentement & Origine des Discussions
            </h2>
            <p>
              L'utilisateur garantit être l'un des participants actifs de la conversation importée ou détenir l'autorisation préalable des interlocuteurs. L'importation de conversations volées, piratées ou interceptées est strictement interdite.
            </p>
          </section>

          {/* Section 3 */}
          <section className="space-y-2.5">
            <h2 className="font-serif font-black text-lg text-stone-900 flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-stone-800" />
              3. Tarification & Licence du Rapport Complet
            </h2>
            <p>
              L'aperçu initial et l'analyse partielle sont gratuits. L'accès au rapport d'analyse complet et au rapport vocal est fixé au tarif unique de **800 FCFA** (ou équivalent). Ce paiement octroie un droit de consultation permanent sur le rapport généré.
            </p>
          </section>

          {/* Section 4 */}
          <section className="space-y-2.5">
            <h2 className="font-serif font-black text-lg text-stone-900 flex items-center gap-2">
              <FileText className="w-4 h-4 text-stone-800" />
              4. Propriété Intellectuelle
            </h2>
            <p>
              L'ensemble des éléments de la plateforme (mascotte Djoss, marques, algorithmes, interfaces) est protégé par les lois sur la propriété intellectuelle. Toute reproduction ou réutilisation non autorisée est interdite.
            </p>
          </section>

        </div>

        {/* Back Button */}
        <div className="pt-4 border-t border-stone-100">
          <button 
            onClick={onBack}
            className="w-full bg-[#111111] hover:bg-stone-850 text-white py-4 rounded-2xl font-black text-xs sm:text-sm shadow-md transition-all cursor-pointer"
          >
            ← J'accepte les conditions, retour à l'accueil
          </button>
        </div>

      </div>
    </div>
  );
}
