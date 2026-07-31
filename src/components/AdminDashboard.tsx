import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  Users, 
  Lock, 
  Unlock, 
  TrendingUp, 
  MessageSquare, 
  DollarSign, 
  Search, 
  Trash2, 
  ExternalLink, 
  RefreshCw, 
  ShieldCheck, 
  Layers, 
  Flame, 
  ArrowUpRight, 
  Download,
  Filter,
  CheckCircle2,
  XCircle,
  HelpCircle,
  FileText
} from 'lucide-react';
import { MascotAvatar } from './MascotAvatar';

interface FunnelStep {
  step: number;
  name: string;
  reached: number;
  reachedPct: number;
  dropOff: number;
  dropOffPct: number;
}

interface AdminStats {
  totalProjects: number;
  totalReports: number;
  unlockedReports: number;
  unlockRate: number;
  totalMessagesAnalyzed: number;
  estimatedRevenueFCFA: number;
  moduleBreakdown: Record<string, number>;
  toneBreakdown: Record<string, number>;
  providerBreakdown: Record<string, number>;
  funnelStats?: FunnelStep[];
}

interface ProjectSummary {
  slug: string;
  meName: string;
  partnerName: string;
  module: string;
  tone: string;
  currentStep: string;
  totalMessages: number;
  isUnlocked: boolean;
  hasReport: boolean;
  updatedAt: string;
  score?: number;
  scoreLabel?: string;
}

interface ContactMessage {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  createdAt: string;
  isRead: boolean;
}

