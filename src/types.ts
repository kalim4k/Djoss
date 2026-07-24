export type ModuleType = 'friendzone' | 'couple' | 'group' | 'bestfriend' | 'family' | 'work' | 'other';
export type ToneMode = 'normal' | 'hardcore';

export interface WhatsAppParticipant {
  name: string;
  messageCount: number;
  percentage: number;
}

export interface ParseResult {
  isValid: boolean;
  error?: string;
  participants: WhatsAppParticipant[];
  messageCount: number;
  rawText: string;
}

export interface ProofMessage {
  sender: string;
  message: string;
  timestamp?: string;
}

export interface Insight {
  title: string;
  content: string;
  isTeaser: boolean; // True means visible in free version, False means blurred/hidden
  proofs?: ProofMessage[];
}

export interface ErrorAnalysis {
  text: string;
  correction: string;
}

export interface TimelineEvent {
  date: string;
  title: string;
  description: string;
  type: 'complicity' | 'crisis' | 'neutral';
}

export interface GroupMemberStat {
  name: string;
  messageCount: number;
  percentage: number;
  role: 'leader' | 'clown' | 'ghost' | 'drama' | 'inactive';
  roleLabel: string;
  description: string;
}

export interface AnalysisReport {
  id: string;
  module: ModuleType;
  tone: ToneMode;
  participants: string[];
  title?: string; // Catchy bold title like 'Le pigeon a mieux visé que toi, KALIM'
  verdict: string;
  score: number; // e.g. 8.5 out of 10
  scoreLabel: string; // e.g. "Score de Friendzone"
  summary: string; // Free brief overview
  insights: Insight[];
  errors: ErrorAnalysis[];
  timeline: TimelineEvent[];
  groupStats: GroupMemberStat[];
  advice: string;
  hasAudio: boolean; // Does this report support audio?
  isUnlocked: boolean; // Paywalled
  selectedOffer?: 'written' | 'pack';
  createdAt: string;
}

export interface PaymentDetails {
  phone: string;
  provider: 'tmoney' | 'flooz';
  amount: number;
  offer: 'written' | 'pack';
}

export type BlocType = 'texte' | 'citation';

export interface BlocTexte {
  type: 'texte';
  contenu: string;
}

export interface BlocCitation {
  type: 'citation';
  auteur: string;
  texte: string;
}

export type Bloc = BlocTexte | BlocCitation;

export interface ReportSection {
  id: string;
  titre_affiche: string;
  blocs: Bloc[];
}

export interface PositionCoupureTeaser {
  sectionId: string;
  blocIndex: number;
}

export interface PromptCReport {
  id?: string;
  titre: string;
  verdict?: string | null;
  moduleName?: string;
  sections: ReportSection[];
  position_coupure_teaser?: PositionCoupureTeaser;
  isUnlocked?: boolean;
  audioScript?: string;
  audioBase64?: string;
  photos?: string[];
}

