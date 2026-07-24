import React from 'react';
import { ArrowRight, ArrowLeft, MessageSquare } from 'lucide-react';

// MOCK - à remplacer par le vrai comptage du fichier parsé
const statsMock = [
  { nom: "Participant 1", nombreMessages: 557 },
  { nom: "Participant 2", nombreMessages: 490 },
];

interface WhoTalksMostProps {
  stats?: Array<{ nom: string; nombreMessages: number }>;
  onContinue?: () => void;
  onBack?: () => void;
  stepIndexLabel?: string;
}

export const WhoTalksMost: React.FC<WhoTalksMostProps> = ({
  stats = statsMock,
  onContinue,
  onBack,
  stepIndexLabel = "7 sur 11"
}) => {
  // Sort from most messages to least messages
  const sortedStats = [...stats].sort((a, b) => b.nombreMessages - a.nombreMessages);
  const totalMessages = sortedStats.reduce((sum, item) => sum + item.nombreMessages, 0) || 1;

  const handleContinue = () => {
    console.log("[WhoTalksMost] Continuer vers l'étape suivante");
    if (onContinue) {
      onContinue();
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
        <span className="text-sm font-semibold text-stone-500">{stepIndexLabel}</span>
      </div>

      <div className="space-y-1 mt-2">
        <h3 className="font-serif font-black text-2xl text-stone-900 leading-tight">
          Qui parle le plus
        </h3>
      </div>

      {/* Stats Bars */}
      <div className="space-y-6 py-4">
        {sortedStats.map((item, idx) => {
          const percentage = Math.round((item.nombreMessages / totalMessages) * 100);

          return (
            <div key={idx} className="space-y-2">
              <div className="flex justify-between items-center text-sm font-bold text-stone-900">
                <span>{item.nom}</span>
                <span className="flex items-center gap-1.5 text-xs font-semibold text-stone-500">
                  {item.nombreMessages.toLocaleString()} <MessageSquare className="w-3.5 h-3.5 text-stone-400" /> {percentage}%
                </span>
              </div>
              <div className="w-full bg-stone-100 h-3 rounded-full overflow-hidden">
                <div 
                  className="bg-[#1F1F1F] h-full transition-all duration-700 ease-out rounded-full" 
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Continue Button */}
      <div className="pt-4 text-left">
        <button 
          onClick={handleContinue}
          className="bg-[#111111] hover:bg-stone-850 text-white py-4 px-8 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 shadow-md transition-all active:scale-95 cursor-pointer"
        >
          Continuer <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