interface AdminDashboardProps {
  onGoHome: () => void;
  onOpenReport?: (slug: string) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onGoHome, onOpenReport }) => {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const [contactMessages, setContactMessages] = useState<ContactMessage[]>([]);
  const [activeTab, setActiveTab] = useState<'analytics' | 'messages'>('analytics');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [moduleFilter, setModuleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showAllProjects, setShowAllProjects] = useState<boolean>(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  // Simple PIN protection state
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem('djoss_admin_authed') === 'true';
  });
  const [pinInput, setPinInput] = useState<string>('');
  const [pinError, setPinError] = useState<boolean>(false);

  const fetchContactMessages = async () => {
    try {
      const res = await fetch('/api/admin/contact-messages');
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setContactMessages(data.messages || []);
        }
      }
    } catch (e) {
      console.warn("Erreur chargement messages de contact:", e);
    }
  };

  const handleToggleMessageRead = async (id: string, currentStatus: boolean) => {
    try {
      const res = await fetch(`/api/admin/contact-messages/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isRead: !currentStatus })
      });
      if (res.ok) {
        setContactMessages(prev => prev.map(m => m.id === id ? { ...m, isRead: !currentStatus } : m));
      }
    } catch (e) {
      alert("Erreur lors de la mise à jour du statut.");
    }
  };

  const handleDeleteMessage = async (id: string) => {
    if (!window.confirm("Voulez-vous vraiment supprimer ce message de contact ?")) return;
    try {
      const res = await fetch(`/api/admin/contact-messages/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setContactMessages(prev => prev.filter(m => m.id !== id));
        setActionMessage("Message supprimé.");
        setTimeout(() => setActionMessage(null), 3000);
      }
    } catch (e) {
      alert("Erreur lors de la suppression du message.");
    }
  };

  const fetchAdminData = async () => {
    setLoading(true);
    setError(null);
    try {
      await fetchContactMessages();
      const res = await fetch('/api/admin/stats');
      if (!res.ok) {
        let errorMsg = "Impossible de charger les statistiques admin.";
        try {
          const errData = await res.json();
          errorMsg = errData.error || errorMsg;
        } catch (_) {
          errorMsg = `Erreur serveur (${res.status}). Vérifie que les variables d'environnement sont configurées sur Vercel.`;
        }
        throw new Error(errorMsg);
      }
      let data: any;
      try {
        data = await res.json();
      } catch (_) {
        throw new Error("Réponse invalide du serveur (pas du JSON). Vérifie les logs Vercel.");
      }
      if (data.success) {
        setStats(data.stats);
        setProjects(data.projects || []);
      } else {
        throw new Error(data.error || "Erreur serveur.");
      }
    } catch (err: any) {
      setError(err.message || "Erreur de connexion au serveur.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchAdminData();
    }
  }, [isAuthenticated]);

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pinInput.trim() === 'Kalimdjoss@4k') {
      localStorage.setItem('djoss_admin_authed', 'true');
      setIsAuthenticated(true);
      setPinError(false);
    } else {
      setPinError(true);
    }
  };

  const handleToggleUnlock = async (slug: string, currentStatus: boolean) => {
    try {
      const newStatus = !currentStatus;
      const res = await fetch('/api/admin/toggle-unlock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug, isUnlocked: newStatus })
      });
      if (res.ok) {
        setProjects(prev => prev.map(p => p.slug === slug ? { ...p, isUnlocked: newStatus } : p));
        if (stats) {
          setStats({
            ...stats,
            unlockedReports: newStatus ? stats.unlockedReports + 1 : stats.unlockedReports - 1,
            estimatedRevenueFCFA: newStatus ? stats.estimatedRevenueFCFA + 1000 : stats.estimatedRevenueFCFA - 1000
          });
        }
        setActionMessage(`Statut du projet ${slug} mis à jour !`);
        setTimeout(() => setActionMessage(null), 3000);
      }
    } catch (err) {
      alert("Erreur lors de la modification du statut.");
    }
  };

  const handleDeleteProject = async (slug: string) => {
    if (!window.confirm(`Voulez-vous vraiment supprimer définitivement le projet ${slug} ?`)) return;
    try {
      const res = await fetch(`/api/admin/projects/${slug}`, { method: 'DELETE' });
      if (res.ok) {
        setProjects(prev => prev.filter(p => p.slug !== slug));
        setActionMessage(`Projet ${slug} supprimé.`);
        setTimeout(() => setActionMessage(null), 3000);
      }
    } catch (err) {
      alert("Erreur lors de la suppression.");
    }
  };

  const exportCSV = () => {
    if (!projects || !projects.length) return;
    const headers = ["Slug", "Expéditeur", "Partenaire", "Module", "Ton", "Messages", "Rapport Généré", "Débloqué", "Date"];
    const rows = projects.map(p => {
      let formattedDate = '-';
      try {
        if (p?.updatedAt) {
          const d = new Date(p.updatedAt);
          if (!isNaN(d.getTime())) formattedDate = d.toLocaleString('fr-FR');
        }
      } catch (e) {}

      return [
        p?.slug || 'sans-code',
        `"${p?.meName || 'Anonyme'}"`,
        `"${p?.partnerName || 'Anonyme'}"`,
        p?.module || 'friendzone',
        p?.tone || 'pic',
        p?.totalMessages || 0,
        p?.hasReport ? "Oui" : "Non",
        p?.isUnlocked ? "Oui" : "Non",
        formattedDate
      ];
    });

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `djoss_stats_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filter projects list safely
  const filteredProjects = (projects || []).filter(p => {
    if (!p) return false;
    const slug = String(p.slug || '');
    const meName = String(p.meName || '');
    const partnerName = String(p.partnerName || '');
    const query = (searchQuery || '').toLowerCase();

    const matchesQuery = 
      slug.toLowerCase().includes(query) ||
      meName.toLowerCase().includes(query) ||
      partnerName.toLowerCase().includes(query);
    
    const matchesModule = moduleFilter === 'all' || p.module === moduleFilter;
    const matchesStatus = 
      statusFilter === 'all' || 
      (statusFilter === 'unlocked' && p.isUnlocked) ||
      (statusFilter === 'generated_locked' && p.hasReport && !p.isUnlocked) ||
      (statusFilter === 'in_progress' && !p.hasReport) ||
      (statusFilter === 'locked' && !p.isUnlocked);

    return matchesQuery && matchesModule && matchesStatus;
  });

  const displayedProjects = showAllProjects 
    ? filteredProjects 
    : filteredProjects.slice(0, 10);

  const moduleLabels: Record<string, string> = {
    friendzone: 'Indice Friendzone',
    love: 'Analyse Amoureuse',
    bestfriend: 'Complicité Amicale',
    business: 'Partenariat Business',
    family: 'Dynamique Familiale'
  };

  const toneLabels: Record<string, string> = {
    soft: 'Soft & Mignon',
    pic: 'Piquant',
    hardcore: 'Hardcore / Brut',
    normal: 'Équilibré'
  };

  // Login Screen if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-stone-950 text-stone-100 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-stone-900 border border-stone-800 rounded-3xl p-8 shadow-2xl space-y-6">
          <div className="text-center space-y-3">
            <div className="inline-flex p-3 bg-stone-800/80 rounded-2xl border border-stone-700/60 mb-1">
              <ShieldCheck className="w-8 h-8 text-amber-400" />
            </div>
            <h1 className="text-2xl font-black tracking-tight text-white">Espace Admin Djoss</h1>
            <p className="text-xs text-stone-400">Entrez le code d'accès administrateur pour consulter le tableau de bord complet.</p>
          </div>

          <form onSubmit={handlePinSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-stone-400 uppercase tracking-wider mb-2">Code d'accès</label>
              <input 
                type="password"
                placeholder="Entrez le code..."
                value={pinInput}
                onChange={e => { setPinInput(e.target.value); setPinError(false); }}
                className="w-full bg-stone-950 border border-stone-800 rounded-2xl px-4 py-3.5 text-white font-mono placeholder:text-stone-600 focus:outline-none focus:border-amber-500 transition-all text-center text-lg tracking-widest"
                autoFocus
              />
              {pinError && (
                <p className="text-rose-400 text-xs mt-2 font-medium text-center">Code incorrect. Réessayez.</p>
              )}
            </div>

            <button
              type="submit"
              className="w-full bg-amber-500 hover:bg-amber-400 text-stone-950 font-extrabold py-3.5 rounded-2xl transition-all cursor-pointer shadow-lg shadow-amber-500/10 text-sm"
            >
              Accéder aux statistiques
            </button>
          </form>

          <div className="pt-2 text-center">
            <button 
              onClick={onGoHome}
              className="text-xs font-semibold text-stone-500 hover:text-stone-300 transition-colors cursor-pointer"
            >
              ← Retourner à l'application Djoss
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 font-sans pb-20">
      {/* Top Admin Bar */}
      <header className="sticky top-0 z-30 bg-stone-900/90 backdrop-blur-md border-b border-stone-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-stone-800/80 border border-stone-700/60 px-3 py-1.5 rounded-xl">
              <MascotAvatar expression="wise" size={24} />
              <span className="font-black text-sm tracking-wide bg-gradient-to-r from-amber-400 via-orange-300 to-amber-200 bg-clip-text text-transparent">
                DJOSS ADMIN
              </span>
            </div>
            <span className="text-xs text-stone-500 font-medium hidden sm:inline-block">
              Tableau de bord analytics
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchAdminData}
              className="p-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white transition-all cursor-pointer border border-stone-700/50"
              title="Rafraîchir les données"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>

            <button
              onClick={exportCSV}
              disabled={!projects.length}
              className="hidden sm:flex items-center gap-1.5 text-xs font-bold bg-stone-800 hover:bg-stone-700 border border-stone-700/60 text-stone-200 px-3.5 py-2 rounded-xl transition-all cursor-pointer disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5" /> Export CSV
            </button>

            <button
              onClick={onGoHome}
              className="text-xs font-bold bg-stone-100 text-stone-900 hover:bg-white px-3.5 py-2 rounded-xl transition-all cursor-pointer"
            >
              Quitter l'Admin
            </button>
          </div>
        </div>
      </header>

      {/* Action Notification Toast */}
      {actionMessage && (
        <div className="fixed top-20 right-6 z-50 bg-amber-500 text-stone-950 px-4 py-2.5 rounded-2xl font-bold text-xs shadow-xl flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>{actionMessage}</span>
        </div>
      )}

      <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-8 space-y-8">
        
        {/* Header Title */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Vue d'ensemble de la plateforme
            </h1>
            <p className="text-xs sm:text-sm text-stone-400 mt-1">
              Statistiques globales des analyses WhatsApp, déblocages et fréquences de consultation.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono bg-stone-900 border border-stone-800 px-3.5 py-2 rounded-2xl text-stone-400">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>BDD Connectée ({projects.length} projets stockés)</span>
          </div>
        </div>

        {/* Navigation Tabs (Analytics vs Contact Messages) */}
        <div className="flex items-center gap-2 border-b border-stone-800 pb-3">
          <button
            onClick={() => setActiveTab('analytics')}
            className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'analytics'
                ? 'bg-amber-500 text-stone-950 shadow-md font-black'
                : 'bg-stone-900 text-stone-400 hover:text-stone-200 border border-stone-800'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>Statistiques & Projets</span>
          </button>

          <button
            onClick={() => setActiveTab('messages')}
            className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer relative ${
              activeTab === 'messages'
                ? 'bg-amber-500 text-stone-950 shadow-md font-black'
                : 'bg-stone-900 text-stone-400 hover:text-stone-200 border border-stone-800'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span>Messages de Contact</span>
            {contactMessages.filter(m => !m.isRead).length > 0 && (
              <span className="bg-rose-500 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full animate-pulse">
                {contactMessages.filter(m => !m.isRead).length}
              </span>
            )}
          </button>
        </div>

        {/* Loading State */}
        {loading && !stats && (
          <div className="flex items-center justify-center py-24 text-stone-400 space-x-3">
            <RefreshCw className="w-6 h-6 animate-spin text-amber-400" />
            <span className="font-semibold text-sm">Chargement des données Djoss...</span>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-rose-950/40 border border-rose-800/60 rounded-3xl p-6 text-rose-300 flex items-center gap-4">
            <XCircle className="w-8 h-8 text-rose-400 flex-shrink-0" />
            <div>
              <h3 className="font-bold text-sm">Erreur de chargement</h3>
              <p className="text-xs text-rose-400 mt-0.5">{error}</p>
            </div>
          </div>
        )}

        {/* TAB 1: ANALYTICS & PROJECTS */}
        {activeTab === 'analytics' && stats && (
          <div className="space-y-8 animate-fade-in">
            {/* KPI Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* KPI 1: Rapports Générés */}
            <div className="bg-stone-900 border border-stone-800/80 rounded-3xl p-5 space-y-3 relative overflow-hidden group hover:border-stone-700 transition-all">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-stone-400 uppercase tracking-wider">Rapports Générés</span>
                <div className="p-2.5 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  <FileText className="w-4 h-4" />
                </div>
              </div>
              <div>
                <div className="text-3xl font-black text-amber-400 font-mono">{stats.totalReports || 0}</div>
                <div className="text-xs text-stone-400 mt-1 flex items-center gap-1">
                  sur <span className="text-stone-200 font-bold">{stats.totalProjects || 0}</span> projets créés au total
                </div>
              </div>
            </div>

            {/* KPI 2: Chiffre d'Affaires Estimé */}
            <div className="bg-stone-900 border border-stone-800/80 rounded-3xl p-5 space-y-3 relative overflow-hidden group hover:border-stone-700 transition-all">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-stone-400 uppercase tracking-wider">Revenus Estimés</span>
                <div className="p-2.5 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <DollarSign className="w-4 h-4" />
                </div>
              </div>
              <div>
                <div className="text-3xl font-black text-emerald-400 font-mono">{(stats.estimatedRevenueFCFA || 0).toLocaleString('fr-FR')} FCFA</div>
                <div className="text-xs text-stone-400 mt-1 flex items-center gap-1">
                  <span className="text-emerald-400 font-bold">{stats.unlockedReports || 0}</span> déblocages payants ({stats.unlockRate || 0}%)
                </div>
              </div>
            </div>

            {/* KPI 3: Messages WhatsApp Analysés */}
            <div className="bg-stone-900 border border-stone-800/80 rounded-3xl p-5 space-y-3 relative overflow-hidden group hover:border-stone-700 transition-all">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-stone-400 uppercase tracking-wider">Messages Analysés</span>
                <div className="p-2.5 rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  <MessageSquare className="w-4 h-4" />
                </div>
              </div>
              <div>
                <div className="text-3xl font-black text-white font-mono">{(stats.totalMessagesAnalyzed || 0).toLocaleString('fr-FR')}</div>
                <div className="text-xs text-stone-400 mt-1">
                  Volume total scanné par Djoss
                </div>
              </div>
            </div>

            {/* KPI 4: Taux de Conversion Déblocage */}
            <div className="bg-stone-900 border border-stone-800/80 rounded-3xl p-5 space-y-3 relative overflow-hidden group hover:border-stone-700 transition-all">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-stone-400 uppercase tracking-wider">Taux de Conversion</span>
                <div className="p-2.5 rounded-2xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
                  <TrendingUp className="w-4 h-4" />
                </div>
              </div>
              <div>
                <div className="text-3xl font-black text-purple-300 font-mono">{stats.unlockRate || 0}%</div>
                <div className="text-xs text-stone-400 mt-1">
                  Rapports passés au déblocage payant
                </div>
              </div>
            </div>

          </div>

          {/* Visual Charts & Breakdown Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Breakdown by Module */}
            <div className="bg-stone-900 border border-stone-800/80 rounded-3xl p-6 space-y-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Layers className="w-5 h-5 text-amber-400" />
                  <h2 className="font-extrabold text-base text-white">Répartition par Module</h2>
                </div>
                <span className="text-xs text-stone-500 font-mono">Popularité</span>
              </div>

              <div className="space-y-3.5">
                {Object.entries(stats.moduleBreakdown || {}).map(([modKey, count]) => {
                  const numCount = Number(count) || 0;
                  const total = stats.totalProjects || 1;
                  const pct = total > 0 ? Math.round((numCount / total) * 100) : 0;
                  return (
                    <div key={modKey} className="space-y-1.5">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-bold text-stone-200">{moduleLabels[modKey] || modKey}</span>
                        <span className="font-mono text-stone-400">{numCount} ({pct}%)</span>
                      </div>
                      <div className="w-full h-2 bg-stone-950 rounded-full overflow-hidden border border-stone-800/60">
                        <div 
                          className="h-full bg-gradient-to-r from-amber-500 to-amber-300 rounded-full transition-all duration-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Breakdown by Tone */}
            <div className="bg-stone-900 border border-stone-800/80 rounded-3xl p-6 space-y-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Flame className="w-5 h-5 text-orange-400" />
                  <h2 className="font-extrabold text-base text-white">Répartition par Ton d'Insolence</h2>
                </div>
                <span className="text-xs text-stone-500 font-mono">Style préféré</span>
              </div>

              <div className="space-y-3.5">
                {Object.entries(stats.toneBreakdown || {}).map(([toneKey, count]) => {
                  const numCount = Number(count) || 0;
                  const total = stats.totalProjects || 1;
                  const pct = total > 0 ? Math.round((numCount / total) * 100) : 0;
                  return (
                    <div key={toneKey} className="space-y-1.5">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-bold text-stone-200">{toneLabels[toneKey] || toneKey}</span>
                        <span className="font-mono text-stone-400">{numCount} ({pct}%)</span>
                      </div>
                      <div className="w-full h-2 bg-stone-950 rounded-full overflow-hidden border border-stone-800/60">
                        <div 
                          className="h-full bg-gradient-to-r from-orange-500 to-rose-400 rounded-full transition-all duration-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>

          {/* Funnel & Drop-off Analysis */}
          {stats.funnelStats && stats.funnelStats.length > 0 && (
            <div className="bg-stone-900 border border-stone-800/80 rounded-3xl p-6 space-y-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <TrendingUp className="w-5 h-5 text-indigo-400" />
                  <h2 className="font-extrabold text-base text-white">Analyse de l'Entonnoir & Abandons par Étape</h2>
                </div>
                <span className="text-xs text-stone-500 font-mono">Suivi du parcours utilisateur</span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {stats.funnelStats.map((step, idx) => {
                  const isLast = step.step === 10;
                  return (
                    <div key={idx} className="bg-stone-950 p-4 rounded-2xl border border-stone-800/40 flex flex-col justify-between gap-3 hover:border-stone-800/80 transition-all">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="w-6 h-6 rounded-full bg-indigo-500/10 text-indigo-400 text-xs font-bold font-mono flex items-center justify-center border border-indigo-500/20 shrink-0">
                              {step.step}
                            </span>
                            <span className="font-bold text-xs text-stone-200 line-clamp-1">{step.name}</span>
                          </div>
                          <p className="text-[11px] text-stone-400">
                            Ayant atteint cette étape : <span className="font-mono text-stone-100 font-bold">{step.reached}</span> ({step.reachedPct}%)
                          </p>
                        </div>
                        {isLast ? (
                          <span className="bg-emerald-500/10 text-emerald-400 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-500/20">
                            Succès
                          </span>
                        ) : (
                          <div className="text-right">
                            <span className="text-stone-500 text-[9px] uppercase tracking-wider block">Abandons</span>
                            <span className="font-mono font-bold text-rose-400 text-xs">{step.dropOff} ({step.dropOffPct}%)</span>
                          </div>
                        )}
                      </div>
                      
                      <div className="w-full h-1.5 bg-stone-900 rounded-full overflow-hidden border border-stone-800">
                        <div 
                          className={`h-full rounded-full transition-all duration-500 ${
                            isLast ? 'bg-gradient-to-r from-emerald-500 to-teal-400' : 'bg-gradient-to-r from-indigo-500 to-violet-400'
                          }`}
                          style={{ width: `${step.reachedPct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

        {/* Projects Data Table Header & Controls */}
        <div className="bg-stone-900 border border-stone-800/80 rounded-3xl p-6 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-black text-white flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-amber-400" />
                {showAllProjects 
                  ? `Tous les projets (${filteredProjects.length})` 
                  : `10 derniers projets (${displayedProjects.length} sur ${filteredProjects.length})`
                }
              </h2>
              <p className="text-xs text-stone-400 mt-0.5">
                Recherchez, filtrez et gérez les accès aux rapports d'analyse.
              </p>
            </div>

            {/* Filters Row */}
            <div className="flex flex-wrap items-center gap-2.5">
              {/* Search input */}
              <div className="relative min-w-[200px] flex-1 sm:flex-none">
                <Search className="w-4 h-4 text-stone-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input 
                  type="text"
                  placeholder="Rechercher par nom / slug..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full bg-stone-950 border border-stone-800 rounded-xl pl-9 pr-3 py-2 text-xs text-stone-200 placeholder:text-stone-600 focus:outline-none focus:border-amber-500 transition-all"
                />
              </div>

              {/* Module Filter */}
              <select
                value={moduleFilter}
                onChange={e => setModuleFilter(e.target.value)}
                className="bg-stone-950 border border-stone-800 text-stone-300 text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-amber-500 cursor-pointer"
              >
                <option value="all">Tous les modules</option>
                <option value="friendzone">Friendzone</option>
                <option value="love">Amour</option>
                <option value="bestfriend">Meilleur(e) ami(e)</option>
                <option value="business">Business</option>
                <option value="family">Famille</option>
              </select>

              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={e => {
                  setStatusFilter(e.target.value);
                  if (e.target.value !== 'all') {
                    setShowAllProjects(true);
                  }
                }}
                className="bg-stone-950 border border-stone-800 text-stone-300 text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-amber-500 cursor-pointer"
              >
                <option value="all">Tous les statuts</option>
                <option value="generated_locked">🔒 Générés (Verrouillés)</option>
                <option value="unlocked">✅ Rapports payés / Débloqués</option>
                <option value="in_progress">⏳ En cours d'analyse</option>
              </select>
            </div>
          </div>

          {/* Table Container */}
          <div className="overflow-x-auto rounded-2xl border border-stone-800/80 bg-stone-950">
            <table className="w-full text-left text-xs text-stone-300">
              <thead className="bg-stone-900/80 uppercase font-mono text-[10px] tracking-wider text-stone-400 border-b border-stone-800/80">
                <tr>
                  <th className="py-3.5 px-4">Projet / Code</th>
                  <th className="py-3.5 px-4">Participants</th>
                  <th className="py-3.5 px-4">Module & Ton</th>
                  <th className="py-3.5 px-4">Messages</th>
                  <th className="py-3.5 px-4">Statut</th>
                  <th className="py-3.5 px-4">Dernière MàJ</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-800/50">
                {displayedProjects.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-stone-500">
                      Aucun projet ne correspond à vos critères de recherche.
                    </td>
                  </tr>
                ) : (
                  displayedProjects.map((p) => (
                    <tr key={p.slug} className="hover:bg-stone-900/50 transition-colors">
                      {/* Slug / Code */}
                      <td className="py-3.5 px-4 font-mono font-bold text-amber-400">
                        {p.slug}
                      </td>

                      {/* Participants */}
                      <td className="py-3.5 px-4 font-semibold text-stone-200">
                        <span>{p.meName}</span>
                        <span className="text-stone-500 mx-1.5">&</span>
                        <span>{p.partnerName}</span>
                      </td>

                      {/* Module & Ton */}
                      <td className="py-3.5 px-4">
                        <div className="flex flex-col gap-0.5">
                          <span className="font-bold text-stone-300">{moduleLabels[p.module] || p.module}</span>
                          <span className="text-[10px] text-stone-500 capitalize">{toneLabels[p.tone] || p.tone}</span>
                        </div>
                      </td>

                      {/* Messages count */}
                      <td className="py-3.5 px-4 font-mono text-stone-400">
                        {p.totalMessages ? `${p.totalMessages} msgs` : '-'}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        {p.isUnlocked ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            <Unlock className="w-3 h-3" /> Payé / Débloqué
                          </span>
                        ) : p.hasReport ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                            <Lock className="w-3 h-3" /> Généré (Verrouillé)
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full bg-stone-900 text-stone-600 border border-stone-800">
                            En cours
                          </span>
                        )}
                      </td>

                      {/* Updated date */}
                      <td className="py-3.5 px-4 text-stone-500 font-mono text-[11px]">
                        {(() => {
                          if (!p?.updatedAt) return '-';
                          try {
                            const d = new Date(p.updatedAt);
                            if (isNaN(d.getTime())) return '-';
                            return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
                          } catch (e) {
                            return '-';
                          }
                        })()}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {/* Open Report */}
                          <button
                            onClick={() => {
                              if (onOpenReport) {
                                onOpenReport(p.slug);
                              } else {
                                window.open(`/#/r/${p.slug}`, '_blank');
                              }
                            }}
                            className="p-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white transition-all cursor-pointer"
                            title="Ouvrir le rapport"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </button>

                          {/* Toggle Unlock */}
                          <button
                            onClick={() => handleToggleUnlock(p.slug, p.isUnlocked)}
                            className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                              p.isUnlocked 
                                ? 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20' 
                                : 'bg-stone-800 hover:bg-stone-700 text-stone-400 hover:text-amber-400'
                            }`}
                            title={p.isUnlocked ? "Verrouiller ce rapport" : "Débloquer gratuitement pour test"}
                          >
                            {p.isUnlocked ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                          </button>

                          {/* Delete Project */}
                          <button
                            onClick={() => handleDeleteProject(p.slug)}
                            className="p-1.5 rounded-lg bg-stone-800 hover:bg-rose-950/60 text-stone-400 hover:text-rose-400 transition-all cursor-pointer"
                            title="Supprimer définitivement"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>

            {/* Pagination / Expand Toggle */}
            {filteredProjects.length > 10 && (
              <div className="p-3 text-center border-t border-stone-800/80 bg-stone-900/40">
                {!showAllProjects ? (
                  <button
                    onClick={() => setShowAllProjects(true)}
                    className="text-xs font-bold text-amber-400 hover:text-amber-300 transition-colors cursor-pointer inline-flex items-center gap-1.5 py-1.5 px-4 rounded-xl bg-amber-500/10 border border-amber-500/20"
                  >
                    <span>Afficher tous les {filteredProjects.length} projets</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <button
                    onClick={() => setShowAllProjects(false)}
                    className="text-xs font-semibold text-stone-400 hover:text-stone-200 transition-colors cursor-pointer py-1 px-3"
                  >
                    Réduire aux 10 derniers projets
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    )}

        {/* TAB 2: CONTACT MESSAGES INBOX */}
        {activeTab === 'messages' && (
          <div className="space-y-6 animate-fade-in">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-black text-white">Messages de Contact Reçus</h2>
                <p className="text-xs text-stone-400">
                  {contactMessages.length} message{contactMessages.length > 1 ? 's' : ''} au total ({contactMessages.filter(m => !m.isRead).length} non lu{contactMessages.filter(m => !m.isRead).length > 1 ? 's' : ''})
                </p>
              </div>

              <button
                onClick={fetchContactMessages}
                className="text-xs font-bold bg-stone-800 hover:bg-stone-700 text-stone-200 px-3.5 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 border border-stone-700/60"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                <span>Actualiser les messages</span>
              </button>
            </div>

            {contactMessages.length === 0 ? (
              <div className="bg-stone-900/60 border border-stone-800 rounded-3xl p-12 text-center text-stone-500 space-y-3">
                <MessageSquare className="w-10 h-10 mx-auto text-stone-600" />
                <p className="font-bold text-sm text-stone-400">Aucun message de contact pour le moment.</p>
                <p className="text-xs">Les messages soumis par les utilisateurs via le footer s'afficheront ici.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {contactMessages.map((msg) => (
                  <div 
                    key={msg.id}
                    className={`bg-stone-900 border rounded-3xl p-5 sm:p-6 transition-all space-y-3.5 ${
                      !msg.isRead ? 'border-amber-500/60 bg-stone-900/90 shadow-lg shadow-amber-500/5' : 'border-stone-800/80'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-800 pb-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2.5">
                          {!msg.isRead && (
                            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse shrink-0" title="Nouveau message non lu" />
                          )}
                          <h3 className="font-black text-base text-white">{msg.subject || 'Sans sujet'}</h3>
                          <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                            msg.isRead ? 'bg-stone-800 text-stone-400' : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          }`}>
                            {msg.isRead ? 'Lu' : 'Nouveau'}
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-3 text-xs text-stone-400">
                          <span className="font-bold text-stone-200">👤 {msg.name}</span>
                          <a href={`mailto:${msg.email}`} className="text-amber-400 hover:underline font-mono">
                            ✉️ {msg.email}
                          </a>
                        </div>
                      </div>

                      <span className="text-[11px] font-mono text-stone-500">
                        {new Date(msg.createdAt).toLocaleString('fr-FR')}
                      </span>
                    </div>

                    {/* Message Body */}
                    <div className="bg-stone-950 p-4 rounded-2xl border border-stone-800/80 text-stone-200 text-xs sm:text-sm font-sans leading-relaxed whitespace-pre-wrap">
                      {msg.message}
                    </div>

                    {/* Action Bar */}
                    <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                      <button
                        onClick={() => handleToggleMessageRead(msg.id, msg.isRead)}
                        className="text-xs font-bold text-stone-400 hover:text-white transition-colors cursor-pointer flex items-center gap-1.5"
                      >
                        <CheckCircle2 className={`w-4 h-4 ${msg.isRead ? 'text-emerald-400' : 'text-stone-500'}`} />
                        <span>{msg.isRead ? 'Marquer comme non lu' : 'Marquer comme lu'}</span>
                      </button>

                      <div className="flex items-center gap-3">
                        <a
                          href={`mailto:${msg.email}?subject=Re: ${encodeURIComponent(msg.subject || 'Votre message sur Djoss')}`}
                          className="text-xs font-bold bg-stone-800 hover:bg-stone-700 text-amber-300 px-3.5 py-2 rounded-xl border border-stone-700/60 transition-all flex items-center gap-1.5"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          <span>Répondre par email</span>
                        </a>

                        <button
                          onClick={() => handleDeleteMessage(msg.id)}
                          className="text-xs font-bold text-rose-400 hover:text-rose-300 transition-colors cursor-pointer flex items-center gap-1.5 py-1 px-2"
                          title="Supprimer le message"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Supprimer</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </main>
    </div>
  );
};
