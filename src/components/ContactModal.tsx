import React, { useState } from 'react';
import { X, Mail, Send, CheckCircle2, AlertCircle, Loader2, MessageSquare, User, Tag } from 'lucide-react';

interface ContactModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ContactModal({ isOpen, onClose }: ContactModalProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

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
        setSuccessMessage("Votre message a été transmis avec succès à l'équipe Djoss ! Nous vous répondrons dans les plus brefs délais.");
        setName('');
        setEmail('');
        setSubject('');
        setMessage('');
      } else {
        setErrorMessage(data.error || "Une erreur est survenue lors de l'envoi de votre message. Veuillez réespayer.");
      }
    } catch (err) {
      setErrorMessage("Impossible de contacter le serveur. Vérifiez votre connexion internet.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setSuccessMessage(null);
    setErrorMessage(null);
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/75 backdrop-blur-md animate-fade-in"
      onClick={onClose}
      id="contact-modal-backdrop"
    >
      <div 
        className="relative w-full max-w-lg bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-stone-200 text-stone-900 space-y-5 animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
        id="contact-modal-content"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-stone-100 pb-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-rose-50 text-[#BE123C] border border-rose-200/60 shadow-xs">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-serif font-black text-xl text-stone-900 leading-tight">
                Contacter l'équipe Djoss
              </h3>
              <p className="text-xs text-stone-500 font-medium">
                Une question, une suggestion ou une demande d'assistance ?
              </p>
            </div>
          </div>

          <button 
            onClick={onClose}
            className="p-2 rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors cursor-pointer"
            aria-label="Fermer"
            id="btn-close-contact-modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        {successMessage ? (
          <div className="py-6 text-center space-y-4 animate-fade-in">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div className="space-y-1.5 max-w-xs mx-auto">
              <h4 className="font-serif font-black text-xl text-stone-900">Message Envoyé !</h4>
              <p className="text-xs sm:text-sm text-stone-600 font-medium leading-relaxed">
                {successMessage}
              </p>
            </div>
            <div className="pt-2">
              <button
                onClick={() => {
                  handleReset();
                  onClose();
                }}
                className="bg-[#111111] hover:bg-stone-850 text-white px-6 py-3 rounded-2xl font-bold text-xs shadow-md transition-all cursor-pointer"
              >
                Fermer la fenêtre
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 text-left">
            {errorMessage && (
              <div className="bg-red-50 border border-red-200 p-3 rounded-2xl text-xs text-red-900 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Name Input */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-stone-700 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-stone-400" />
                <span>Votre prénom / nom *</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Moussa Koné"
                className="w-full px-4 py-3 rounded-2xl border border-stone-200 focus:border-[#BE123C] focus:ring-2 focus:ring-[#BE123C]/20 outline-none text-xs sm:text-sm transition-all bg-stone-50/50"
                required
              />
            </div>

            {/* Email Input */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-stone-700 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-stone-400" />
                <span>Votre adresse email *</span>
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Ex: moussa@example.com"
                className="w-full px-4 py-3 rounded-2xl border border-stone-200 focus:border-[#BE123C] focus:ring-2 focus:ring-[#BE123C]/20 outline-none text-xs sm:text-sm transition-all bg-stone-50/50"
                required
              />
            </div>

            {/* Subject Input */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-stone-700 flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-stone-400" />
                <span>Sujet de votre demande (optionnel)</span>
              </label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Ex: Question sur mon rapport, partenariat..."
                className="w-full px-4 py-3 rounded-2xl border border-stone-200 focus:border-[#BE123C] focus:ring-2 focus:ring-[#BE123C]/20 outline-none text-xs sm:text-sm transition-all bg-stone-50/50"
              />
            </div>

            {/* Message Input */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-stone-700 flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-stone-400" />
                <span>Votre message *</span>
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Écrivez votre message ici..."
                rows={4}
                className="w-full px-4 py-3 rounded-2xl border border-stone-200 focus:border-[#BE123C] focus:ring-2 focus:ring-[#BE123C]/20 outline-none text-xs sm:text-sm transition-all bg-stone-50/50 resize-none"
                required
              />
            </div>

            {/* Submit CTA */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-[#BE123C] hover:bg-[#9F0E31] text-white py-3.5 px-6 rounded-2xl font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-rose-900/20 transition-all active:scale-[0.98] cursor-pointer disabled:opacity-50"
                id="btn-submit-contact"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Envoi en cours...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Envoyer le message</span>
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
