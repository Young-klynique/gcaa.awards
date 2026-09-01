'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { EventSettings } from '@/lib/types';
import { toast } from 'sonner';
import { Loader2, Save } from 'lucide-react';

export default function AdminSettings() {
  const [settings, setSettings] = useState<EventSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    async function load() {
      const { data } = await supabase.from('event_settings').select('*').limit(1).single();
      if (data) {
        // Format dates for datetime-local input
        const formatForInput = (isoStr: string | null) => isoStr ? new Date(isoStr).toISOString().slice(0, 16) : '';
        setSettings({
          ...data,
          nomination_start: formatForInput(data.nomination_start),
          nomination_end: formatForInput(data.nomination_end),
          voting_start: formatForInput(data.voting_start),
          voting_end: formatForInput(data.voting_end),
        });
      }
      setLoading(false);
    }
    load();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;
    setSaving(true);
    
    // Convert back to ISO for DB
    const formatForDB = (val: string | null) => val ? new Date(val).toISOString() : null;
    
    const updates = {
      event_name: settings.event_name,
      vote_cost_pesewas: settings.vote_cost_pesewas,
      allow_multiple_votes: settings.allow_multiple_votes,
      max_votes_per_person: settings.max_votes_per_person,
      nomination_start: formatForDB(settings.nomination_start),
      nomination_end: formatForDB(settings.nomination_end),
      voting_start: formatForDB(settings.voting_start),
      voting_end: formatForDB(settings.voting_end),
    };

    const { error } = await supabase.from('event_settings').update(updates).eq('id', settings.id);
    
    setSaving(false);
    if (error) { toast.error('Failed to save settings'); return; }
    toast.success('Event settings updated successfully');
  };

  if (loading) return <div className="py-20 text-center"><Loader2 className="w-8 h-8 text-gold-400 animate-spin mx-auto" /></div>;
  if (!settings) return null;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-dark-100">Event Settings</h1>
        <p className="text-dark-400 text-sm">Configure event details, deadlines, and pricing.</p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* General */}
        <div className="glass-card p-6 border border-dark-800">
           <h2 className="text-lg font-bold text-dark-100 mb-4 border-b border-dark-800/50 pb-2">General Info</h2>
           <div className="max-w-md">
             <label className="form-label">Event Name</label>
             <input required className="form-input" value={settings.event_name} onChange={e => setSettings({...settings, event_name: e.target.value})} />
           </div>
        </div>

        {/* Timelines */}
        <div className="glass-card p-6 border border-dark-800">
           <h2 className="text-lg font-bold text-dark-100 mb-4 border-b border-dark-800/50 pb-2">Event Timelines</h2>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                 <h3 className="text-sm font-semibold text-gold-400 mb-3">Nomination Period</h3>
                 <div className="space-y-4">
                    <div><label className="form-label">Starts At</label><input type="datetime-local" className="form-input bg-dark-900" value={settings.nomination_start || ''} onChange={e => setSettings({...settings, nomination_start: e.target.value})} /></div>
                    <div><label className="form-label">Ends At</label><input type="datetime-local" className="form-input bg-dark-900" value={settings.nomination_end || ''} onChange={e => setSettings({...settings, nomination_end: e.target.value})} /></div>
                 </div>
              </div>
              <div>
                 <h3 className="text-sm font-semibold text-gold-400 mb-3">Voting Period</h3>
                 <div className="space-y-4">
                    <div><label className="form-label">Starts At</label><input type="datetime-local" className="form-input bg-dark-900" value={settings.voting_start || ''} onChange={e => setSettings({...settings, voting_start: e.target.value})} /></div>
                    <div><label className="form-label">Ends At</label><input type="datetime-local" className="form-input bg-dark-900" value={settings.voting_end || ''} onChange={e => setSettings({...settings, voting_end: e.target.value})} /></div>
                 </div>
              </div>
           </div>
        </div>

        {/* Pricing */}
        <div className="glass-card p-6 border border-dark-800">
           <h2 className="text-lg font-bold text-dark-100 mb-4 border-b border-dark-800/50 pb-2">Payment & Voting Logic</h2>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl">
              <div>
                 <label className="form-label">Cost per Vote (in Pesewas)</label>
                 <div className="relative">
                   <span className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-500">GH₵</span>
                   <input type="number" min="100" className="form-input pl-12" value={settings.vote_cost_pesewas / 100} onChange={e => setSettings({...settings, vote_cost_pesewas: parseInt(e.target.value) * 100})} />
                 </div>
                 <p className="text-xs text-dark-400 mt-1">Example: 100 pesewas = GH₵ 1.00</p>
              </div>
              <div>
                 <label className="form-label">Max Votes per Transaction</label>
                 <input type="number" min="1" className="form-input" value={settings.max_votes_per_person} onChange={e => setSettings({...settings, max_votes_per_person: parseInt(e.target.value)})} />
              </div>
              <div className="col-span-full pt-2">
                 <div className="flex items-center gap-3">
                   <input type="checkbox" id="allowMulti" checked={settings.allow_multiple_votes} onChange={e => setSettings({...settings, allow_multiple_votes: e.target.checked})} className="w-5 h-5 accent-gold-500 rounded bg-dark-800" />
                   <label htmlFor="allowMulti" className="text-sm text-dark-200">Allow users to select quantity and pay for multiple votes at once (Highly Recommended)</label>
                 </div>
              </div>
           </div>
        </div>

        <div className="flex justify-end pt-4">
           <button type="submit" disabled={saving} className="gold-btn flex items-center gap-2">
             {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
             Save All Settings
           </button>
        </div>
      </form>
    </div>
  );
}
