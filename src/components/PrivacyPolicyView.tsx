import React from 'react';
import { ArrowLeft, ShieldCheck, Lock, Eye, Server, Trash2, CheckCircle2 } from 'lucide-react';
import { MascotAvatar } from './MascotAvatar';

interface PrivacyPolicyViewProps {
  onBack: () => void;
}

export function PrivacyPolicyView({ onBack }: PrivacyPolicyViewProps) {
  return (
    <div className="w-full max-w-3xl mx-auto space-y-6 text-stone-900 pb-16 animate-fade-in" id="privacy-policy-page">
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
          <span className="text-xs font-black uppercase tracking-wider text-stone-700">Djoss Privacy</span>
        </div>
      </div>

      {/* Main Page Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-10 border border-stone-200/80 shadow-sm space-y-8 text-left">
        
        {/* Page Title */}
        <div className="space-y-2 border-b border-stone-100 pb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-xl bg-emerald-100/80 text-emerald-800 text-xs font-bold mb-1">
            <ShieldCheck className="w-4 h-4" />
            <span>Document Officiel</span>
          </div>
          <h1 className="font-serif font-black text-2xl sm:text-3xl text-stone-900 leading-tight">
            Politique de Confidentialité
          </h1>
          <p className="text-xs sm:text-sm text-stone-500 font-medium">
            Dernière mise à jour : 2026 — Transparence totale sur la gestion de vos données
          </p>
        </div>

        {/* Key Guarantee Banner */}
        <div className="bg-emerald-50 border border-emerald-200/80 p-5 rounded-2xl flex items-start gap-3.5 text-emerald-950 shadow-xs">
          <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h3 className="font-bold text-xs uppercase tracking-wider text-emerald-900">
              Garantie 0 Stockage de Vos Conversations WhatsApp
            </h3>
            <p className="text-xs sm:text-sm text-emerald-850 leading-relaxed font-medium">
              L'extraction et l'analyse de vos fichiers de discussion `.txt` s'effectuent à 100% localement dans votre navigateur web. Aucun texte brut de vos échanges n'est sauvegardé sur nos serveurs.
            </p>
          </div>
        </div>

        {/* Content Sections */}
        <div className="space-y-6 text-stone-700 text-xs sm:text-sm font-medium leading-relaxed">
          
          {/* Section 1 */}
          <section className="space-y-2.5">
            <h2 className="font-serif font-black text-lg text-stone-900 flex items-center gap-2">
              <Lock className="w-4 h-4 text-stone-800" />
              1. Traitement des Fichiers WhatsApp
            </h2>
            <p>
              Lorsque vous déposez un fichier d'export WhatsApp sur Djoss, l'analyse des métriques (fréquences des messages, temps de réponse, mots clés) est traitée directement dans la mémoire de votre appareil. Vos discussions personnelles restent strictement confidentielles et privées.
            </p>
          </section>

          {/* Section 2 */}
          <section className="space-y-2.5">
            <h2 className="font-serif font-black text-lg text-stone-900 flex items-center gap-2">
              <Server className="w-4 h-4 text-stone-800" />
              2. Données Générées & Sauvegarde du Rapport
            </h2>
            <p>
              Afin de vous permettre de consulter votre rapport à tout moment ou de le partager via un lien sécurisé, seuls les résultats synthétiques générés par Djoss (verdict, statistiques résumées et synthèse textuelle) sont sauvegardés de manière sécurisée.
            </p>
          </section>

          {/* Section 3 */}
          <section className="space-y-2.5">
            <h2 className="font-serif font-black text-lg text-stone-900 flex items-center gap-2">
              <Eye className="w-4 h-4 text-stone-800" />
              3. Sécurité des Paiements Mobile Money & Cartes
            </h2>
            <p>
              Toutes les transactions financières pour le déblocage des rapports complets (800 FCFA) sont orchestrées via notre partenaire de paiement sécurisé agréé MoneyFusion. Djoss ne stocke ni n'accède à vos codes secrets ou numéros bancaires.
            </p>
          </section>

          {/* Section 4 */}
          <section className="space-y-2.5">
            <h2 className="font-serif font-black text-lg text-stone-900 flex items-center gap-2">
              <Trash2 className="w-4 h-4 text-stone-800" />
              4. Droit de Suppression des Données
            </h2>
            <p>
              Vous conservez l'entière propriété de vos données. Si vous souhaitez supprimer définitivement un rapport généré de nos serveurs, il vous suffit de nous contacter avec la référence du rapport pour une suppression sous 24 heures.
            </p>
          </section>

        </div>

        {/* Back Button */}
        <div className="pt-4 border-t border-stone-100">
          <button 
            onClick={onBack}
            className="w-full bg-[#111111] hover:bg-stone-850 text-white py-4 rounded-2xl font-black text-xs sm:text-sm shadow-md transition-all cursor-pointer"
          >
            ← Retour à l'accueil Djoss
          </button>
        </div>

      </div>
    </div>
  );
}
