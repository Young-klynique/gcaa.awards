'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/shared/Header';
import Footer from '@/components/shared/Footer';
import CountdownTimer from '@/components/shared/CountdownTimer';
import { createClient } from '@/lib/supabase/client';
import { Category, EventSettings } from '@/lib/types';
import { isNominationOpen } from '@/lib/utils';
import { toast } from 'sonner';
import { Users, Send, CheckCircle, Loader2 } from 'lucide-react';

export default function NominatePage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [settings, setSettings] = useState<EventSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({
    nominator_name: '', nominator_phone: '', nominator_email: '',
    nominee_name: '', nominee_phone: '', nominee_email: '',
    category_id: '', reason: '',
  });

  const supabase = createClient();

  useEffect(() => {
    async function load() {
      const [catRes, setRes] = await Promise.all([
        supabase.from('categories').select('*').eq('is_active', true).order('display_order'),
        supabase.from('event_settings').select('*').limit(1).single(),
      ]);
      if (catRes.data) setCategories(catRes.data);
      if (setRes.data) setSettings(setRes.data);
      setLoading(false);
    }
    load();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isNominationOpen(settings)) { toast.error('Nominations are currently closed'); return; }
    if (!form.category_id || !form.nominee_name || !form.nominator_name) {
      toast.error('Please fill in all required fields'); return;
    }
    setSubmitting(true);
    const { error } = await supabase.from('nominations').insert({
      category_id: form.category_id,
      nominee_name: form.nominee_name, nominee_phone: form.nominee_phone, nominee_email: form.nominee_email,
      nominator_name: form.nominator_name, nominator_phone: form.nominator_phone, nominator_email: form.nominator_email,
      reason: form.reason,
    });
    setSubmitting(false);
    if (error) { toast.error('Failed to submit nomination. Please try again.'); return; }
    setSubmitted(true);
    toast.success('Nomination submitted successfully!');
  };

  const resetForm = () => {
    setForm({ nominator_name: '', nominator_phone: '', nominator_email: '', nominee_name: '', nominee_phone: '', nominee_email: '', category_id: '', reason: '' });
    setSubmitted(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen gradient-bg flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-gold-400 animate-spin" />
      </div>
    );
  }

  const nominationOpen = isNominationOpen(settings);

  return (
    <div className="min-h-screen flex flex-col gradient-bg">
      <Header />
      <main className="flex-1 pt-24 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto">
          {/* Title */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: 'rgba(234,179,8,0.1)', border: '1px solid rgba(234,179,8,0.15)' }}>
              <Users className="w-8 h-8 text-gold-400" />
            </div>
            <h1 className="font-display text-3xl sm:text-4xl font-bold mb-2"><span className="gold-text">Nominate</span></h1>
            <p className="text-dark-400">Submit your nomination for a deserving individual</p>
          </div>

          {/* Countdown */}
          {settings?.nomination_end && (
            <div className="mb-8"><CountdownTimer endDate={settings.nomination_end} label="Nominations close in" size="sm" /></div>
          )}

          {!nominationOpen ? (
            <div className="glass-card p-10 text-center">
              <p className="text-dark-400 text-lg">Nominations are currently closed.</p>
              <p className="text-dark-500 text-sm mt-2">Please check back when the nomination period opens.</p>
            </div>
          ) : submitted ? (
            <div className="glass-card p-10 text-center">
              <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
              <h2 className="font-display text-2xl font-bold text-dark-100 mb-2">Nomination Submitted!</h2>
              <p className="text-dark-400 mb-6">Your nomination has been received and is pending review by the admin.</p>
              <button onClick={resetForm} className="gold-btn">Nominate Another Person</button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="glass-card p-6 sm:p-8 space-y-6">
              {/* Your Info */}
              <div>
                <h3 className="text-sm font-semibold text-gold-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-gold-500/20 flex items-center justify-center text-xs text-gold-300">1</span>
                  Your Information
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div><label className="form-label">Your Name *</label><input className="form-input" required value={form.nominator_name} onChange={e => setForm({...form, nominator_name: e.target.value})} placeholder="Enter your full name" /></div>
                  <div><label className="form-label">Your Phone</label><input className="form-input" value={form.nominator_phone} onChange={e => setForm({...form, nominator_phone: e.target.value})} placeholder="024XXXXXXX" /></div>
                </div>
                <div className="mt-4"><label className="form-label">Your Email</label><input type="email" className="form-input" value={form.nominator_email} onChange={e => setForm({...form, nominator_email: e.target.value})} placeholder="your@email.com" /></div>
              </div>

              {/* Nominee Info */}
              <div>
                <h3 className="text-sm font-semibold text-gold-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-gold-500/20 flex items-center justify-center text-xs text-gold-300">2</span>
                  Nominee Information
                </h3>
                <div><label className="form-label">Nominee&apos;s Full Name *</label><input className="form-input" required value={form.nominee_name} onChange={e => setForm({...form, nominee_name: e.target.value})} placeholder="Enter nominee's full name" /></div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                  <div><label className="form-label">Nominee&apos;s Phone</label><input className="form-input" value={form.nominee_phone} onChange={e => setForm({...form, nominee_phone: e.target.value})} placeholder="024XXXXXXX" /></div>
                  <div><label className="form-label">Nominee&apos;s Email</label><input type="email" className="form-input" value={form.nominee_email} onChange={e => setForm({...form, nominee_email: e.target.value})} placeholder="nominee@email.com" /></div>
                </div>
              </div>

              {/* Category & Reason */}
              <div>
                <h3 className="text-sm font-semibold text-gold-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-gold-500/20 flex items-center justify-center text-xs text-gold-300">3</span>
                  Category & Reason
                </h3>
                <div><label className="form-label">Award Category *</label>
                  <select className="form-select" required value={form.category_id} onChange={e => setForm({...form, category_id: e.target.value})}>
                    <option value="">Select a category</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div className="mt-4"><label className="form-label">Reason for Nomination</label>
                  <textarea className="form-input" rows={4} value={form.reason} onChange={e => setForm({...form, reason: e.target.value})} placeholder="Why do you think this person deserves this award?" />
                </div>
              </div>

              <button type="submit" disabled={submitting} className="gold-btn w-full flex items-center justify-center gap-2">
                {submitting ? <><Loader2 className="w-5 h-5 animate-spin" /> Submitting...</> : <><Send className="w-5 h-5" /> Submit Nomination</>}
              </button>
            </form>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
