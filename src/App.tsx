import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Upload, ShieldCheck, Check, Lock, Music, Phone, Share2, 
  ArrowRight, Sparkles, Heart, Users, Volume2, Play, Pause, 
  Loader2, Info, Copy, ChevronRight, RefreshCw, AlertCircle, Award,
  ArrowLeft, Pencil, MessageSquare, Image, ArrowDown, X
} from 'lucide-react';

function SignalBars({ className = "w-4 h-4 text-emerald-600" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <rect x="2" y="16" width="3" height="5" rx="1" />
      <rect x="7" y="12" width="3" height="9" rx="1" />
      <rect x="12" y="8" width="3" height="13" rx="1" />
      <rect x="17" y="4" width="3" height="17" rx="1" />
    </svg>
  );
}
import JSZip from 'jszip';
import { MascotAvatar } from './components/MascotAvatar';
import { ParticipantConfirmation } from './components/ParticipantConfirmation';
import { PerspectiveSelection } from './components/PerspectiveSelection';
import { WhoTalksMost } from './components/WhoTalksMost';
import { ReportResultView, MOCK_PROMPT_C_REPORT } from './components/ReportResultView';
import { UnlockModal, UnlockOption } from './components/UnlockModal';
import { AdminDashboard } from './components/AdminDashboard';
import { AnalysisReport, ModuleType, ToneMode, WhatsAppParticipant, PromptCReport } from './types';

const isGroupModule = (mod: ModuleType) => mod === 'group' || mod === 'family' || mod === 'work';

