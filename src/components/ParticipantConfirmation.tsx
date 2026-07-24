import React, { useState } from 'react';
import { Pencil, ArrowRight, ArrowLeft } from 'lucide-react';

// MOCK - à remplacer par la sortie réelle du parsing WhatsApp
const participantsMock = [
  { id: "1", nomDetecte: "Participant 1", couleur: "#3B82F6" },
  { id: "2", nomDetecte: "Participant 2", couleur: "#EC4899" },
];

interface ParticipantConfirmationProps {
  initialParticipants?: typeof participantsMock;
  onAllConfirmed?: (confirmedNames: string[]) => void;
  onBack?: () => void;
  currentStepIndexLabel?: string;
}

export const ParticipantConfirmation: React.FC<ParticipantConfirmationProps> = ({
  initialParticipants = participantsMock,
  onAllConfirmed,
  onBack,
  currentStepIndexLabel = "8 sur 11"
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [names, setNames] = useState<string[]>(
    initialParticipants.map((p) => p.nomDetecte)
  );

  const currentParticipant = initialParticipants[currentIndex];
  const totalCount = initialParticipants.length;

  const handleNameChange = (val: string) => {
    const updated = [...names];
    updated[currentIndex] = val;
    setNames(updated);
  };

  const handleConfirmCurrent = () => {
    if (currentIndex < totalCount - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      console.log("[ParticipantConfirmation] Tous les participants confirmés :", names);
      if (onAllConfirmed) {
        onAllConfirmed(names);
      }
    }
  };

  const initial = (names[currentIndex] || "?").trim().charAt(0).toUpperCase();

  return (
    <div className="space-y-8 text-left max-w-md mx-auto">
      {/* Step navigation header */}
      <div className="flex justify-between items-center text-sm font-semibold text-stone-500">
        <button 
          onClick={() => {
            if (currentIndex > 0) {
              setCurrentIndex((prev) => prev - 1);
            } else if (onBack) {
              onBack();
            }
          }}
          className="flex items-center gap-1 hover:text-stone-950 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-5 h-5 text-stone-600" />
        </button>
        <span className="text-sm font-semibold text-stone-500">
          {currentStepIndexLabel || `${currentIndex + 1} sur ${totalCount}`}
        </span>
      </div>

      <div className="space-y-1 mt-4">
        <h3 className="font-serif font-black text-2xl text-stone-900 leading-tight">
          Djoss va utiliser ces noms dans le rapport
        </h3>
        <p className="text-sm text-stone-500 font-medium">
          On recommande d'utiliser juste les prénoms
        </p>
      </div>

      {/* Avatar & Editable Input */}
      <div className="space-y-6 py-6 text-center">
        <div className="flex justify-center">
          <div 
            className="w-28 h-28 rounded-full flex items-center justify-center text-white text-4xl font-serif font-black shadow-sm mx-auto my-4 transition-all duration-300"
            style={{ backgroundColor: currentParticipant?.couleur || "#3B82F6" }}
          >
            {initial}
          </div>
        </div>

        <div className="relative max-w-xs mx-auto flex items-center justify-center border-b border-stone-300 focus-within:border-stone-800 py-1 transition-all">
          <input 
            type="text"
            value={names[currentIndex] || ""}
            onChange={(e) => handleNameChange(e.target.value)}
            className="w-full text-center text-2xl font-black text-stone-900 bg-transparent focus:outline-none placeholder-stone-300"
            placeholder={`Nom du participant ${currentIndex + 1}`}
          />
          <Pencil className="w-4 h-4 text-stone-400 absolute right-1 pointer-events-none" />
        </div>
      </div>

      {/* Confirm Button */}
      <div className="pt-4 text-left">
        <button 
          onClick={handleConfirmCurrent}
          className="bg-[#111111] hover:bg-stone-850 text-white py-4 px-8 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 shadow-md transition-all active:scale-95 cursor-pointer"
        >
          Confirmer <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
