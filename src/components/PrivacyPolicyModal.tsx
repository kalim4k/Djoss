import React from 'react';
import { X, ShieldCheck, Lock, Eye, Server, Trash2, CheckCircle } from 'lucide-react';
import { MascotAvatar } from './MascotAvatar';

interface PrivacyPolicyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function PrivacyPolicyModal({ isOpen, onClose }: PrivacyPolicyModalProps) {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/75 backdrop-blur-md animate-fade-in"
      onClick={onClose}
      id="privacy-policy-modal-backdrop"
    >
      <div 
        className="relative w-full max-w-2xl max-h-[85vh] bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-stone-200 text-stone-900 flex flex-col animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
        id="privacy-policy-modal-content"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-stone-100 pb-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200/60 shadow-xs">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-serif font-black text-xl text-stone-900 leading-tight">
                Politique de Confidentialité
              </h3>
              <p className="text-xs text-stone-500 font-medium">
                Dernière mise à jour : 2026 — Transparence totale Djoss
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
          
          {/* Key Guarantee Banner */}
          <div className="bg-emerald-50 border border-emerald-200/80 p-4 rounded-2xl flex items-start gap-3 text-emerald-950">
            <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="font-bold text-xs uppercase tracking-wider text-emerald-900">
                Garantie 0 Stockage de Vos Messages
              </h4>
              <p className="text-xs text-emerald-800 leading-relaxed font-medium">
                L'extraction de vos fichiers de chat WhatsApp est exécutée à 100% en local dans votre navigateur. Vos fichiers textes et discussions ne sont jamais enregistrés sur nos serveurs.
              </p>
            </div>
          </div>

          {/* Section 1 */}
          <div className="space-y-2 text-left">
            <h4 className="font-serif font-black text-base text-stone-900 flex items-center gap-2">
              <Lock className="w-4 h-4 text-stone-700" />
              1. Traitement des Fichiers WhatsApp
            </h4>
            <p>
              Lorsque vous importez une discussion WhatsApp sur Djoss, le traitement du fichier (comptage de messages, détection des participants, chronologie) s'effectue directement sur votre téléphone ou ordinateur. Aucune copie brute de vos conversations texte n'est sauvegardée dans nos bases de données.
            </p>
          </div>

          {/* Section 2 */}
          <div className="space-y-2 text-left">
            <h4 className="font-serif font-black text-base text-stone-900 flex items-center gap-2">
              <Server className="w-4 h-4 text-stone-700" />
              2. Données Générées & Rapports
            </h4>
            <p>
              Afin de générer votre rapport d'analyse et vous permettre d'y accéder ultérieurement via un lien unique, seuls les résultats synthétiques de l'analyse (statistiques, verdicts et textes générés) sont conservés de manière sécurisée et chiffrée.
            </p>
          </div>

          {/* Section 3 */}
          <div className="space-y-2 text-left">
            <h4 className="font-serif font-black text-base text-stone-900 flex items-center gap-2">
              <Eye className="w-4 h-4 text-stone-700" />
              3. Transactions & Paiements
            </h4>
            <p>
              Les transactions de paiement (par MoneyFusion / Mobile Money / Carte) sont traitées directement par notre partenaire de paiement sécurisé agréé. Djoss ne stocke à aucun moment vos identifiants bancaires ni vos numéros secrets.
            </p>
          </div>

          {/* Section 4 */}
          <div className="space-y-2 text-left">
            <h4 className="font-serif font-black text-base text-stone-900 flex items-center gap-2">
              <Trash2 className="w-4 h-4 text-stone-700" />
              4. Vos Droits & Suppression
            </h4>
            <p>
              Conformément aux réglementations sur la protection des données personnelles, vous disposez d'un droit d'accès, de modification et de suppression de vos rapports générés. Vous pouvez demander la suppression immédiate de tout rapport à tout moment via notre page Contact.
            </p>
          </div>

        </div>

        {/* Footer Action */}
        <div className="border-t border-stone-100 pt-4 shrink-0">
          <button 
            onClick={onClose}
            className="w-full bg-[#111111] hover:bg-stone-850 text-white py-3.5 rounded-2xl font-bold text-xs sm:text-sm shadow-md transition-all cursor-pointer"
          >
            Fermer et retourner sur Djoss
          </button>
        </div>
      </div>
    </div>
  );
}
