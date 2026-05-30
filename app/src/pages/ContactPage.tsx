import { Mail, Send, MessageSquareWarning, ShieldCheck, CheckCircle } from "lucide-react";
import React, { useState } from 'react';
import { useLanguage } from '../hooks/useLanguage';

export default function ContactPage() {
  const { t } = useLanguage();
  void t;
  const phone = "+40769889721";
  const email = "solaris-cet@protonmail.com";

  const whatsappUrl = `https://wa.me/${phone.replace('+', '')}?text=${encodeURIComponent("Hello Solaris CET, I am interested in your PV and construction services.")}`;

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries());

    try {
      const res = await fetch('/api/support/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (res.ok) setIsSuccess(true);
    } catch (err) {
      console.error("Submission error", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main id="main-content" className="relative z-10 pt-24 pb-20 px-6 max-w-7xl mx-auto">
      <div className="text-center mb-16">
        <h1 className="text-4xl md:text-6xl font-extrabold text-white mb-6 uppercase tracking-tighter">
          Contact <span className="text-solaris-gold">Us</span>
        </h1>
        <p className="text-slate-400 text-lg max-w-2xl mx-auto">
          Professional engineering and construction services anchored in Cetățuia, Romania.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        <div className="space-y-8">
          <div className="bg-slate-900/50 border border-white/10 p-8 rounded-3xl backdrop-blur-xl">
            <h2 className="text-2xl font-bold text-white mb-8">Get in touch</h2>

            <div className="space-y-6">
              <a href={`tel:${phone}`} className="flex items-center gap-4 text-slate-300 hover:text-solaris-gold transition-colors group">
                <div className="w-12 h-12 rounded-2xl bg-solaris-gold/10 flex items-center justify-center group-hover:bg-solaris-gold/20 transition-colors">
                  <ShieldCheck className="w-5 h-5 text-solaris-gold" />
                </div>
                <div>
                  <p className="text-xs font-mono uppercase tracking-widest text-slate-500">Phone</p>
                  <p className="text-lg font-semibold">{phone}</p>
                </div>
              </a>

              <a href={`mailto:${email}`} className="flex items-center gap-4 text-slate-300 hover:text-solaris-gold transition-colors group">
                <div className="w-12 h-12 rounded-2xl bg-solaris-gold/10 flex items-center justify-center group-hover:bg-solaris-gold/20 transition-colors">
                  <Mail className="w-5 h-5 text-solaris-gold" />
                </div>
                <div>
                  <p className="text-xs font-mono uppercase tracking-widest text-slate-500">Email</p>
                  <p className="text-lg font-semibold">{email}</p>
                </div>
              </a>

              <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-4 text-slate-300 hover:text-emerald-400 transition-colors group">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center group-hover:bg-emerald-500/20 transition-colors">
                  <MessageSquareWarning className="w-5 h-5 text-emerald-500" />
                </div>
                <div>
                  <p className="text-xs font-mono uppercase tracking-widest text-slate-500">WhatsApp</p>
                  <p className="text-lg font-semibold">Chat with us</p>
                </div>
              </a>
            </div>
          </div>

          <div className="bg-solaris-gold/5 border border-solaris-gold/20 p-8 rounded-3xl">
            <h3 className="text-solaris-gold font-bold mb-2">Location</h3>
            <p className="text-slate-300">
              Cetățuia, Romania<br />
              Professional Construction & PV Installation
            </p>
          </div>
        </div>

        {isSuccess ? (
          <div className="bg-emerald-500/10 border border-emerald-500/30 p-12 rounded-3xl backdrop-blur-xl text-center flex flex-col items-center justify-center">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center mb-6">
              <CheckCircle className="w-8 h-8 text-emerald-500" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Message Sent!</h2>
            <p className="text-slate-400">Thank you for reaching out. We will get back to you shortly.</p>
            <button onClick={() => setIsSuccess(false)} className="mt-8 text-solaris-gold hover:underline font-mono text-xs uppercase tracking-widest">Send another message</button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="bg-slate-900/50 border border-white/10 p-8 rounded-3xl backdrop-blur-xl space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-400">Name</label>
              <input name="name" required type="text" className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-solaris-gold outline-none transition-colors" placeholder="Your Name" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-400">Email</label>
              <input name="email" required type="email" className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-solaris-gold outline-none transition-colors" placeholder="your@email.com" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-400">Service</label>
              <select name="service" className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-solaris-gold outline-none transition-colors">
                <option value="pv">PV Installation</option>
                <option value="construction">Construction</option>
                <option value="roofing">Roofing</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-400">Message</label>
              <textarea name="message" required rows={4} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-solaris-gold outline-none transition-colors" placeholder="How can we help?"></textarea>
            </div>
            <button disabled={isSubmitting} type="submit" className="w-full bg-solaris-gold hover:bg-solaris-gold-dim text-black font-bold py-4 rounded-xl transition-all active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50">
              {isSubmitting ? (
                <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Send Message
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
