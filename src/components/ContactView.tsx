import React, { useState } from 'react';
import { ArrowLeft, Mail, Send, CheckCircle2, AlertCircle, Loader2, MessageSquare, User, Tag } from 'lucide-react';
import { MascotAvatar } from './MascotAvatar';

interface ContactViewProps {
  onBack: () => void;
}

export function ContactView({ onBack }: ContactViewProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !message.trim()) {
      setErrorMessage("Veuillez remplir tous les champs obligatoires (Nom, Email et Message).");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          subject: subject.trim() || 'Demande d\'information Djoss',
          message: message.trim()
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSuccessMessage("Votre message a été transmis avec succès à l'équipe Djoss ! Nous vous répondrons par email dans les plus brefs délais.");
        setName('');
        setEmail('');
        setSubject('');
        setMessage('');
      } else {
        setErrorMessage(data.error || "Une erreur est survenue lors de l'envoi de votre message. Veuillez réessayer.");
      }
    } catch (err) {
      setErrorMessage("Impossible de contacter le serveur. Vérifiez votre connexion internet.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6 text-stone-900 pb-16 animate-fade-in" id="contact-page">
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
          <span className="text-xs font-black uppercase tracking-wider text-stone-700">Contact Djoss</span>
        </div>
      </div>

      {/* Main Form Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-10 border border-stone-200/80 shadow-sm space-y-6 text-left">
        
        {/* Page Title */}
        <div className="space-y-2 border-b border-stone-100 pb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-xl bg-rose-100/80 text-[#BE123C] text-xs font-bold mb-1">
            <Mail className="w-4 h-4" />
            <span>Support & Assistance</span>
          </div>
          <h1 className="font-serif font-black text-2xl sm:text-3xl text-stone-900 leading-tight">
            Nous Contacter
          </h1>
          <p className="text-xs sm:text-sm text-stone-500 font-medium">
            Une question sur un rapport, un problème technique ou une suggestion ? Écrivez-nous !
          </p>
        </div>

        {/* Success Banner */}
        {successMessage ? (
          <div className="py-8 text-center space-y-4 animate-fade-in bg-stone-50 p-6 rounded-3xl border border-stone-200/60">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div className="space-y-2 max-w-md mx-auto">
              <h3 className="font-serif font-black text-2xl text-stone-900">Message Envoyé avec Succès !</h3>
              <p className="text-xs sm:text-sm text-stone-600 font-medium leading-relaxed">
                {successMessage}
              </p>
            </div>
            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                onClick={() => setSuccessMessage(null)}
                className="w-full sm:w-auto bg-stone-200 hover:bg-stone-300 text-stone-800 px-5 py-3 rounded-2xl font-bold text-xs transition-all cursor-pointer"
              >
                Envoyer un autre message
              </button>
              <button
                onClick={onBack}
                className="w-full sm:w-auto bg-[#111111] hover:bg-stone-850 text-white px-6 py-3 rounded-2xl font-bold text-xs shadow-md transition-all cursor-pointer"
              >
                Retourner à l'accueil
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5 text-left">
            {errorMessage && (
              <div className="bg-red-50 border border-red-200 p-4 rounded-2xl text-xs text-red-900 flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Name Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-stone-700 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-stone-400" />
                <span>Votre nom complet / pseudo *</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Moussa Koné"
                className="w-full px-4 py-3.5 rounded-2xl border border-stone-200 focus:border-[#BE123C] focus:ring-2 focus:ring-[#BE123C]/20 outline-none text-xs sm:text-sm transition-all bg-stone-50/50"
                required
              />
            </div>

            {/* Email Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-stone-700 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-stone-400" />
                <span>Votre adresse email *</span>
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Ex: moussa@example.com"
                className="w-full px-4 py-3.5 rounded-2xl border border-stone-200 focus:border-[#BE123C] focus:ring-2 focus:ring-[#BE123C]/20 outline-none text-xs sm:text-sm transition-all bg-stone-50/50"
                required
              />
            </div>

            {/* Subject Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-stone-700 flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-stone-400" />
                <span>Sujet de votre message</span>
              </label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Ex: Question paiement, suggestion d'amélioration..."
                className="w-full px-4 py-3.5 rounded-2xl border border-stone-200 focus:border-[#BE123C] focus:ring-2 focus:ring-[#BE123C]/20 outline-none text-xs sm:text-sm transition-all bg-stone-50/50"
              />
            </div>

            {/* Message Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-stone-700 flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-stone-400" />
                <span>Votre message détaillé *</span>
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Expliquez-nous votre demande..."
                rows={5}
                className="w-full px-4 py-3.5 rounded-2xl border border-stone-200 focus:border-[#BE123C] focus:ring-2 focus:ring-[#BE123C]/20 outline-none text-xs sm:text-sm transition-all bg-stone-50/50 resize-none"
                required
              />
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-[#BE123C] hover:bg-[#9F0E31] text-white py-4 px-6 rounded-2xl font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-rose-900/20 transition-all active:scale-[0.98] cursor-pointer disabled:opacity-50"
                id="btn-submit-contact-page"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Envoi en cours...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Envoyer le message à l'équipe</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