function WhatsAppProofViewer({ proofs, meName, participants }: { proofs?: any[], meName?: string, participants?: string[] }) {
  if (!proofs || proofs.length === 0) return null;
  
  // Choose which sender goes to left vs right
  const mainSender = meName || participants?.[0] || "";
  
  return (
    <div className="mt-2.5 space-y-2 w-full">
      {proofs.map((proof, idx) => {
        const isMe = proof.sender.toLowerCase() === mainSender.toLowerCase();
        
        return (
          <div 
            key={idx} 
            className={`flex w-full ${isMe ? 'justify-end' : 'justify-start'}`}
            id={`chat-bubble-container-${idx}`}
          >
            <div 
              className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-xs shadow-sm relative ${
                isMe 
                  ? 'bg-[#E3F6FC] text-stone-950 rounded-tr-none border border-[#B6E1F2]' 
                  : 'bg-[#F2F7F4] text-stone-950 rounded-tl-none border border-[#DCEBE3]'
              }`}
              id={`chat-bubble-${idx}`}
            >
              {/* Sender Name */}
              <span className="block font-black text-[9px] mb-0.5" style={{ color: isMe ? '#0284c7' : '#15803d' }}>
                {proof.sender}
              </span>
              <p className="text-stone-900 font-semibold leading-relaxed break-words">{proof.message}</p>
              
              <div className="flex items-center justify-end gap-1 mt-1 text-[8px] text-stone-400 font-mono">
                {proof.timestamp && <span>{proof.timestamp}</span>}
                {isMe && <span className="text-[#34B7F1] font-bold text-[10px] ml-1">✓✓</span>}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function hasActiveSlugInUrl(): boolean {
  if (typeof window === 'undefined') return false;
  const params = new URLSearchParams(window.location.search);
  const activeSlug = params.get('sharedReportId') || params.get('p') || params.get('slug');
  if (activeSlug) return true;
  if (window.location.hash) {
    const match = window.location.hash.match(/#\/?(?:r\/)?([a-zA-Z0-9_-]+)/);
    if (match && match[1] && !['landing', 'wizard', 'teaser', 'report', 'payment', 'admin'].includes(match[1])) {
      return true;
    }
  }
  return false;
}

export default function App() {
  // Navigation & Screen State
  const [currentStep, setCurrentStep] = useState<
    'landing' | 'wizard' | 'teaser' | 'payment' | 'report' | 'admin'
  >(() => {
    if (typeof window !== 'undefined' && (window.location.hash.includes('admin') || window.location.pathname.includes('admin'))) {
      return 'admin';
    }
    return 'landing';
  });

  // Project Slug & Persistence State
  const [isRestored, setIsRestored] = useState<boolean>(false);
  const [projectSlug, setProjectSlug] = useState<string>(() => {
    const hash = window.location.hash;
    const match = hash.match(/#\/?(?:r\/)?([a-zA-Z0-9_-]+)/);
    if (match && match[1] && !['landing', 'wizard', 'teaser', 'report', 'payment'].includes(match[1])) {
      return match[1];
    }
    const params = new URLSearchParams(window.location.search);
    const p = params.get('p') || params.get('slug') || params.get('sharedReportId');
    if (p) return p;
    return Math.random().toString(36).substring(2, 8);
  });

  // Wizard Step Trackers (11 Steps inspired by Brandon)
  const [wizardStepIndex, setWizardStepIndex] = useState<number>(1);
  const [selectedDialect, setSelectedDialect] = useState<'french' | 'english'>('french');
  const [relationContext, setRelationContext] = useState<string>('');
  const [confirmedMeName, setConfirmedMeName] = useState<string>('');
  const [confirmedPartnerName, setConfirmedPartnerName] = useState<string>('');
  const [selectedAvatar, setSelectedAvatar] = useState<string>('cool');
  const [activeParticipantEditIndex, setActiveParticipantEditIndex] = useState<number>(0);

  // Shared state via query params (Viral loop)
  const [sharedReportId, setSharedReportId] = useState<string | null>(null);
  const [isSharedView, setIsSharedView] = useState(false);

  // Unlock Modal & Prompt C Report State
  const [isUnlockModalOpen, setIsUnlockModalOpen] = useState<boolean>(false);
  const [promptCReportData, setPromptCReportData] = useState<PromptCReport | null>(null);
  const [isGeneratingPromptC, setIsGeneratingPromptC] = useState<boolean>(false);

  // User Choices
  const [selectedModule, setSelectedModule] = useState<ModuleType>('friendzone');
  const [selectedTone, setSelectedTone] = useState<ToneMode>('normal');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [parsedParticipants, setParsedParticipants] = useState<WhatsAppParticipant[]>([]);
  const [totalMessages, setTotalMessages] = useState<number>(0);
  const [rawFileContent, setRawFileContent] = useState<string>('');

  // Counting & Fill Animation State
  const [displayCount, setDisplayCount] = useState<number>(0);
  const [fillProgress, setFillProgress] = useState<number>(0);
  const [isCounting, setIsCounting] = useState<boolean>(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState<boolean>(false);

  const triggerCountAnimation = (targetCount: number) => {
    setIsCounting(true);
    setFillProgress(0);
    setDisplayCount(0);
    
    const duration = 1400; // 1.4s animation
    const startTime = performance.now();
    
    const step = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Cubic ease-out
      const easeOut = 1 - Math.pow(1 - progress, 3);
      
      setFillProgress(Math.round(easeOut * 100));
      setDisplayCount(Math.round(easeOut * targetCount));
      
      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        setIsCounting(false);
        setFillProgress(100);
        setDisplayCount(targetCount);
      }
    };
    requestAnimationFrame(step);
  };

  useEffect(() => {
    if (wizardStepIndex === 5 && totalMessages > 0 && fillProgress === 0) {
      setFillProgress(100);
      setDisplayCount(totalMessages);
    }
  }, [wizardStepIndex, totalMessages, fillProgress]);
  
  // App Logic State
  const [reportId, setReportId] = useState<string>('');
  const [report, setReport] = useState<AnalysisReport | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  
  // Loading Fun Quotes Interval
  const [loadingQuote, setLoadingQuote] = useState("Djoss ouvre le dossier...");
  
  // Payment Simulator State
  const [selectedOffer, setSelectedOffer] = useState<'written' | 'pack'>('pack');
  const [paymentProvider, setPaymentProvider] = useState<'tmoney' | 'flooz'>('tmoney');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [paymentStep, setPaymentStep] = useState<'idle' | 'initiating' | 'push_sent' | 'waiting_pin' | 'success' | 'error'>('idle');
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [paymentSuccessMessage, setPaymentSuccessMessage] = useState<string | null>(null);

  // Audio Player State
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioProgress, setAudioProgress] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0);
  const [audioError, setAudioError] = useState<string | null>(null);
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const synthUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const analysisTriggeredRef = useRef<boolean>(false);

  // Interactive Hero Mascot state
  const [heroMood, setHeroMood] = useState<'wise' | 'cool' | 'laughing' | 'thinking' | 'shocked'>('wise');

  // Copy indicator
  const [copiedText, setCopiedText] = useState<string | null>(null);

  // FAQ Accordion State
  const [activeFaqIndex, setActiveFaqIndex] = useState<number | null>(null);

  // Synchronize current project state to database/Supabase & LocalStorage
  const syncStateToDb = async (overrides: Record<string, any> = {}) => {
    if (!isRestored && !overrides.force) return;
    const slugToUse = overrides.slug || projectSlug;
    if (!slugToUse) return;

    try {
      const payload = {
        slug: slugToUse,
        currentStep: overrides.currentStep || currentStep,
        wizardStepIndex: overrides.wizardStepIndex !== undefined ? overrides.wizardStepIndex : wizardStepIndex,
        selectedModule: overrides.selectedModule || selectedModule,
        selectedTone: overrides.selectedTone || selectedTone,
        selectedDialect: overrides.selectedDialect || selectedDialect,
        relationContext: overrides.relationContext || relationContext,
        confirmedMeName: overrides.confirmedMeName || confirmedMeName,
        confirmedPartnerName: overrides.confirmedPartnerName || confirmedPartnerName,
        parsedParticipants: overrides.parsedParticipants || parsedParticipants,
        totalMessages: overrides.totalMessages || totalMessages,
        reportId: overrides.reportId || reportId || slugToUse,
        report: overrides.report !== undefined ? overrides.report : report,
        promptCReport: overrides.promptCReport !== undefined ? overrides.promptCReport : promptCReportData,
        rawFileContent: overrides.rawFileContent !== undefined ? overrides.rawFileContent : rawFileContent
      };

      try {
        localStorage.setItem(`djoss_project_${slugToUse}`, JSON.stringify(payload));
        localStorage.setItem('djoss_last_project_slug', slugToUse);
      } catch (e) {
        console.warn("[Djoss] Error writing to localStorage:", e);
      }

      await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
    } catch (err) {
      console.warn("[Djoss] Erreur de synchronisation du projet:", err);
    }
  };

  // Sync on step or state change
  useEffect(() => {
    if (!isRestored) return;

    if (currentStep === 'wizard') {
      window.history.replaceState(null, '', `#/r/${projectSlug}/step-${wizardStepIndex}`);
    } else if (currentStep === 'report' || currentStep === 'teaser') {
      window.history.replaceState(null, '', `#/r/${projectSlug}`);
    } else if (currentStep === 'admin') {
      window.history.replaceState(null, '', `#/admin`);
    } else if (currentStep === 'landing') {
      window.history.replaceState(null, '', `/`);
    }

    syncStateToDb();
  }, [
    wizardStepIndex, 
    currentStep, 
    confirmedMeName, 
    confirmedPartnerName, 
    relationContext, 
    selectedDialect, 
    selectedModule,
    selectedTone,
    projectSlug, 
    promptCReportData, 
    report, 
    isRestored
  ]);

  // Helper to safely apply restored state from localStorage or backend DB
  const applyRestoredData = (data: any, activeSlug: string) => {
    if (!data) return;
    if (data.wizardStepIndex !== undefined) setWizardStepIndex(data.wizardStepIndex);
    if (data.confirmedMeName) setConfirmedMeName(data.confirmedMeName);
    if (data.confirmedPartnerName) setConfirmedPartnerName(data.confirmedPartnerName);
    if (data.selectedDialect) setSelectedDialect(data.selectedDialect);
    if (data.relationContext) setRelationContext(data.relationContext);
    if (data.selectedModule) setSelectedModule(data.selectedModule);
    if (data.selectedTone) setSelectedTone(data.selectedTone);
    if (data.totalMessages) setTotalMessages(data.totalMessages);
    if (data.parsedParticipants) setParsedParticipants(data.parsedParticipants);
    if (data.rawFileContent) setRawFileContent(data.rawFileContent);

    // Merge unlock state: if unlocked anywhere (local or DB), keep it unlocked permanently
    setPromptCReportData(prev => {
      const isUnlocked = Boolean(
        prev?.isUnlocked ||
        data.promptCReport?.isUnlocked ||
        data.report?.isUnlocked ||
        data.isUnlocked
      );
      if (data.promptCReport) {
        return {
          ...data.promptCReport,
          id: data.promptCReport.id || data.slug || activeSlug,
          isUnlocked
        };
      }
      if (prev) {
        return { ...prev, isUnlocked };
      }
      return null;
    });

    setReport(prev => {
      const isUnlocked = Boolean(
        prev?.isUnlocked ||
        data.promptCReport?.isUnlocked ||
        data.report?.isUnlocked ||
        data.isUnlocked
      );
      if (data.report) {
        return { ...data.report, isUnlocked };
      }
      if (prev) {
        return { ...prev, isUnlocked };
      }
      return null;
    });

    // Step routing logic: 'teaser' maps to 'report' view
    let stepToSet = data.currentStep;
    if (stepToSet === 'teaser') {
      stepToSet = 'report';
    }

    if (stepToSet && stepToSet !== 'landing') {
      setCurrentStep(stepToSet);
    } else if (data.promptCReport || data.report) {
      setCurrentStep('report');
    } else if (data.wizardStepIndex) {
      setCurrentStep('wizard');
    }
  };

  // Load project from slug on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    let activeSlug = params.get('sharedReportId') || params.get('p') || params.get('slug');
    const isPaymentReturn = params.get('payment') === 'success' || params.get('token') || params.get('tokenPay');
    const paymentToken = params.get('token') || params.get('tokenPay') || '';

    if (!activeSlug && window.location.hash) {
      const match = window.location.hash.match(/#\/?(?:r\/)?([a-zA-Z0-9_-]+)/);
      if (match && match[1] && !['landing', 'wizard', 'teaser', 'report', 'payment', 'admin'].includes(match[1])) {
        activeSlug = match[1];
      }
    }

    if (activeSlug) {
      setProjectSlug(activeSlug);
      setReportId(activeSlug);

      // 1. Instant local restoration from localStorage
      try {
        const localDataRaw = localStorage.getItem(`djoss_project_${activeSlug}`);
        if (localDataRaw) {
          const localData = JSON.parse(localDataRaw);
          console.log("[Djoss] Restauration instantanée depuis localStorage:", localData);
          applyRestoredData(localData, activeSlug);
        }
      } catch (e) {
        console.warn("[Djoss] Erreur lecture localStorage:", e);
      }

      // 2. Fetch from database to get synced state from backend
      fetch(`/api/projects/${activeSlug}`)
        .then(res => res.ok ? res.json() : null)
        .then(async (dbData) => {
          if (dbData) {
            console.log("[Djoss] Projet restauré depuis BDD:", dbData);
            applyRestoredData(dbData, activeSlug);
          }

          // 3. Verify MoneyFusion payment if returning from payment redirect
          if (isPaymentReturn || paymentToken) {
            try {
              const checkRes = await fetch(`/api/payments/moneyfusion/check/${paymentToken || 'verify'}?slug=${activeSlug}`);
              const checkData = await checkRes.json();
              if (checkData.success && checkData.isUnlocked) {
                setPromptCReportData(prev => prev ? { ...prev, isUnlocked: true } : null);
                setReport(prev => prev ? { ...prev, isUnlocked: true } : null);
                setCurrentStep('report');
                setPaymentSuccessMessage("🎉 Paiement MoneyFusion confirmé ! Votre rapport Djoss est totalement débloqué.");
              }
            } catch (pErr) {
              console.warn("Erreur vérification paiement MoneyFusion:", pErr);
            }
          }
        })
        .catch(err => console.warn("Erreur chargement projet par slug:", err))
        .finally(() => {
          setIsRestored(true);
        });
    } else {
      window.history.replaceState(null, '', `/`);
      setIsRestored(true);
    }
  }, []);

  // Fetch Report from API
  const fetchSharedReport = async (id: string) => {
    try {
      setCurrentStep('loading');
      setLoadingQuote("Djoss récupère les kpakpatos partagés...");
      const res = await fetch(`/api/report/${id}`);
      if (!res.ok) throw new Error("Impossible de charger le rapport partagé.");
      const data = await res.json();
      setReport(data);
      setReportId(id);
      setSelectedModule(data.module);
      setSelectedTone(data.tone);
      
      if (data.isUnlocked) {
        setCurrentStep('report');
      } else {
        setCurrentStep('teaser');
      }
    } catch (err: any) {
      setAnalysisError(err.message || "Erreur lors du chargement du rapport.");
      setCurrentStep('landing');
    }
  };

  // Drag and Drop State
  const [isDragging, setIsDragging] = useState(false);
  const handleStartNewAnalysis = () => {
    const newSlug = Math.random().toString(36).substring(2, 8);
    setProjectSlug(newSlug);
    setReportId(newSlug);
    setPromptCReportData(null);
    setReport(null);
    setWizardStepIndex(1);
    setUploadedFile(null);
    setRawFileContent('');
    setConfirmedMeName('');
    setConfirmedPartnerName('');
    setParsedParticipants([]);
    setTotalMessages(0);
    setCurrentStep('wizard');
    window.history.pushState(null, '', `#/r/${newSlug}/step-1`);
  };

  // Witty Loading Messages Interval
  useEffect(() => {
    if (currentStep !== 'loading') return;
    
    const quotes = [
      "Djoss ouvre le dossier... 👀",
      "Attends, je compte tes fautes d'orthographe... 📝",
      "Hum, la dja ! C'est chaud ici ! 🥵",
      "Je vois des messages de 2h du matin sans réponse... 💀",
      "Je compare l'énergie de Awa et Moussa... ⚖️",
      "Analyse de la complicité en cours (mômes, vannes, esquives)... 🔥",
      "Calcul de l'indice de friendzone... Ça grimpe fort !",
      "Presque fini ! Djoss affûte ses punchlines..."
    ];
    let idx = 0;
    const interval = setInterval(() => {
      idx = (idx + 1) % quotes.length;
      setLoadingQuote(quotes[idx]);
    }, 3000);

    return () => clearInterval(interval);
  }, [currentStep]);

  // Handle WhatsApp Txt parsing
  const processFileContent = (content: string, fileName: string) => {
    try {
      // Basic structure validation
      if (!content || content.trim().length === 0) {
        alert("Le fichier est vide ! Importe un vrai export WhatsApp .txt.");
        return;
      }
      
      const lines = content.split('\n');
      const sampleCheck = lines.slice(0, 100).join('\n');
      
      // Much more relaxed validation
      const hasSender = /:\s*/.test(sampleCheck);
      if (!hasSender) {
        alert("Ce fichier ne ressemble pas à un historique WhatsApp valide. Assure-toi d'utiliser 'Exporter la discussion' sans médias.");
        return;
      }

      setRawFileContent(content);
      
      const participantCountMap: Record<string, number> = {};
      let totalLines = 0;
      
      // Robust regex for various dates/times formatting
      const messageRegex = /^(?:\[?(\d{1,4}[\/.\-]\d{1,2}[\/.\-]\d{1,4})(?:,\s+à\s+|,\s+at\s+|,\s+|\s+à\s+|\s+at\s+|\s+)(\d{1,2}[:.]\d{1,2}(?::\d{1,2})?)(?:\s*[APap][Mm])?\]?\s*(?:-\s*|:\s*)?\s*([^:]+?):\s*(.*))$/;
      
      // Ultimate fallback regex for any line starting with timestamp info followed by "Sender: Message"
      const fallbackRegex = /^\[?(?:\d{1,2}[\/.\-]\d{1,2}[\/.\-]\d{1,4}|\d{4}[\/.\-]\d{1,2}[\/.\-]\d{1,2}).*?\]?\s*(?:-\s*|:\s*)?\s*([^:]+?):\s*(.*)$/;
      
      lines.forEach(line => {
        // Remove LTR/RTL invisible markers common in iOS exports
        const cleanLine = line.replace(/[\u200e\u200f\u202a-\u202e\r]/g, '').trim();
        if (!cleanLine) return;

        let sender = '';
        let text = '';

        // Try standard formats:
        // Format 1 (Dash separated): e.g. "15/02/2024, 15:30 - Nom: Message"
        const dashMatch = cleanLine.match(/^(?:\[?\d{1,4}[\/.\-\s,:]+\d{1,2}[:.]\d{2}(?:[:.]\d{2})?(?:\s*[APap][Mm])?\]?)\s*-\s*([^:]+):\s*(.*)$/);
        
        // Format 2 (Bracket separated): e.g. "[15/02/2024, 15:30:00] Nom: Message"
        const bracketMatch = cleanLine.match(/^\[\d{1,4}[\/.\-\s,:]+\d{1,2}[:.]\d{2}(?:[:.]\d{2})?(?:\s*[APap][Mm])?\]\s*([^:]+):\s*(.*)$/);

        if (dashMatch) {
          sender = dashMatch[1].trim();
          text = dashMatch[2].trim();
        } else if (bracketMatch) {
          sender = bracketMatch[1].trim();
          text = bracketMatch[2].trim();
        } else {
          // Fallback: look specifically AFTER " - " or AFTER "]" for a colon
          const dashIndex = cleanLine.indexOf(' - ');
          if (dashIndex !== -1) {
            const afterDash = cleanLine.slice(dashIndex + 3);
            const colonIndex = afterDash.indexOf(': ');
            if (colonIndex !== -1) {
              sender = afterDash.slice(0, colonIndex).trim();
              text = afterDash.slice(colonIndex + 2).trim();
            }
          } else if (cleanLine.startsWith('[')) {
            const closeBracketIndex = cleanLine.indexOf('] ');
            if (closeBracketIndex !== -1) {
              const afterBracket = cleanLine.slice(closeBracketIndex + 2);
              const colonIndex = afterBracket.indexOf(': ');
              if (colonIndex !== -1) {
                sender = afterBracket.slice(0, colonIndex).trim();
                text = afterBracket.slice(colonIndex + 2).trim();
              }
            }
          }
        }

        if (sender) {
          const senderLower = sender.toLowerCase();
          const textLower = text.toLowerCase();
          
          const isNumeric = /^\d+$/.test(sender);
          const isTimeOrDate = /^\d{1,4}[\/.\-:]\d{1,4}/.test(sender);

          const isSystemSender = 
            senderLower.includes('whatsapp') ||
            senderLower.includes('système') ||
            senderLower.includes('system') ||
            senderLower.includes('chiffré') ||
            senderLower.includes('chiffre') ||
            senderLower.includes('ont ') ||
            senderLower.includes('a été') ||
            senderLower.includes('est ') ||
            senderLower.includes('changé') ||
            senderLower.includes('modifié') ||
            senderLower.includes('rejoint') ||
            senderLower.includes('quitté') ||
            senderLower.includes('ajouté') ||
            senderLower.includes('supprimé') ||
            senderLower.includes('bloqué') ||
            senderLower.includes('numéro') ||
            senderLower.includes('code');

          const isSystemText =
            textLower.includes('chiffrés') ||
            textLower.includes('chiffres') ||
            textLower.includes('a créé le groupe') ||
            textLower.includes('créé ce groupe') ||
            textLower.includes('a été ajouté') ||
            textLower.includes('vous a ajouté') ||
            textLower.includes('a quitté') ||
            textLower.includes('a rejoint') ||
            textLower.includes('supprimé') ||
            textLower.includes('ont changé') ||
            textLower.includes('a changé') ||
            textLower.includes('votre code de sécurité');

          // Exclude system messages, numeric artifacts, dates, and ensure sender name is realistic
          if (!isNumeric &&
              !isTimeOrDate &&
              !isSystemSender &&
              !isSystemText &&
              sender.length > 0 &&
              sender.length < 40 &&
              sender.split(/\s+/).length <= 5 &&
              !sender.includes('\n')) {
            participantCountMap[sender] = (participantCountMap[sender] || 0) + 1;
            totalLines++;
          }
        }
      });

      let rawParticipants: WhatsAppParticipant[] = Object.entries(participantCountMap).map(([name, count]) => ({
        name,
        messageCount: count,
        percentage: 0
      })).sort((a, b) => b.messageCount - a.messageCount);

      if (rawParticipants.length === 0) {
        alert("Aucun participant détecté. Assure-toi que ton fichier contient bien des messages au format 'Nom: Message'.");
        return;
      }

      // If it's a 1-on-1 module (couple, friendzone, flirt, crush, ex, etc.), keep strictly top 2 main participants
      if (!isGroupModule(selectedModule) && rawParticipants.length > 2) {
        rawParticipants = rawParticipants.slice(0, 2);
      }

      const activeTotal = rawParticipants.reduce((sum, p) => sum + p.messageCount, 0);
      const participantsList = rawParticipants.map(p => ({
        ...p,
        percentage: activeTotal > 0 ? Math.round((p.messageCount / activeTotal) * 100) : 0
      }));

      setParsedParticipants(participantsList);
      setTotalMessages(totalLines);
      triggerCountAnimation(totalLines);
      
      // Pre-populate names from top 2 active participants
      if (participantsList[0]) {
        setConfirmedMeName(participantsList[0].name);
      }
      if (participantsList[1]) {
        setConfirmedPartnerName(participantsList[1].name);
      } else if (participantsList[0]) {
        setConfirmedPartnerName("Mon Correspondant");
      }

      setCurrentStep('wizard');
    } catch (e) {
      alert("Erreur de lecture du fichier. Réessaye.");
    }
  };

  // Process the selected file (txt or zip)
  const processSelectedFile = async (file: File) => {
    try {
      setUploadedFile(file);
      const fileNameLower = file.name.toLowerCase();
      if (fileNameLower.endsWith('.zip') || file.type === 'application/zip' || file.type === 'application/x-zip-compressed') {
        const zip = new JSZip();
        const loadedZip = await zip.loadAsync(file);
        
        // Get all files that are not directories
        const files = Object.values(loadedZip.files).filter(f => !f.dir);
        
        // Filter out macOS metadata/hidden files
        const cleanFiles = files.filter(f => {
          const name = f.name.toLowerCase();
          const baseName = name.split('/').pop() || '';
          return !name.includes('__macosx') && !baseName.startsWith('._') && !baseName.startsWith('.');
        });

        // 1. Find all files ending with .txt (case-insensitive)
        const txtFiles = cleanFiles.filter(f => f.name.toLowerCase().endsWith('.txt'));
        
        let txtFile = null;
        if (txtFiles.length > 1) {
          // If there are multiple txt files, find the one with common WhatsApp export keywords
          const keywords = ['chat', 'whatsapp', 'discussion', 'convo', 'message', 'discuter', '_chat'];
          txtFile = txtFiles.find(f => {
            const name = f.name.toLowerCase();
            return keywords.some(kw => name.includes(kw));
          });
          // Fallback to the largest text file (since chat history is typically much larger than helper text files)
          if (!txtFile) {
            // In JSZip, the uncompressed size is stored in the file object (usually metadata)
            // if we don't have sizes, we just fall back to the first one
            txtFile = txtFiles[0];
          }
        } else if (txtFiles.length === 1) {
          txtFile = txtFiles[0];
        }

        // 2. Fallback to files with "chat" in the name
        if (!txtFile) {
          txtFile = cleanFiles.find(f => f.name.toLowerCase().includes('chat'));
        }

        // 3. Fallback to any file ending with .log or .data
        if (!txtFile) {
          txtFile = cleanFiles.find(f => {
            const name = f.name.toLowerCase();
            return name.endsWith('.log') || name.endsWith('.data');
          });
        }

        // 4. Fallback to the largest non-metadata file
        if (!txtFile && cleanFiles.length > 0) {
          txtFile = cleanFiles[0];
        }

        if (!txtFile) {
          alert("Aucun fichier valide (comme un export de discussion WhatsApp .txt) n'a été trouvé à l'intérieur du fichier .zip.");
          return;
        }

        const text = await txtFile.async('text');
        processFileContent(text, txtFile.name);
      } else if (fileNameLower.endsWith('.txt') || file.type === 'text/plain') {
        const reader = new FileReader();
        reader.onload = (event) => {
          if (event.target?.result) {
            processFileContent(event.target.result as string, file.name);
          }
        };
        reader.readAsText(file);
      } else {
        alert("S'il te plaît, importe un fichier d'export WhatsApp au format .txt ou .zip");
      }
    } catch (e: any) {
      console.error(e);
      alert("Erreur lors de l'extraction ou de la lecture du fichier ZIP : " + (e.message || e));
    }
  };

  // Handle File Upload Select
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processSelectedFile(file);
    }
  };

  // Drag & Drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processSelectedFile(file);
    }
  };

  // Trigger Gemini Analysis
  const runAnalysis = async () => {
    setAnalysisError(null);
    setIsAnalyzing(true);

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileContent: rawFileContent,
          module: selectedModule,
          tone: selectedTone,
          dialect: selectedDialect,
          context: relationContext,
          meName: confirmedMeName,
          partnerName: confirmedPartnerName
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "L'analyse a échoué.");
      }

      const data = await response.json();
      setReportId(data.reportId);
      setReport(data.teaser);
      if (data.promptCReport) {
        setPromptCReportData(data.promptCReport);
      }
      // On success, go to Step 7 (Names confirmation)
      setWizardStepIndex(7);
    } catch (err: any) {
      setAnalysisError(err.message || "Impossible de contacter Djoss. Vérifie ta connexion.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const updateNamesInPromptCReport = (newMeName: string, newPartnerName: string) => {
    if (!promptCReportData) return;
    const oldMeName = confirmedMeName || parsedParticipants[0]?.name || "";
    const oldPartnerName = confirmedPartnerName || parsedParticipants[1]?.name || "";

    const replaceStr = (str: string) => {
      if (!str) return str;
      let res = str;
      if (oldMeName && newMeName && oldMeName !== newMeName) {
        res = res.split(oldMeName).join(newMeName);
      }
      if (oldPartnerName && newPartnerName && oldPartnerName !== newPartnerName) {
        res = res.split(oldPartnerName).join(newPartnerName);
      }
      return res;
    };

    setPromptCReportData({
      ...promptCReportData,
      titre: replaceStr(promptCReportData.titre),
      sections: promptCReportData.sections?.map(sec => ({
        ...sec,
        blocs: sec.blocs?.map(bloc => ({
          ...bloc,
          auteur: bloc.auteur ? replaceStr(bloc.auteur) : bloc.auteur,
          contenu: replaceStr(bloc.contenu)
        }))
      }))
    });
  };

  const regeneratePromptCReport = async (overrideMeName?: string) => {
    if (!rawFileContent) return;
    setIsGeneratingPromptC(true);
    try {
      const res = await fetch('/api/generer-rapport', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversation: rawFileContent,
          module: selectedModule,
          ton: selectedTone,
          perspectiveUtilisateur: overrideMeName || confirmedMeName,
          totalMessages: totalMessages
        })
      });
      if (res.ok) {
        const data = await res.json();
        if (data && data.titre) {
          setPromptCReportData(data);
        }
      }
    } catch (e) {
      console.warn("Erreur ré-génération rapport Djoss:", e);
    } finally {
      setIsGeneratingPromptC(false);
    }
  };

  // Simulate Payment Flow
  const triggerPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneNumber) {
      alert("S'il te plaît, entre ton numéro de téléphone mobile money.");
      return;
    }

    setPaymentStep('initiating');
    setPaymentError(null);

    // Timeline simulation of push message
    setTimeout(() => {
      setPaymentStep('push_sent');
      setTimeout(() => {
        setPaymentStep('waiting_pin');
      }, 2000);
    }, 1500);
  };

  const confirmSimulatedPayment = async () => {
    setPaymentStep('initiating');
    try {
      const res = await fetch('/api/pay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reportId,
          phone: phoneNumber,
          provider: paymentProvider,
          offer: selectedOffer
        })
      });

      if (!res.ok) throw new Error("Paiement rejeté par l'opérateur.");

      const data = await res.json();
      setReport(data.report);
      setPaymentStep('success');

      // Refresh data
      setTimeout(() => {
        setCurrentStep('report');
        setPaymentStep('idle');
      }, 1500);

    } catch (err: any) {
      setPaymentError(err.message || "Erreur lors de la validation du paiement.");
      setPaymentStep('error');
    }
  };

  // Web Audio Demo snippet player (Landing page)
  const [demoPlaying, setDemoPlaying] = useState(false);
  const playDemoAudio = () => {
    if (demoPlaying) {
      window.speechSynthesis.cancel();
      setDemoPlaying(false);
      return;
    }

    setDemoPlaying(true);
    const introText = "Aah on dit quoi mon frère! C'est Djoss l'I A qui dit tout haut ce que les gens pensent tout bas. Tu as des doutes sur ta go ou ton djo? Importe ta convo WhatsApp maintenant et je vais chicoter la vérité cash sans filtre! On est ensemble!";
    const utterance = new SpeechSynthesisUtterance(introText);
    utterance.lang = 'fr-FR';
    utterance.rate = 0.95;
    utterance.pitch = 1.0;
    
    utterance.onend = () => {
      setDemoPlaying(false);
    };

    window.speechSynthesis.speak(utterance);
  };

  // Main Report Voice Speech Synthesis (TTS or Web Speech)
  const toggleAudioReport = async () => {
    if (isPlaying) {
      if (audioRef.current) {
        audioRef.current.pause();
      } else if (window.speechSynthesis) {
        window.speechSynthesis.pause();
      }
      setIsPlaying(false);
      return;
    }

    if (audioUrl) {
      if (audioRef.current) {
        audioRef.current.play();
        setIsPlaying(true);
      }
      return;
    }

    // Call TTS API generator
    setIsGeneratingAudio(true);
    setAudioError(null);

    try {
      const res = await fetch(`/api/generate-audio/${reportId}`);
      if (!res.ok) throw new Error("Échec de la génération audio.");
      const data = await res.json();

      if (data.audioBase64) {
        const audioBytes = atob(data.audioBase64);
        const arrayBuffer = new ArrayBuffer(audioBytes.length);
        const uint8Array = new Uint8Array(arrayBuffer);
        for (let i = 0; i < audioBytes.length; i++) {
          uint8Array[i] = audioBytes.charCodeAt(i);
        }
        const blob = new Blob([uint8Array], { type: 'audio/mp3' });
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);

        const audio = new Audio(url);
        audioRef.current = audio;

        audio.addEventListener('timeupdate', () => {
          setAudioProgress((audio.currentTime / audio.duration) * 100);
        });
        audio.addEventListener('loadedmetadata', () => {
          setAudioDuration(audio.duration);
        });
        audio.addEventListener('ended', () => {
          setIsPlaying(false);
          setAudioProgress(0);
        });

        audio.play();
        setIsPlaying(true);
      } else if (data.useWebSpeech) {
        // Fallback to beautiful responsive browser synth
        const script = data.script;
        const utterance = new SpeechSynthesisUtterance(script);
        utterance.lang = 'fr-FR';
        utterance.rate = 0.92;
        utterance.pitch = 1.05;
        
        synthUtteranceRef.current = utterance;
        
        utterance.onboundary = (e) => {
          setAudioProgress((e.charIndex / script.length) * 100);
        };
        
        utterance.onend = () => {
          setIsPlaying(false);
          setAudioProgress(0);
        };

        window.speechSynthesis.speak(utterance);
        setIsPlaying(true);
      }
    } catch (err: any) {
      setAudioError("Djoss a perdu sa voix pour l'instant. Essaye la lecture écrite !");
    } finally {
      setIsGeneratingAudio(false);
    }
  };

  useEffect(() => {
    return () => {
      if (audioRef.current) audioRef.current.pause();
      window.speechSynthesis.cancel();
    };
  }, []);

  // Trigger analysis automatically when entering step 6 (Processing Animation)
  useEffect(() => {
    if (wizardStepIndex === 6 && rawFileContent && !analysisTriggeredRef.current) {
      analysisTriggeredRef.current = true;
      runAnalysis();
    }
    // Reset the guard if user goes back before step 6
    if (wizardStepIndex < 6) {
      analysisTriggeredRef.current = false;
    }
  }, [wizardStepIndex, rawFileContent]);

  // Helper to copy links for viral loops
  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    setTimeout(() => setCopiedText(null), 2000);
  };

  // Share URL generation
  const getShareUrl = (audioOnly = false) => {
    const base = window.location.origin + window.location.pathname;
    return `${base}?sharedReportId=${reportId}${audioOnly ? '&audioOnly=true' : ''}`;
  };

  // Helper to choose character expressions dynamically based on state
  const getMascotExpression = () => {
    if (currentStep === 'payment') return 'thinking';
    if (currentStep === 'landing') return 'wise';
    if (currentStep === 'wizard') {
      if (wizardStepIndex === 1) return 'cool';
      if (wizardStepIndex === 2) return 'wise';
      if (wizardStepIndex === 3) return 'thinking';
      if (wizardStepIndex === 4) return selectedTone === 'hardcore' ? 'laughing' : 'wise';
      if (wizardStepIndex === 5) return 'wise';
      if (wizardStepIndex === 6) return 'thinking';
      if (wizardStepIndex === 7) return 'wise';
      if (wizardStepIndex === 8) return 'cool';
      if (wizardStepIndex === 9) return 'thinking';
    }
    if (report) {
      if (report.score > 8 && report.module === 'friendzone') return 'shocked';
      if (report.score < 4 && report.module === 'couple') return 'shocked';
      if (report.tone === 'hardcore') return 'laughing';
      return 'cool';
    }
    return 'wise';
  };

  // Helper to get a beautiful warm brand color for any participant name (anonymization)
  const getAvatarColorClass = (name: string) => {
    const colors = [
      'bg-[#C05D43]', // Terracotta
      'bg-[#C2594C]', // Rust
      'bg-[#AE4C3F]', // Soft red-brown
      'bg-[#7D4F3E]', // Warm cocoa
      'bg-[#B57C50]', // Camel/amber
      'bg-[#A65E4E]'  // Dusty rose
    ];
    if (!name) return colors[0];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % colors.length;
    return colors[index];
  };

  const handleNameConfirmationAndProceed = async () => {
    if (activeParticipantEditIndex === 0 && parsedParticipants.length > 1) {
      setActiveParticipantEditIndex(1);
    } else {
      if (reportId) {
        try {
          const res = await fetch(`/api/report/${reportId}/update-names`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              meName: confirmedMeName,
              partnerName: confirmedPartnerName
            })
          });
          if (res.ok) {
            const data = await res.json();
            if (data.report) {
              setReport(data.report);
            }
          }
        } catch (e) {
          console.error("Failed to sync updated names to server:", e);
        }
      }
      setWizardStepIndex(9);
    }
  };

  if (!isRestored && hasActiveSlugInUrl()) {
    return (
      <div className="min-h-screen bg-[#FAF8F5] flex flex-col items-center justify-center p-6 text-center animate-fade-in">
        <div className="relative mb-6">
          <div className="absolute inset-0 bg-rose-200/50 rounded-full blur-2xl animate-pulse -z-10 transform scale-125" />
          <img 
            src="https://ysbiedwkakdqadxtuwab.supabase.co/storage/v1/object/public/uploads/964a6cfd-c113-4aa3-a10e-6d261348cf97.png" 
            alt="Djoss Loading" 
            referrerPolicy="no-referrer"
            className="w-36 h-36 sm:w-44 sm:h-44 object-contain mx-auto animate-bounce duration-1000"
          />
        </div>

        <div className="space-y-3 max-w-xs mx-auto">
          <div className="flex items-center justify-center gap-2">
            <Loader2 className="w-5 h-5 text-[#BE123C] animate-spin" />
            <h3 className="font-serif font-black text-xl text-stone-900 tracking-tight">
              Chargement de l'analyse...
            </h3>
          </div>
          
          <p className="text-xs text-stone-500 font-medium leading-relaxed">
            Djoss récupère les kpakpatos du rapport. Un instant s'il te plaît...
          </p>

          <div className="w-48 h-1.5 bg-stone-200 rounded-full overflow-hidden mx-auto mt-4">
            <div className="w-full h-full bg-[#BE123C] rounded-full animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  if (currentStep === 'admin') {
    return (
      <AdminDashboard 
        onGoHome={() => { 
          setCurrentStep('landing'); 
          window.history.pushState(null, '', '/'); 
        }} 
        onOpenReport={(slug) => { 
          setProjectSlug(slug); 
          setReportId(slug); 
          setCurrentStep('report'); 
          window.history.pushState(null, '', `#/r/${slug}`); 
        }} 
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-[#1F1F1F] font-sans antialiased selection:bg-amber-100 selection:text-amber-900 pb-16">
      
      {/* Top Banner (Header) */}
      <header className="border-b border-stone-200/80 bg-white/70 backdrop-blur-md sticky top-0 z-40 px-4 py-3.5" id="app-header">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <button 
            onClick={() => {
              setIsSharedView(false);
              setCurrentStep('landing');
              window.history.pushState(null, '', `#/`);
            }}
            className="flex items-center gap-2.5 focus:outline-none group text-left cursor-pointer"
            id="logo-button"
          >
            <img 
              src="https://ysbiedwkakdqadxtuwab.supabase.co/storage/v1/object/public/uploads/1d53588e-51b8-44ea-a6ab-1edfdb54b306.png" 
              alt="Djoss Logo"
              referrerPolicy="no-referrer"
              className="w-10 h-10 object-cover rounded-full border-2 border-[#BE123C] shadow-sm group-hover:scale-105 transition-transform shrink-0"
              id="header-logo-img"
            />
            <div>
              <h1 className="font-serif font-black text-xl tracking-tight leading-none text-[#BE123C]">Djoss</h1>
            </div>
          </button>

          {currentStep !== 'landing' && (
            <button 
              onClick={handleStartNewAnalysis}
              className="text-xs font-bold text-stone-600 bg-stone-100 hover:bg-stone-200/80 px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
              id="back-home-button"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Nouvelle analyse
            </button>
          )}
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 mt-8" id="main-content">
        
        {/* Step Progression Bar */}
        {currentStep === 'wizard' && wizardStepIndex < 7 && !isSharedView && (
          <div className="mb-6 bg-stone-100 p-3 rounded-2xl border border-stone-200/40 text-xs text-stone-600 space-y-2" id="step-bar">
            <div className="flex justify-between items-center font-bold">
              <span>Étape {wizardStepIndex} sur 9</span>
              <span className="text-[#BE123C] uppercase tracking-wider">
                {wizardStepIndex === 1 && "Dialecte local"}
                {wizardStepIndex === 2 && "Combat"}
                {wizardStepIndex === 3 && "Histoire"}
                {wizardStepIndex === 4 && "Tempérament"}
                {wizardStepIndex === 5 && "Import du Chat"}
                {wizardStepIndex === 6 && "Analyse en cours"}
              </span>
            </div>
            <div className="w-full bg-stone-200 h-1.5 rounded-full overflow-hidden">
              <div 
                className="bg-[#BE123C] h-full transition-all duration-300" 
                style={{ width: `${(wizardStepIndex / 9) * 100}%` }}
              ></div>
            </div>
          </div>
        )}



        {/* ---------------------------------------------------- */}
        {/* SCREEN 1: LANDING */}
        {/* ---------------------------------------------------- */}
        {currentStep === 'landing' && (
          <div className="space-y-10 relative" id="screen-landing">
            
            {/* Subtle Radial purple background glow */}
            <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-[340px] md:w-[540px] h-[300px] bg-purple-200/35 rounded-full blur-3xl pointer-events-none -z-10" />

            {/* Premium Header/Title block inspired by reference design */}
            <div className="text-center space-y-6 pt-2">
              
              {/* Top Pill Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold bg-purple-50 text-purple-700 border border-purple-200/70 shadow-xs mx-auto" id="hero-badge">
                <span className="w-2 h-2 rounded-full bg-purple-600 animate-pulse"></span>
                <span className="uppercase tracking-widest font-bold text-[11px]">Ton Expert WhatsApp IA</span>
              </div>

              {/* Main Stacked Headline with High-Contrast Italic/Bold mix */}
              <div className="space-y-1 sm:space-y-2 max-w-2xl mx-auto">
                <h2 className="text-3xl sm:text-5xl md:text-6xl tracking-tight text-stone-950 font-sans leading-[1.12] text-center font-black">
                  <div className="flex items-center justify-center gap-2 sm:gap-3 flex-nowrap">
                    <span className="font-serif italic font-normal text-stone-900">Analyse</span>
                    <span className="font-extrabold text-stone-950 whitespace-nowrap">ton chat.</span>
                  </div>
                  <div className="flex items-center justify-center gap-2 sm:gap-3 flex-nowrap">
                    <span className="font-serif italic font-normal text-stone-900">Décode</span>
                    <span className="font-extrabold text-stone-950 whitespace-nowrap">tes non-dits.</span>
                  </div>
                  <div className="flex items-center justify-center gap-2 sm:gap-3 flex-nowrap">
                    <span className="font-serif italic font-normal text-[#BE123C]">Révèle</span>
                    <span className="font-extrabold text-stone-950 whitespace-nowrap">la vérité.</span>
                  </div>
                </h2>
              </div>

              {/* Sub-headline */}
              <p className="text-stone-600 text-sm md:text-base max-w-lg mx-auto leading-relaxed font-normal">
                Djoss décortique tes conversations WhatsApp. Révélations cash sans filtre, analyse des sous-entendus et rapport audio sur-mesure. <strong className="text-stone-900">Démarre gratuitement en 1 clic.</strong>
              </p>

              {/* CTA Row with Glowing Button */}
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
                <div className="relative group w-full sm:w-auto">
                  {/* Subtle dark aura glow */}
                  <div className="absolute -inset-1 bg-gradient-to-r from-stone-800 to-black rounded-full blur-md opacity-35 group-hover:opacity-75 transition duration-300 pointer-events-none"></div>
                  
                  <button
                    onClick={handleStartNewAnalysis}
                    className="relative w-full sm:w-auto bg-black hover:bg-stone-900 text-white py-4 px-8 rounded-full font-bold flex items-center justify-center gap-2.5 shadow-xl text-base transition-all duration-200 cursor-pointer"
                    id="cta-start-btn"
                  >
                    <span>Démarrer gratuitement</span>
                    <ArrowRight className="w-5 h-5 text-stone-300 group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              </div>

              {/* Option to revisit previous report if exists */}
              {(() => {
                try {
                  const lastSlug = localStorage.getItem('djoss_last_project_slug');
                  if (lastSlug) {
                    return (
                      <div className="pt-2 flex justify-center">
                        <button
                          onClick={() => {
                            window.location.hash = `#/r/${lastSlug}`;
                            window.location.reload();
                          }}
                          className="text-xs font-bold text-stone-700 bg-stone-100 hover:bg-stone-200/80 border border-stone-200/80 px-4 py-2 rounded-full transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
                        >
                          <span>📂 Retrouver mon dernier rapport</span>
                        </button>
                      </div>
                    );
                  }
                } catch (e) {}
                return null;
              })()}

              {/* Footer sub-note */}
              <p className="text-[11px] font-semibold text-stone-400 tracking-wide pt-1">
                Export WhatsApp .txt · 100% Anonyme & Sécurisé · Zéro Inscription
              </p>
            </div>

            {/* Interactive Mascot Studio Card */}
            <div className="bg-white border border-stone-200/80 rounded-3xl p-5 md:p-6 shadow-md relative overflow-hidden" id="interactive-djoss-card">
              <div className="absolute top-0 right-0 w-24 h-24 bg-[#BE123C]/5 rounded-bl-full pointer-events-none"></div>
              
              {/* Speech Bubble + Mascot */}
              <div className="flex flex-col items-center space-y-4">
                {/* Speech Bubble */}
                <div className="w-full relative bg-[#FAF8F5] border border-stone-200/60 px-4 py-3 rounded-2xl shadow-sm text-center">
                  <p className="text-stone-800 text-xs md:text-sm font-semibold italic leading-relaxed">
                    {demoPlaying 
                      ? "« Aah on dit quoi mon frère ! Écoute un peu comment je vais chicoter ta conversation ! 🔥 »" 
                      : heroMood === 'cool' 
                      ? "« T'inquiète pas, djo ! Ici on dit la vérité cash mais avec le style d'Abidjan ! 😎 »" 
                      : heroMood === 'laughing' 
                      ? "« Si tu savais ce qui se cache dans vos messages de 3h du matin... Haha ! 🤣 »" 
                      : heroMood === 'thinking' 
                      ? "« Hum, laisse-moi creuser un peu ton dossier... Ça sent la dja ou la friendzone ! 🤔 »" 
                      : heroMood === 'shocked' 
                      ? "« Attends ! Tu as vraiment répondu ça à ton crush ? C'est grave ! 😮 »" 
                      : "« Moi, je lis tes messages pour te dire s'il y a drap ou si c'est doux ! 🦁 »"}
                  </p>
                  {/* Little speech bubble pin */}
                  <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-[#FAF8F5] border-r border-b border-stone-200/60 rotate-45"></div>
                </div>

                {/* Avatar Display */}
                <div className="relative cursor-pointer group" onClick={() => {
                  // Cycle moods on click
                  const moods: ('wise' | 'cool' | 'laughing' | 'thinking' | 'shocked')[] = ['wise', 'cool', 'laughing', 'thinking', 'shocked'];
                  const nextIdx = (moods.indexOf(heroMood) + 1) % moods.length;
                  setHeroMood(moods[nextIdx]);
                }}>
                  <MascotAvatar expression={demoPlaying ? 'laughing' : heroMood} size={110} />
                  <div className="absolute -bottom-1 right-2 bg-stone-900 text-white rounded-full p-1.5 shadow-md scale-90 group-hover:scale-100 transition-transform">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  </div>
                </div>

                {/* Interactive Mood Selector chips */}
                <div className="w-full">
                  <p className="text-[10px] text-stone-500 font-bold text-center uppercase tracking-wider mb-2.5">
                    Change l'humeur de Djoss :
                  </p>
                  <div className="flex flex-wrap justify-center gap-1.5">
                    {[
                      { id: 'wise', label: '🦁 Sage' },
                      { id: 'cool', label: '😎 Cool' },
                      { id: 'laughing', label: '🤣 Choc' },
                      { id: 'thinking', label: '🤔 Pensif' },
                      { id: 'shocked', label: '😮 Choqué' }
                    ].map((m) => (
                      <button
                        key={m.id}
                        onClick={() => setHeroMood(m.id as any)}
                        className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                          heroMood === m.id && !demoPlaying
                            ? 'bg-[#BE123C] text-white shadow-sm'
                            : 'bg-stone-100 text-stone-700 hover:bg-stone-200/80'
                        }`}
                      >
                        {m.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

            </div>

            {/* CALL TO ACTION BUTTON */}
            <motion.button 
              onClick={handleStartNewAnalysis}
              animate={{ 
                scale: [1, 1.02, 1],
              }}
              transition={{ 
                duration: 2, 
                repeat: Infinity, 
                ease: "easeInOut" 
              }}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.98 }}
              className="w-full bg-black hover:bg-stone-900 text-white py-4 px-6 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg text-base cursor-pointer"
              id="cta-start-btn"
            >
              Faire analyser ma convo <ArrowRight className="w-5 h-5" />
            </motion.button>

            {/* Quick value props / Trust block */}
            <div className="grid grid-cols-2 gap-4 text-center">
              <div className="bg-white p-3.5 rounded-2xl border border-stone-200/80">
                <span className="text-lg">🔒</span>
                <h5 className="font-bold text-xs text-stone-700 uppercase tracking-wide mt-1">100% Privé</h5>
                <p className="text-[10px] text-stone-500 mt-0.5">Tes messages sont lus par l'IA et oubliés direct.</p>
              </div>
              <div className="bg-white p-3.5 rounded-2xl border border-stone-200/80">
                <span className="text-lg">⚡</span>
                <h5 className="font-bold text-xs text-stone-700 uppercase tracking-wide mt-1">Zéro Inscription</h5>
                <p className="text-[10px] text-stone-500 mt-0.5">Pas de compte requis, tu reçois ton lien direct.</p>
              </div>
            </div>

            {/* NEW SECTION: THREE WAYS TO BE READ (inspired by Brandon) */}
            <div className="space-y-4 pt-4 border-t border-stone-200/60">
              <h3 className="font-serif font-black text-xl text-stone-900 text-center">
                Trois façons de te faire lire
              </h3>
              <div className="space-y-3">
                {/* Classic Report Card */}
                <div className="bg-white p-4 rounded-2xl border border-stone-200/80 flex gap-4 items-start hover:border-stone-300 transition-all">
                  <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center flex-shrink-0 text-amber-600 font-bold flex items-center justify-center">
                    1
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-black text-stone-900 text-sm">Classic Report</h4>
                    <p className="text-xs text-stone-600 leading-relaxed">
                      Drôle, vif, et celui par lequel tout le monde commence. Djoss lit une conversation et dit ce que tout le monde pense.
                    </p>
                  </div>
                </div>

                {/* Deep Report Card */}
                <div className="bg-white p-4 rounded-2xl border border-stone-200/80 flex gap-4 items-start hover:border-stone-300 transition-all">
                  <div className="w-10 h-10 rounded-full bg-rose-50 flex items-center justify-center flex-shrink-0 text-rose-600 font-bold flex items-center justify-center">
                    2
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-black text-stone-900 text-sm">Deep Report</h4>
                    <p className="text-xs text-stone-600 leading-relaxed">
                      Plus profond, plus calme, plus honnête. Djoss lit la conversation de près et nomme ce qui se passe dessous.
                    </p>
                  </div>
                </div>

                {/* The Mirror Card */}
                <div className="bg-white p-4 rounded-2xl border border-stone-200/80 flex gap-4 items-start hover:border-stone-300 transition-all">
                  <div className="w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center flex-shrink-0 text-purple-600 font-bold flex items-center justify-center">
                    3
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-black text-stone-900 text-sm">The Mirror</h4>
                    <p className="text-xs text-stone-600 leading-relaxed">
                      Pas sur une conversation. Sur toi. Envoie plusieurs conversations et vois les schémas que Djoss retrouve.
                    </p>
                  </div>
                </div>
              </div>

              {/* Secondary CTA to trigger try/essayer */}
              <button
                onClick={() => {
                  setCurrentStep('wizard');
                  setWizardStepIndex(1);
                }}
                className="w-full bg-stone-900 hover:bg-stone-800 text-white py-3 px-6 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all text-sm cursor-pointer"
              >
                Essayer <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            {/* NEW SECTION: FAQ (inspired by Brandon) */}
            <div className="space-y-4 pt-6 border-t border-stone-200/60" id="faq-section">
              <h3 className="font-serif font-black text-xl text-stone-900 text-center">
                FAQ
              </h3>
              <div className="space-y-2">
                {[
                  {
                    q: "C'est qui, Djoss ?",
                    a: "Djoss est ton conseiller IA au ton franc, vif et humoristique. Il analyse tes discussions pour décrypter les non-dits et t'offrir un diagnostic honnête et sans langue de bois."
                  },
                  {
                    q: "Ça marche sur quel genre de conversations ?",
                    a: "Que ce soit un crush mystérieux, ton partenaire en couple, ton meilleur pote (friendzone) ou ton groupe de discussion WhatsApp favori."
                  },
                  {
                    q: "Quelles applis sont prises en charge ?",
                    a: "Nous prenons en charge les fichiers d'exportation .txt de WhatsApp. C'est rapide, anonyme et facile à faire directement depuis l'application mobile."
                  },
                  {
                    q: "Ça prend combien de temps ?",
                    a: "L'analyse prend moins d'une minute ! Tu obtiendras instantanément tes résultats interactifs, ton verdict écrit et ton vocal personnalisé."
                  },
                  {
                    q: "C'est risqué de confier ma conversation privée ?",
                    a: "Pas du tout. Vos données sont lues uniquement par notre algorithme de manière totalement anonyme et sécurisée. Aucune conversation n'est stockée de manière persistante ou nominative."
                  },
                  {
                    q: "Comment partager mon rapport ?",
                    a: "Une fois le rapport généré, tu pourras copier un lien de partage unique ou faire écouter le rapport audio de Djoss à tes amis."
                  }
                ].map((faq, index) => {
                  const isOpen = activeFaqIndex === index;
                  return (
                    <div 
                      key={index} 
                      className="bg-white rounded-xl border border-stone-200 overflow-hidden transition-all"
                    >
                      <button
                        onClick={() => setActiveFaqIndex(isOpen ? null : index)}
                        className="w-full py-3.5 px-4 text-left font-bold text-xs text-stone-800 flex justify-between items-center hover:bg-stone-50 transition-all"
                      >
                        <span>{faq.q}</span>
                        <span className={`text-stone-400 font-serif text-lg transition-transform duration-200 ${isOpen ? 'rotate-45' : ''}`}>
                          ＋
                        </span>
                      </button>
                      {isOpen && (
                        <div className="px-4 pb-3.5 pt-1 border-t border-stone-100 text-xs text-stone-600 leading-relaxed">
                          {faq.a}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>


          </div>
        )}

        {/* ---------------------------------------------------- */}
        {/* THE 10-STEP WIZARD ENGINE */}
        {/* ---------------------------------------------------- */}
        {currentStep === 'wizard' && (
          <div className="space-y-6" id="wizard-screen">
            
            {/* STEP 1: LANGUAGE SELECTION */}
            {wizardStepIndex === 1 && (
              <div className="space-y-6" id="wizard-step-language">
                <div className="text-center">
                  <h3 className="font-serif font-black text-2xl text-stone-900">Choisis ta langue</h3>
                  <p className="text-xs text-stone-500 font-semibold mt-1">Djoss s'adaptera pour te répondre dans la langue de ton choix !</p>
                </div>

                <div className="grid grid-cols-1 gap-3">
                  <button 
                    onClick={() => setSelectedDialect('french')}
                    className={`p-4 rounded-2xl border-2 text-left transition-all ${
                      selectedDialect === 'french' 
                        ? 'border-[#BE123C] bg-red-50/10' 
                        : 'border-stone-200/80 bg-white hover:border-stone-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-black text-stone-900">🇫🇷 Français (French)</span>
                      {selectedDialect === 'french' && <Check className="w-4 h-4 text-[#BE123C]" />}
                    </div>
                    <p className="text-xs text-stone-600 mt-1">Analyse avec le ton authentique, chaleureux et plein de punchlines de Djoss.</p>
                  </button>

                  <button 
                    onClick={() => setSelectedDialect('english')}
                    className={`p-4 rounded-2xl border-2 text-left transition-all ${
                      selectedDialect === 'english' 
                        ? 'border-[#BE123C] bg-red-50/10' 
                        : 'border-stone-200/80 bg-white hover:border-stone-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-black text-stone-900">🇬🇧 English (Anglais)</span>
                      {selectedDialect === 'english' && <Check className="w-4 h-4 text-[#BE123C]" />}
                    </div>
                    <p className="text-xs text-stone-600 mt-1">Analysis with Djoss's characteristic warmth, wit, and humor in English.</p>
                  </button>
                </div>

                <div className="flex gap-4 pt-2">
                  <button 
                    onClick={() => setCurrentStep('landing')}
                    className="flex-1 bg-stone-100 hover:bg-stone-200 text-stone-700 py-3.5 rounded-2xl font-bold text-sm transition-all"
                  >
                    Retour à l'accueil
                  </button>
                  <button 
                    onClick={() => setWizardStepIndex(2)}
                    className="flex-1 bg-[#1F1F1F] hover:bg-[#333333] text-white py-3.5 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 shadow-sm transition-all"
                  >
                    Suivant <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 2: MODULE / COMBAT */}
            {wizardStepIndex === 2 && (
              <div className="space-y-6" id="wizard-step-module">
                {/* Header with ArrowLeft and Step Indicator */}
                <div className="flex justify-between items-center text-sm font-semibold text-stone-500">
                  <button 
                    onClick={() => setWizardStepIndex(1)}
                    className="flex items-center gap-1 hover:text-stone-950 transition-colors"
                  >
                    <ArrowLeft className="w-5 h-5 text-stone-600" />
                  </button>
                  <span className="text-sm font-semibold text-stone-500">2 sur 11</span>
                </div>

                <div className="space-y-1 mt-4 text-left">
                  <h3 className="font-serif font-black text-2xl text-stone-900 leading-tight">
                    Tu penses à quelle conversation ?
                  </h3>
                  <p className="text-sm text-stone-500 font-medium">
                    Djoss peut faire un excellent rapport à partir de n'importe quelle conversation.
                  </p>
                </div>

                <div className="space-y-3">
                  {/* Option 1: Friendzone ou pas Friendzone */}
                  <button 
                    onClick={() => setSelectedModule('friendzone')}
                    className={`w-full p-4 rounded-2xl border transition-all flex items-center gap-4 ${
                      selectedModule === 'friendzone' 
                        ? 'border-[#111111] bg-white shadow-sm ring-1 ring-stone-900' 
                        : 'border-stone-200/80 bg-white hover:border-stone-300'
                    }`}
                  >
                    <div className="w-12 h-12 bg-pink-100 rounded-2xl flex items-center justify-center text-xl shrink-0">
                      🎯
                    </div>
                    <div className="text-left">
                      <h4 className="font-bold text-stone-900 text-sm">Friendzone ou pas Friendzone</h4>
                      <p className="text-xs text-stone-500 font-medium mt-0.5">Djoss va analyser la discussion pour définir si tu es dans la friendzone ou pas et si tu as tes chances chez la go.</p>
                    </div>
                  </button>

                  {/* Option 2: Partenaire / crush / amis */}
                  <button 
                    onClick={() => setSelectedModule('couple')}
                    className={`w-full p-4 rounded-2xl border transition-all flex items-center gap-4 ${
                      selectedModule === 'couple' 
                        ? 'border-[#111111] bg-white shadow-sm ring-1 ring-stone-900' 
                        : 'border-stone-200/80 bg-white hover:border-stone-300'
                    }`}
                  >
                    <div className="w-12 h-12 bg-rose-100 rounded-2xl flex items-center justify-center text-xl shrink-0">
                      💌
                    </div>
                    <div className="text-left">
                      <h4 className="font-bold text-stone-900 text-sm">Partenaire / crush / amis</h4>
                      <p className="text-xs text-stone-500 font-medium mt-0.5">Djoss peut analyser tous ces types de discussions en duo (copain, copine, crush, ex, ami(e)...).</p>
                    </div>
                  </button>

                  {/* Option 3: Groupe de potes / famille / travail */}
                  <button 
                    onClick={() => setSelectedModule('group')}
                    className={`w-full p-4 rounded-2xl border transition-all flex items-center gap-4 ${
                      selectedModule === 'group' 
                        ? 'border-[#111111] bg-white shadow-sm ring-1 ring-stone-900' 
                        : 'border-stone-200/80 bg-white hover:border-stone-300'
                    }`}
                  >
                    <div className="w-12 h-12 bg-amber-100 rounded-2xl flex items-center justify-center text-xl shrink-0">
                      👥
                    </div>
                    <div className="text-left">
                      <h4 className="font-bold text-stone-900 text-sm">Groupe de potes / famille / travail</h4>
                      <p className="text-xs text-stone-500 font-medium mt-0.5">Djoss peut analyser tous ces types de groupes et s'adapter pour donner un rapport propre et pertinent.</p>
                    </div>
                  </button>
                </div>

                <div className="pt-4 text-left">
                  <button 
                    onClick={() => setWizardStepIndex(3)}
                    className="bg-[#111111] hover:bg-stone-850 text-white py-4 px-8 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 shadow-md transition-all active:scale-95 cursor-pointer"
                  >
                    Continuer <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3: RELATIONSHIP CONTEXT (OPTIONAL STORY) */}
            {wizardStepIndex === 3 && (
              <div className="space-y-6" id="wizard-step-context">
                <div className="text-center space-y-3">
                  <div className="flex justify-center">
                    <img 
                      src="https://ysbiedwkakdqadxtuwab.supabase.co/storage/v1/object/public/uploads/0bc4684d-8d4b-4583-984a-4a17512a1ad7.png" 
                      alt="Djoss l'Écouteur" 
                      referrerPolicy="no-referrer"
                      className="w-24 h-24 object-cover rounded-full border-2 border-stone-200 shadow-sm"
                      id="step3-djoss-img"
                    />
                  </div>
                  <h3 className="font-serif font-black text-2xl text-stone-900">Raconte l'histoire à Djoss</h3>
                  <p className="text-xs text-stone-500 font-semibold mt-1">Optionnel, mais ça rend l'analyse 100x plus précise !</p>
                </div>

                <div className="space-y-4">
                  <textarea 
                    value={relationContext}
                    onChange={(e) => setRelationContext(e.target.value)}
                    placeholder="Exemple : On se parle tous les jours depuis 3 mois, mais parfois elle met 12h à répondre à mes vocaux..."
                    className="w-full h-32 p-4 rounded-2xl border border-stone-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#BE123C] focus:border-transparent transition-all"
                  />

                  <div className="space-y-2">
                    <p className="text-xs font-black uppercase text-stone-400">Idées de contextes rapides à cliquer :</p>
                    <div className="grid grid-cols-1 gap-2">
                      <button 
                        type="button"
                        onClick={() => setRelationContext("On s'aime grave mais y'a trop de jalousie et de petites disputes à cause des réseaux.")}
                        className="p-2.5 bg-stone-50 hover:bg-stone-100 border border-stone-200/60 rounded-xl text-left text-xs text-stone-700 transition-all font-medium"
                      >
                        ⚡ "Trop de jalousie et de disputes sur les réseaux."
                      </button>
                      <button 
                        type="button"
                        onClick={() => setRelationContext("On s'est rencontrés au lycée, je kiffe grave mais j'ai peur de briser notre amitié.")}
                        className="p-2.5 bg-stone-50 hover:bg-stone-100 border border-stone-200/60 rounded-xl text-left text-xs text-stone-700 transition-all font-medium"
                      >
                        ❤️ "On est amis d'enfance, j'ai peur de lui avouer."
                      </button>
                      <button 
                        type="button"
                        onClick={() => setRelationContext("C'est notre groupe de potes, on s'envoie des mèmes et on organise des soirées mémorables.")}
                        className="p-2.5 bg-stone-50 hover:bg-stone-100 border border-stone-200/60 rounded-xl text-left text-xs text-stone-700 transition-all font-medium"
                      >
                        🍗 "Groupe de potes chaud, toujours prêts pour s'amuser !"
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex gap-4">
                  <button 
                    onClick={() => setWizardStepIndex(2)}
                    className="flex-1 bg-stone-100 hover:bg-stone-200 text-stone-700 py-3.5 rounded-2xl font-bold text-sm transition-all"
                  >
                    Retour
                  </button>
                  <button 
                    onClick={() => setWizardStepIndex(4)}
                    className="flex-1 bg-[#1F1F1F] hover:bg-[#333333] text-white py-3.5 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 shadow-sm transition-all"
                  >
                    Suivant <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 4: DJOSS'S TEMPERAMENT / TONE */}
            {wizardStepIndex === 4 && (
              <div className="space-y-6" id="wizard-step-tone">
                <div className="text-center">
                  <h3 className="font-serif font-black text-2xl text-stone-900">Choisis le tempérament de Djoss</h3>
                  <p className="text-xs text-stone-500 font-semibold mt-1">Comment veux-tu que je te dise la vérité ?</p>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  <button 
                    onClick={() => setSelectedTone('normal')}
                    className={`p-4 rounded-2xl border-2 text-left transition-all ${
                      selectedTone === 'normal' 
                        ? 'border-[#BE123C] bg-red-50/10' 
                        : 'border-stone-200/80 bg-white hover:border-stone-300'
                    }`}
                  >
                    <div className="flex gap-4 items-center">
                      <img 
                        src="https://ysbiedwkakdqadxtuwab.supabase.co/storage/v1/object/public/uploads/20a22dff-bdf7-4b9d-9625-e057e46a26ac.png" 
                        alt="Djoss Sage" 
                        referrerPolicy="no-referrer"
                        className="w-14 h-14 object-cover rounded-xl border border-stone-200 shrink-0"
                      />
                      <div>
                        <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-md text-[9px] font-black uppercase tracking-wider">Sâge & Protecteur</span>
                        <h4 className="font-black text-stone-900 mt-1">Mode Normal 😇</h4>
                        <p className="text-[11px] text-stone-600 leading-normal">Djoss te parle comme un grand frère bienveillant, honnête mais juste. Avec des bons conseils.</p>
                      </div>
                    </div>
                  </button>

                  <button 
                    onClick={() => setSelectedTone('hardcore')}
                    className={`p-4 rounded-2xl border-2 text-left transition-all ${
                      selectedTone === 'hardcore' 
                        ? 'border-[#BE123C] bg-red-50/10' 
                        : 'border-stone-200/80 bg-white hover:border-stone-300'
                    }`}
                  >
                    <div className="flex gap-4 items-center">
                      <img 
                        src="https://ysbiedwkakdqadxtuwab.supabase.co/storage/v1/object/public/uploads/f46fb7e9-66c3-4b78-a0e9-f18dc098ae6f.png" 
                        alt="Djoss Hardcore" 
                        referrerPolicy="no-referrer"
                        className="w-14 h-14 object-cover rounded-xl border border-[#BE123C]/30 shrink-0"
                      />
                      <div>
                        <span className="px-2 py-0.5 bg-red-100 text-[#BE123C] rounded-md text-[9px] font-black uppercase tracking-wider">Insolent & Nouchi / Camfranglais</span>
                        <h4 className="font-black text-stone-900 mt-1">Mode Hardcore 🔥</h4>
                        <p className="text-[11px] text-stone-600 leading-normal">Djoss te dit le gbê direct ! Punchlines insolentes, arrogance assumée et argot d'Abidjan & Douala (goumin, drap, kpakpato, mbom). Zéro pitié, il t'attache !</p>
                      </div>
                    </div>
                  </button>
                </div>

                <div className="flex gap-4">
                  <button 
                    onClick={() => setWizardStepIndex(3)}
                    className="flex-1 bg-stone-100 hover:bg-stone-200 text-stone-700 py-3.5 rounded-2xl font-bold text-sm transition-all"
                  >
                    Retour
                  </button>
                  <button 
                    onClick={() => setWizardStepIndex(5)}
                    className="flex-1 bg-[#1F1F1F] hover:bg-[#333333] text-white py-3.5 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 shadow-sm transition-all"
                  >
                    Suivant <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 5: FILE EXPORT & IMPORT */}
            {wizardStepIndex === 5 && (
              <div className="space-y-6 text-left" id="wizard-step-file">
                {/* Step navigation header */}
                <div className="flex justify-between items-center text-sm font-semibold text-stone-500">
                  <button 
                    onClick={() => setWizardStepIndex(4)}
                    className="flex items-center gap-1 hover:text-stone-950 transition-colors cursor-pointer"
                  >
                    <ArrowLeft className="w-5 h-5 text-stone-600" />
                  </button>
                  <span className="text-sm font-semibold text-stone-500">5 sur 11</span>
                </div>

                <div className="space-y-1 mt-2">
                  <h3 className="font-serif font-black text-2xl text-stone-900">Importe ta conversation</h3>
                </div>

                {/* Import Box */}
                {!uploadedFile || totalMessages === 0 ? (
                  /* EMPTY STATE (Screenshot 2) */
                  <div 
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => document.getElementById('whatsapp-file-picker')?.click()}
                    className={`relative border-2 border-dashed rounded-[28px] p-8 sm:p-10 text-center transition-all cursor-pointer flex flex-col items-center justify-center min-h-[320px] bg-white group ${
                      isDragging 
                        ? 'border-blue-500 bg-blue-50/40 scale-[1.01]' 
                        : 'border-stone-200/90 hover:border-stone-300'
                    }`}
                  >
                    {/* Document ZIP Icon */}
                    <div className="w-16 h-20 border-2 border-stone-400 rounded-2xl flex flex-col items-center justify-center relative bg-white shadow-xs mb-5 transition-transform group-hover:scale-105">
                      <div className="absolute top-0 right-0 w-4 h-4 bg-stone-100 rounded-bl-md border-b border-l border-stone-400" />
                      <ArrowDown className="w-5 h-5 text-stone-600 mb-1" />
                      <span className="text-[10px] font-black text-stone-600 tracking-wider">ZIP</span>
                    </div>

                    <h4 className="font-bold text-stone-900 text-lg">Clique ici</h4>
                    <p className="text-xs text-stone-400 font-medium mt-1">Ou glisse ton fichier ici</p>

                    <p className="absolute bottom-6 text-xs text-stone-400 font-medium">
                      Rien n'est conservé.{' '}
                      <button 
                        type="button" 
                        onClick={(e) => { e.stopPropagation(); setShowPrivacyModal(true); }} 
                        className="underline text-stone-600 hover:text-stone-900 font-semibold cursor-pointer"
                      >
                        En savoir plus
                      </button>
                    </p>

                    <input 
                      type="file" 
                      id="whatsapp-file-picker" 
                      accept=".txt,.zip" 
                      onChange={handleFileChange} 
                      className="hidden" 
                    />
                  </div>
                ) : (
                  /* LOADED & COUNTING STATE (Screenshot 1) */
                  <div 
                    onClick={() => document.getElementById('whatsapp-file-picker')?.click()}
                    className="relative border-2 border-blue-200/80 rounded-[28px] p-8 sm:p-10 text-center transition-all cursor-pointer flex flex-col items-center justify-between min-h-[320px] overflow-hidden bg-white shadow-xs group"
                  >
                    {/* Blue fill background animation */}
                    <div 
                      className="absolute inset-x-0 bottom-0 bg-[#e8f1ff] transition-all duration-300 ease-out"
                      style={{ height: `${fillProgress}%` }}
                    />

                    <div className="relative z-10 my-auto py-6 space-y-3">
                      {/* Count & Chat Bubble */}
                      <div className="flex items-center justify-center gap-2 text-stone-900">
                        <span className="font-black text-4xl sm:text-5xl tracking-tight font-sans">
                          {displayCount.toLocaleString()}
                        </span>
                        <MessageSquare className="w-8 h-8 text-stone-800 fill-stone-800/10 stroke-[2.5]" />
                      </div>

                      {/* Signal bar indicator */}
                      <div className="flex items-center justify-center gap-1.5 text-emerald-600 text-xs font-bold">
                        <SignalBars className="w-4 h-4 text-emerald-600" />
                        <span>
                          {displayCount > 5000 ? "Signal excellent" : displayCount > 1000 ? "Signal très fort" : "Signal bon"}
                        </span>
                      </div>

                      <p className="text-xs text-stone-500 font-medium pt-1 group-hover:text-stone-700 transition-colors">
                        Clique pour changer de conversation
                      </p>
                    </div>

                    {/* Bottom message */}
                    <div className="relative z-10 text-xs text-stone-500 font-medium pt-2 flex items-center justify-center gap-1">
                      <span>Plus de messages = meilleur signal</span>
                      <SignalBars className="w-3.5 h-3.5 text-stone-600 inline" />
                      <span>pour l'IA</span>
                    </div>

                    <input 
                      type="file" 
                      id="whatsapp-file-picker" 
                      accept=".txt,.zip" 
                      onChange={handleFileChange} 
                      className="hidden" 
                    />
                  </div>
                )}

                {/* Export instructions card */}
                <div className="bg-white p-4 rounded-2xl border border-stone-200/80 space-y-3">
                  <h4 className="text-xs font-black uppercase text-stone-700 tracking-wider flex items-center gap-1.5">
                    <Info className="w-4 h-4 text-amber-500" /> Comment exporter depuis WhatsApp ?
                  </h4>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="bg-stone-50 p-3 rounded-xl border border-stone-200/40">
                      <p className="font-bold text-[#BE123C]">📱 Android :</p>
                      <ol className="list-decimal pl-4 mt-1 space-y-1 text-stone-600 text-[11px]">
                        <li>Ouvre la conversation</li>
                        <li>Clique sur les 3 points</li>
                        <li>Plus &gt; <strong>Exporter discussion</strong></li>
                        <li>Choisis <strong>Sans Médias</strong></li>
                      </ol>
                    </div>
                    <div className="bg-stone-50 p-3 rounded-xl border border-stone-200/40">
                      <p className="font-bold text-[#BE123C]">🍏 iPhone :</p>
                      <ol className="list-decimal pl-4 mt-1 space-y-1 text-stone-600 text-[11px]">
                        <li>Ouvre la conversation</li>
                        <li>Clique sur le nom en haut</li>
                        <li>Fais défiler tout en bas</li>
                        <li><strong>Exporter la discussion</strong></li>
                        <li>Choisis <strong>Sans Médias</strong></li>
                      </ol>
                    </div>
                  </div>
                </div>

                {/* Action button below */}
                <div className="pt-2 text-left">
                  <button 
                    disabled={!uploadedFile || totalMessages === 0 || isCounting}
                    onClick={() => {
                      if (uploadedFile && totalMessages > 0) {
                        setWizardStepIndex(6);
                      }
                    }}
                    className={`px-8 py-3.5 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 shadow-sm transition-all ${
                      uploadedFile && totalMessages > 0 && !isCounting
                        ? 'bg-[#111111] hover:bg-stone-850 text-white cursor-pointer active:scale-95'
                        : 'bg-stone-400 text-white cursor-not-allowed opacity-80'
                    }`}
                  >
                    Continuer <ArrowRight className="w-4 h-4" />
                  </button>
                </div>

                {/* Privacy Modal */}
                {showPrivacyModal && (
                  <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-xl border border-stone-200">
                      <div className="flex items-center justify-between border-b pb-3 border-stone-100">
                        <h4 className="font-bold text-stone-900 text-sm flex items-center gap-2">
                          <ShieldCheck className="w-5 h-5 text-emerald-600" /> Confidentialité & Sécurité
                        </h4>
                        <button 
                          onClick={() => setShowPrivacyModal(false)}
                          className="text-stone-400 hover:text-stone-700 font-bold p-1 rounded-full cursor-pointer"
                        >
                          ✕
                        </button>
                      </div>

                      <div className="space-y-3 text-xs text-stone-600 leading-relaxed">
                        <div className="flex items-start gap-2.5">
                          <Lock className="w-4 h-4 text-stone-800 shrink-0 mt-0.5" />
                          <p><strong>Traitement 100% local :</strong> Ton fichier WhatsApp est lu et parsé directement dans ton navigateur sans aucun stockage sur serveur.</p>
                        </div>
                        <div className="flex items-start gap-2.5">
                          <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                          <p><strong>Anonymisation :</strong> Seuls les extraits anonymisés servant à générer ton analyse sont utilisés.</p>
                        </div>
                        <div className="flex items-start gap-2.5">
                          <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                          <p><strong>Aucune revente :</strong> Tes conversations ne sont ni conservées, ni vendues, ni partagées.</p>
                        </div>
                      </div>

                      <button 
                        onClick={() => setShowPrivacyModal(false)}
                        className="w-full bg-[#111111] text-white py-2.5 rounded-xl font-bold text-xs hover:bg-stone-800 transition-all cursor-pointer"
                      >
                        J'ai compris
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* STEP 6: PROCESSING ANIMATION */}
            {wizardStepIndex === 6 && (
              <div className="space-y-6 text-center py-10" id="wizard-step-processing">
                <div className="relative inline-flex items-center justify-center">
                  <div className="absolute inset-0 rounded-full border-4 border-dashed border-[#BE123C]/50 animate-spin" style={{ animationDuration: '6s' }}></div>
                  <img 
                    src="https://ysbiedwkakdqadxtuwab.supabase.co/storage/v1/object/public/uploads/c5090de2-1b0a-463b-9671-da70da1ab114.png" 
                    alt="Djoss l'Analyste" 
                    referrerPolicy="no-referrer"
                    className="w-24 h-24 object-cover rounded-full border-4 border-[#BE123C] shadow-lg relative z-10 animate-pulse"
                    id="step6-djoss-img"
                  />
                </div>
                
                <div className="space-y-2">
                  <h3 className="font-serif font-black text-2xl text-stone-900">Calcul du verdict en cours...</h3>
                  <p className="text-xs text-stone-500 font-bold uppercase tracking-wider">
                    {totalMessages > 0 ? `${totalMessages.toLocaleString()} lignes de chat chargées` : "Analyse du fichier .txt"}
                  </p>
                  
                  {analysisError ? (
                    <div className="bg-red-50 border border-red-200 p-4 rounded-xl text-left mt-4 text-xs space-y-2 text-red-900">
                      <p className="font-bold">Zut ! Quelque chose a calé :</p>
                      <p>{analysisError}</p>
                      <button 
                        onClick={() => runAnalysis()}
                        className="bg-[#BE123C] text-white px-3 py-1.5 rounded-lg font-bold hover:bg-[#9F0F30] transition-all"
                      >
                        Réessayer l'analyse
                      </button>
                    </div>
                  ) : (
                    <div className="max-w-xs mx-auto bg-stone-100 border border-stone-200 p-3 rounded-xl mt-4 text-left text-xs text-stone-600 font-medium space-y-1.5 animate-pulse">
                      <div className="flex justify-between">
                        <span>📂 Lecture du chat log...</span>
                        <span className="text-emerald-600 font-bold">OK</span>
                      </div>
                      <div className="flex justify-between">
                        <span>🕵️‍♂️ Extraction des expressions clés...</span>
                        <span className="text-emerald-600 font-bold">OK</span>
                      </div>
                      <div className="flex justify-between">
                        <span>📊 Calcul des temps de réponse moyens...</span>
                        <span className="text-amber-600 font-bold">En cours...</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* STEP 7: QUI PARLE LE PLUS */}
            {wizardStepIndex === 7 && (
              <WhoTalksMost 
                stats={
                  parsedParticipants.length > 0
                    ? parsedParticipants.map(p => ({ nom: p.name, nombreMessages: p.messageCount }))
                    : undefined
                }
                onContinue={() => {
                  setActiveParticipantEditIndex(0);
                  setWizardStepIndex(8);
                }}
                onBack={() => setWizardStepIndex(5)}
                stepIndexLabel="7 sur 9"
              />
            )}

            {/* STEP 8: NAME CONFIRMATION / ANONYMISATION */}
            {wizardStepIndex === 8 && (
              <ParticipantConfirmation 
                initialParticipants={
                  parsedParticipants.length > 0
                    ? parsedParticipants.map((p, idx) => ({
                        id: String(idx + 1),
                        nomDetecte: p.name,
                        couleur: idx === 0 ? "#3B82F6" : idx === 1 ? "#EC4899" : "#10B981"
                      }))
                    : undefined
                }
                onAllConfirmed={(confirmedNames) => {
                  const p1 = confirmedNames[0] || "";
                  const p2 = confirmedNames[1] || "";
                  if (p1) setConfirmedMeName(p1);
                  if (p2) setConfirmedPartnerName(p2);

                  if (selectedModule === 'friendzone') {
                    setWizardStepIndex(85);
                  } else {
                    if (promptCReportData && promptCReportData.titre) {
                      updateNamesInPromptCReport(p1, p2);
                    } else {
                      regeneratePromptCReport(p1);
                    }
                    setWizardStepIndex(9);
                  }
                }}
                onBack={() => setWizardStepIndex(7)}
                currentStepIndexLabel="8 sur 9"
              />
            )}

            {/* STEP 8.5: PERSPECTIVE SELECTION (FRIENDZONE MODULE) */}
            {wizardStepIndex === 85 && (
              <PerspectiveSelection 
                module={selectedModule}
                participants={
                  parsedParticipants.length > 0
                    ? parsedParticipants.map((p, idx) => ({
                        id: String(idx + 1),
                        nomDetecte: idx === 0 ? (confirmedMeName || p.name) : (confirmedPartnerName || p.name),
                        couleur: idx === 0 ? "#3B82F6" : "#EC4899"
                      }))
                    : undefined
                }
                onPerspectiveSelected={(selectedName) => {
                  const p1 = confirmedMeName || parsedParticipants[0]?.name || "";
                  const p2 = confirmedPartnerName || parsedParticipants[1]?.name || "";
                  const partnerName = selectedName === p1 ? p2 : p1;

                  setConfirmedMeName(selectedName);
                  if (partnerName) {
                    setConfirmedPartnerName(partnerName);
                  }
                  regeneratePromptCReport(selectedName);
                  setWizardStepIndex(9);
                }}
                onBack={() => setWizardStepIndex(8)}
              />
            )}

            {/* STEP 9: RAPPORT SUMMARY & WHAT TO EXPECT */}
            {wizardStepIndex === 9 && (
              <div className="space-y-6 text-left" id="wizard-step-summary-teaser">
                {/* Custom Minimalist Header */}
                <div className="flex justify-between items-center text-sm font-semibold text-stone-500">
                  <button 
                    onClick={() => {
                      if (selectedModule === 'friendzone') {
                        setWizardStepIndex(85);
                      } else {
                        setWizardStepIndex(8);
                      }
                    }}
                    className="flex items-center gap-1 hover:text-stone-950 transition-colors"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                  <span>9 sur 9</span>
                </div>

                <div className="space-y-1 mt-4">
                  <h3 className="font-serif font-black text-2xl text-stone-900 leading-tight">Rapport Classic</h3>
                </div>

                {/* Main Dynamic Card */}
                <div className="bg-white p-4 rounded-3xl border border-stone-200/80 shadow-sm flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-stone-50 border border-stone-200/60 flex items-center justify-center text-stone-400 shrink-0 shadow-inner">
                    <Image className="w-6 h-6 stroke-[1.5]" />
                  </div>
                  <div className="space-y-0.5">
                    <h4 className="font-bold text-stone-900 text-base leading-tight">
                      {isGroupModule(selectedModule) 
                        ? (parsedParticipants.length > 0 
                            ? parsedParticipants.slice(0, 3).map(p => p.name).join(', ') + (parsedParticipants.length > 3 ? '...' : '')
                            : `${confirmedMeName} & ses potes`)
                        : `${confirmedMeName} ❤️ & ${confirmedPartnerName}`}
                    </h4>
                    <p className="text-xs text-stone-400 font-semibold tracking-wide">
                      © What Djoss Thinks
                    </p>
                  </div>
                </div>

                {/* Section: Ce qui t'attend */}
                <div className="space-y-4 pt-2">
                  <h4 className="font-serif font-black text-xl text-stone-900 leading-tight">
                    Ce qui t'attend
                  </h4>

                  <div className="space-y-4">
                    {/* Item 1 */}
                    <div className="flex gap-3.5 items-start">
                      <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                        <Users className="w-5 h-5 stroke-[2]" />
                      </div>
                      <div className="space-y-0.5">
                        <h5 className="font-bold text-sm text-stone-850">
                          {isGroupModule(selectedModule) ? "Quel genre de groupe vous êtes" : "Quel genre de duo vous êtes"}
                        </h5>
                        <p className="text-xs text-stone-500 font-medium leading-relaxed">
                          Pas ce que vous croyez. Ce que Djoss voit de l'extérieur.
                        </p>
                      </div>
                    </div>

                    {/* Item 2 - Highlighted */}
                    <div className="flex gap-3.5 items-start p-2.5 -mx-2.5 rounded-2xl bg-stone-100/75 border border-stone-205/40">
                      <div className="w-10 h-10 rounded-xl bg-red-50 text-[#BE123C] flex items-center justify-center shrink-0">
                        <Sparkles className="w-5 h-5 stroke-[2]" />
                      </div>
                      <div className="space-y-0.5">
                        <h5 className="font-bold text-sm text-stone-850">
                          Une analyse sans filtre de chacun de vous
                        </h5>
                        <p className="text-xs text-stone-500 font-medium leading-relaxed">
                          Ce que Djoss admire, ce qui le questionne, ce qu'il ne peut pas ignorer.
                        </p>
                      </div>
                    </div>

                    {/* Item 3 */}
                    <div className="flex gap-3.5 items-start">
                      <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                        <Award className="w-5 h-5 stroke-[2]" />
                      </div>
                      <div className="space-y-0.5">
                        <h5 className="font-bold text-sm text-stone-850">
                          Red flags. Green flags.
                        </h5>
                        <p className="text-xs text-stone-500 font-medium leading-relaxed">
                          Ce qui fonctionne. Ce qui ne fonctionne pas.
                        </p>
                      </div>
                    </div>

                    {/* Item 4 */}
                    <div className="flex gap-3.5 items-start">
                      <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                        <Info className="w-5 h-5 stroke-[2]" />
                      </div>
                      <div className="space-y-0.5">
                        <h5 className="font-bold text-sm text-stone-850">
                          Ce que personne n'ose vous dire
                        </h5>
                        <p className="text-xs text-stone-500 font-medium leading-relaxed">
                          Ce que tout le monde voit chez vous, et que personne ne mentionne.
                        </p>
                      </div>
                    </div>

                    {/* Item 5 */}
                    <div className="flex gap-3.5 items-start">
                      <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center shrink-0">
                        <MessageSquare className="w-5 h-5 stroke-[2]" />
                      </div>
                      <div className="space-y-0.5">
                        <h5 className="font-bold text-sm text-stone-850">
                          Votre langage à vous
                        </h5>
                        <p className="text-xs text-stone-500 font-medium leading-relaxed">
                          Les surnoms, les blagues qui reviennent, les mots qui n'ont de sens que pour vous — décortiqués.
                        </p>
                      </div>
                    </div>

                    {/* Item 6 */}
                    <div className="flex gap-3.5 items-start">
                      <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                        <span className="text-lg">🎁</span>
                      </div>
                      <div className="space-y-0.5">
                        <h5 className="font-bold text-sm text-stone-850">
                          Et tout ce que {totalMessages > 0 ? totalMessages.toLocaleString() : '1 047'} messages racontent sur vous sans le dire
                        </h5>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Section: Des réactions d'anthologie */}
                <div className="space-y-3 pt-4">
                  <h4 className="font-serif font-black text-xl text-stone-900 leading-tight">
                    Des réactions d'anthologie
                  </h4>

                  <div className="flex overflow-x-auto gap-3 pb-3 -mx-4 px-4 scrollbar-none snap-x snap-mandatory">
                    {/* Card 1 */}
                    <div className="w-[160px] shrink-0 bg-emerald-50 border border-emerald-100/60 rounded-2xl p-3 flex flex-col justify-between text-left snap-start h-40">
                      <span className="text-[10px] font-black uppercase text-emerald-800 bg-emerald-100/50 px-2 py-0.5 rounded w-fit">
                        Groupe 👥
                      </span>
                      <p className="text-xs font-medium text-stone-700 italic">
                        "Tu as réagi à son invitation de mariage avec 🫡"
                      </p>
                      <span className="text-[10px] text-stone-400 font-semibold font-mono">
                        MÉMOIRE DU GROUPE
                      </span>
                    </div>

                    {/* Card 2 */}
                    <div className="w-[160px] shrink-0 bg-blue-600 text-white rounded-2xl p-3 flex flex-col justify-between text-left snap-start h-40 shadow-sm">
                      <span className="text-[10px] font-black uppercase bg-white/20 px-2 py-0.5 rounded w-fit text-white">
                        Vibe 🔥
                      </span>
                      <p className="text-xs font-bold leading-snug">
                        "Moussa répond en 4 secondes, toi en 4 heures."
                      </p>
                      <span className="text-[10px] text-white/70 font-semibold font-mono">
                        RAPPORT DE FORCE
                      </span>
                    </div>

                    {/* Card 3 */}
                    <div className="w-[160px] shrink-0 bg-amber-50 border border-amber-100 rounded-2xl p-3 flex flex-col justify-between text-left snap-start h-40">
                      <span className="text-[10px] font-black uppercase text-amber-800 bg-amber-100/50 px-2 py-0.5 rounded w-fit">
                        Alerte ⏰
                      </span>
                      <p className="text-xs font-medium text-stone-700 italic">
                        "3 messages d'amour à 3h du matin sans réponse."
                      </p>
                      <span className="text-[10px] text-stone-400 font-semibold font-mono">
                        LE DRAP TOTAL 💀
                      </span>
                    </div>

                    {/* Card 4 */}
                    <div className="w-[160px] shrink-0 bg-stone-900 text-white rounded-2xl p-3 flex flex-col justify-between text-left snap-start h-40">
                      <span className="text-[10px] font-black uppercase bg-white/25 px-2 py-0.5 rounded w-fit text-red-300">
                        SANS FILTRE ⚠️
                      </span>
                      <p className="text-xs font-medium leading-snug">
                        "Qui est-ce qui a vraiment le contrôle ici ?"
                      </p>
                      <span className="text-[10px] text-stone-400 font-semibold font-mono">
                        MANDATORY READING
                      </span>
                    </div>

                    {/* Card 5 */}
                    <div className="w-[160px] shrink-0 bg-purple-50 border border-purple-100 rounded-2xl p-3 flex flex-col justify-between text-left snap-start h-40">
                      <span className="text-[10px] font-black uppercase text-purple-800 bg-purple-100/50 px-2 py-0.5 rounded w-fit">
                        Langage 💬
                      </span>
                      <p className="text-xs font-medium text-stone-700 italic">
                        "Le mot 'chou' répété 142 fois ce mois-ci."
                      </p>
                      <span className="text-[10px] text-stone-400 font-semibold font-mono">
                        DÉCORTIQUÉ
                      </span>
                    </div>

                    {/* Card 6 */}
                    <div className="w-[160px] shrink-0 bg-rose-50 border border-rose-100 rounded-2xl p-3 flex flex-col justify-between text-left snap-start h-40">
                      <span className="text-[10px] font-black uppercase text-rose-800 bg-rose-100/50 px-2 py-0.5 rounded w-fit">
                        Verdict 💔
                      </span>
                      <p className="text-xs font-medium text-stone-700 italic">
                        "Tu as 98% de chance d'être son confident éternel."
                      </p>
                      <span className="text-[10px] text-stone-400 font-semibold font-mono">
                        FRIENDZONE INDEX
                      </span>
                    </div>
                  </div>

                  <p className="text-center text-[11px] text-stone-400 font-bold tracking-wide py-1">
                    ⚡️ +93 618 rapports générés cette semaine
                  </p>
                </div>

                {/* Bottom Navigation Buttons */}
                <div className="flex flex-col gap-3 pt-2">
                  <button 
                    disabled={isGeneratingPromptC}
                    onClick={() => setCurrentStep('report')}
                    className="w-full bg-[#1F1F1F] hover:bg-[#333333] text-white py-4 rounded-2xl font-black text-sm flex items-center justify-center gap-2 shadow-md transition-all active:scale-[0.98] disabled:opacity-60 cursor-pointer"
                  >
                    {isGeneratingPromptC ? (
                      <>Djoss prépare ton rapport... <RefreshCw className="w-4 h-4 animate-spin text-amber-400" /></>
                    ) : (
                      <>Recevoir le rapport <Sparkles className="w-4 h-4 text-amber-400 fill-amber-400" /></>
                    )}
                  </button>

                  <button 
                    onClick={() => {
                      setWizardStepIndex(8);
                    }}
                    className="w-full text-center py-2 text-xs font-bold text-stone-500 hover:text-stone-900 transition-colors cursor-pointer"
                  >
                    Retour à l'étape précédente
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ---------------------------------------------------- */}
        {/* SCREEN 8 & 9 & 10: FULL REPORT (UNLOCKED / TEASER) */}
        {/* ---------------------------------------------------- */}
        {currentStep === 'report' && (
          <div className="space-y-6" id="screen-full-report">
            {paymentSuccessMessage && (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 p-4 rounded-2xl flex items-center justify-between text-xs sm:text-sm font-bold shadow-sm animate-fade-in max-w-xl mx-auto">
                <span className="flex items-center gap-2">
                  <span>{paymentSuccessMessage}</span>
                </span>
                <button 
                  onClick={() => setPaymentSuccessMessage(null)}
                  className="p-1 hover:bg-emerald-100 rounded-lg text-emerald-700 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {isGeneratingPromptC ? (
              <div className="bg-white p-8 sm:p-12 rounded-3xl border border-stone-200/80 text-center space-y-4 shadow-sm my-8">
                <div className="w-12 h-12 border-4 border-[#BE123C] border-t-transparent rounded-full animate-spin mx-auto" />
                <h3 className="font-serif font-black text-xl text-stone-900">Djoss peaufine ton rapport...</h3>
                <p className="text-xs text-stone-500 font-medium">Rédaction des punchlines avec la perspective de {confirmedMeName || 'l\'utilisateur'}...</p>
              </div>
            ) : !promptCReportData ? (
              <div className="bg-white p-8 sm:p-12 rounded-3xl border border-stone-200/80 text-center space-y-5 shadow-sm my-8 max-w-lg mx-auto">
                <div className="w-14 h-14 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mx-auto text-2xl border border-amber-200/60 shadow-sm">
                  ⚡
                </div>
                <div className="space-y-2">
                  <h3 className="font-serif font-black text-xl text-stone-900">Service d'analyse indisponible</h3>
                  <p className="text-xs text-stone-600 leading-relaxed max-w-sm mx-auto font-medium">
                    Djoss n'a pas pu générer ton rapport sur mesure pour l'instant. Tes données sont entièrement confidentielles et sécurisées.
                  </p>
                </div>
                <div className="pt-2 flex flex-col sm:flex-row justify-center gap-3">
                  <button 
                    onClick={() => regeneratePromptCReport()} 
                    className="bg-[#1F1F1F] hover:bg-stone-800 text-white font-bold text-xs py-3.5 px-5 rounded-xl transition-all cursor-pointer shadow-sm flex items-center justify-center gap-2"
                  >
                    <RefreshCw className="w-3.5 h-3.5 text-amber-400" /> Réessayer la génération
                  </button>
                  <button 
                    onClick={() => {
                      setCurrentStep('landing');
                      window.history.pushState(null, '', '/');
                    }} 
                    className="bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-xs py-3.5 px-5 rounded-xl transition-all cursor-pointer"
                  >
                    Retour à l'accueil
                  </button>
                </div>
              </div>
            ) : (
              <ReportResultView 
                report={promptCReportData}
                onUnlockClick={() => setIsUnlockModalOpen(true)}
              />
            )}
          </div>
        )}

        {/* Unlock Modal */}
        <UnlockModal 
          isOpen={isUnlockModalOpen}
          onClose={() => setIsUnlockModalOpen(false)}
          slug={projectSlug}
          defaultName={confirmedMeName}
          onPayClick={async (optionChoisie) => {
            console.log("[Djoss] Déblocage du rapport pour l'option:", optionChoisie);
            setIsUnlockModalOpen(false);

            const updatedPromptC = promptCReportData ? { ...promptCReportData, isUnlocked: true } : null;
            const updatedReport = report ? { ...report, isUnlocked: true } : null;

            if (updatedPromptC) {
              setPromptCReportData(updatedPromptC);
            }
            if (updatedReport) {
              setReport(updatedReport);
            }

            setCurrentStep('report');

            // Force immediate sync to localStorage & backend DB
            await syncStateToDb({
              promptCReport: updatedPromptC,
              report: updatedReport,
              currentStep: 'report',
              force: true
            });
          }}
        />

      </main>

      {/* Trust & Policy Footer */}
      <footer className="mt-12 text-center text-stone-400 text-[10px] space-y-2.5 px-4" id="app-footer">
        <p>© 2026 Djoss Inc.</p>
        <p>
          Confidentialité garantie : Tes discussions WhatsApp ne sont jamais stockées sur nos serveurs à des fins marketing.
        </p>

      </footer>

    </div>
  );
}
