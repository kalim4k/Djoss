import React, { useState } from 'react';
import { Check, ArrowRight, ArrowLeft } from 'lucide-react';

// MOCK - à remplacer par la sortie réelle du parsing WhatsApp
const participantsMock = [
  { id: "1", nomDetecte: "Participant 1", couleur: "#3B82F6" },
  { id: "2", nomDetecte: "Participant 2", couleur: "#EC4899" },
];

interface PerspectiveSelectionProps {
  module: string;
  participants?: Array<{ id: string; nomDetecte: string; couleur?: string }>;
  onPerspectiveSelected?: (selectedName: string) => void;
  onBack?: () => void;
}

export const PerspectiveSelection: React.FC<PerspectiveSelectionProps> = ({
  module,
  participants = participantsMock,
  onPerspectiveSelected,
  onBack
}) => {
  // If module !== "friendzone", component does not render
  if (module !== "friendzone") {
    return null;
  }

  const [selectedName, setSelectedName] = useState<string | null>(null);

  const handleConfirm = () => {
    if (selectedName) {
      console.log("[PerspectiveSelection] Perspective choisie :", selectedName);
      if (onPerspectiveSelected) {
        onPerspectiveSelected(selectedName);
      }
    }
  };

  return (
    <div className="space-y-8 text-left max-w-md mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center text-sm font-semibold text-stone-500">
        <button 
          onClick={onBack}
          className="flex items-center gap-1 hover:text-stone-950 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-5 h-5 text-stone-600" />
        </button>
      </div>

      <div className="space-y-1 mt-2">
        <h3 className="font-serif font-black text-2xl text-stone-900 leading-tight">
          Lequel de ces deux, c'est toi ?
        </h3>
        <p className="text-sm text-stone-500 font-medium">
          Sélectionne ton profil pour que Djoss analyse la conversation depuis ton point de vue.
        </p>
      </div>

      {/* Participant Cards */}
      <div className="grid grid-cols-1 gap-4 py-2">
        {participants.map((p) => {
          const isSelected = selectedName === p.nomDetecte;
          const initial = (p.nomDetecte || "?").trim().charAt(0).toUpperCase();

          return (
            <div
              key={p.id}
              onClick={() => setSelectedName(p.nomDetecte)}
              className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-center justify-between ${
                isSelected
                  ? 'border-stone-900 bg-stone-50 shadow-sm'
                  : 'border-stone-200 bg-white hover:border-stone-300'
              }`}
            >
              <div className="flex items-center gap-4">
                <div 
                  className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-xs"
                  style={{ backgroundColor: p.couleur || '#3B82F6' }}
                >
                  {initial}
                </div>
                <span className="font-bold text-stone-900 text-lg">
                  {p.nomDetecte}
                </span>
              </div>

              <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                isSelected
                  ? 'bg-stone-900 border-stone-900 text-white'
                  : 'border-stone-300 bg-white'
              }`}>
                {isSelected && <Check className="w-4 h-4 stroke-[3]" />}
              </div>
            </div>
          );
        })}
      </div>

      {/* Confirm Button */}
      <div className="pt-4 text-left">
        <button
          disabled={!selectedName}
          onClick={handleConfirm}
          className={`py-4 px-8 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 shadow-md transition-all ${
            selectedName
              ? 'bg-[#111111] hover:bg-stone-850 text-white cursor-pointer active:scale-95'
              : 'bg-stone-300 text-stone-500 cursor-not-allowed'
          }`}
        >
          Confirmer <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
