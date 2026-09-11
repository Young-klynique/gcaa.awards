'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Nomination, Category } from '@/lib/types';
import { generateNomineeCode } from '@/lib/utils';
import { toast } from 'sonner';
import { Loader2, Check, X, UserPlus, Eye } from 'lucide-react';

import { sendNominationSMS } from '@/app/actions/sms';

export default function AdminNominations() {
  const [nominations, setNominations] = useState<Nomination[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedNomination, setSelectedNomination] = useState<Nomination | null>(null);
  const [isConverting, setIsConverting] = useState(false);
  const supabase = createClient();

  const loadNominations = async () => {
    setLoading(true);
    const { data } = await supabase.from('nominations').select('*, category:categories(name)').order('created_at', { ascending: false });
    if (data) setNominations(data as Nomination[]);
    setLoading(false);
  };

  useEffect(() => { loadNominations(); }, []);

  const updateStatus = async (id: string, status: 'approved' | 'rejected') => {
    const { error } = await supabase.from('nominations').update({ status }).eq('id', id);
    if (error) { toast.error(error.message); return; }
    toast.success(`Nomination ${status}`);
    setNominations(prev => prev.map(n => n.id === id ? { ...n, status } : n));
    setSelectedNomination(null);
  };

  const convertToNominee = async (nomination: Nomination) => {
    setIsConverting(true);
    // 1. Get next code index
    const { count } = await supabase.from('nominees').select('*', { count: 'exact', head: true });
    const newCode = generateNomineeCode();

    // 2. Insert into nominees
    const { error: nomError } = await supabase.from('nominees').insert({
      category_id: nomination.category_id,
      name: nomination.nominee_name,
      code: newCode,
      phone: nomination.nominee_phone,
      email: nomination.nominee_email,
      bio: nomination.reason // Use reason as initial bio
    });

    if (nomError) { toast.error(nomError.message); setIsConverting(false); return; }

    // 3. Mark nomination as approved
    await supabase.from('nominations').update({ status: 'approved' }).eq('id', nomination.id);
    
    // 4. Send SMS to Nominee
    if (nomination.nominee_phone) {
      const categoryName = (nomination.category as unknown as Category)?.name || 'their category';
      const smsResult = await sendNominationSMS(
        nomination.nominee_phone,
        nomination.nominee_name,
        newCode,
        categoryName
      );
      if (smsResult.success) {
         toast.success('SMS notification sent to nominee!');
      } else {
         toast.error(`SMS failed: ${smsResult.error}`);
      }
    }

    toast.success(`Nominee created with code: ${newCode}`);
    setIsConverting(false);
    setSelectedNomination(null);
    loadNominations();
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-dark-100">Nominations</h1>
        <p className="text-dark-400 text-sm">Review public submissions and convert them to official nominees.</p>
      </div>

      <div className="glass-card border border-dark-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Nominee</th>
                <th>Category</th>
                <th>Nominator</th>
                <th>Date</th>
                <th>Status</th>
                <th className="text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="text-center py-8"><Loader2 className="w-6 h-6 text-gold-400 animate-spin mx-auto" /></td></tr>
              ) : nominations.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-8 text-dark-400">No nominations found.</td></tr>
              ) : (
                nominations.map(n => (
                  <tr key={n.id}>
                    <td>
                      <p className="font-medium text-dark-100">{n.nominee_name}</p>
                      {n.nominee_phone && <p className="text-xs text-dark-400">{n.nominee_phone}</p>}
                    </td>
                    <td><span className="text-sm text-dark-200">{(n.category as unknown as Category)?.name}</span></td>
                    <td><p className="text-sm text-dark-300">{n.nominator_name}</p></td>
                    <td><span className="text-xs text-dark-400">{new Date(n.created_at).toLocaleDateString()}</span></td>
                    <td>
                      <span className={`badge ${n.status === 'approved' ? 'badge-approved' : n.status === 'rejected' ? 'badge-failed' : 'badge-pending'}`}>
                        {n.status}
                      </span>
                    </td>
                    <td>
                      <div className="flex justify-end">
                         <button onClick={() => setSelectedNomination(n)} className="p-2 bg-dark-800 hover:bg-dark-700 text-gold-400 rounded-lg transition-colors"><Eye className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Review Modal */}
      {selectedNomination && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
           <div className="glass-card p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                 <h2 className="text-xl font-bold text-dark-100">Review Nomination</h2>
                 <button onClick={() => setSelectedNomination(null)} className="text-dark-400 hover:text-dark-200"><X className="w-5 h-5" /></button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                 <div className="glass-card-light p-4 rounded-xl">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-dark-400 mb-3">Nominee Details</h3>
                    <p className="text-lg font-medium text-gold-400 mb-1">{selectedNomination.nominee_name}</p>
                    <p className="text-sm text-dark-300">{(selectedNomination.category as unknown as Category)?.name}</p>
                    {selectedNomination.nominee_phone && <p className="text-sm text-dark-300 mt-2">📞 {selectedNomination.nominee_phone}</p>}
                    {selectedNomination.nominee_email && <p className="text-sm text-dark-300">✉️ {selectedNomination.nominee_email}</p>}
                 </div>
                 <div className="glass-card-light p-4 rounded-xl">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-dark-400 mb-3">Submitted By</h3>
                    <p className="text-base font-medium text-dark-100 mb-1">{selectedNomination.nominator_name}</p>
                    {selectedNomination.nominator_phone && <p className="text-sm text-dark-300">📞 {selectedNomination.nominator_phone}</p>}
                    {selectedNomination.nominator_email && <p className="text-sm text-dark-300">✉️ {selectedNomination.nominator_email}</p>}
                 </div>
              </div>

              <div className="glass-card-light p-4 rounded-xl mb-6">
                 <h3 className="text-xs font-bold uppercase tracking-wider text-dark-400 mb-2">Reason for Nomination</h3>
                 <p className="text-sm text-dark-200 italic">&quot;{selectedNomination.reason || 'No reason provided.'}&quot;</p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-dark-800">
                 {selectedNomination.status === 'pending' && (
                   <>
                     <button onClick={() => updateStatus(selectedNomination.id, 'rejected')} className="flex-1 py-2 px-4 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 font-medium transition-colors">Reject</button>
                     <button onClick={() => updateStatus(selectedNomination.id, 'approved')} className="flex-1 py-2 px-4 rounded-lg bg-green-500/10 text-green-400 border border-green-500/20 hover:bg-green-500/20 font-medium transition-colors">Approve</button>
                   </>
                 )}
                 <button 
                   onClick={() => convertToNominee(selectedNomination)} 
                   disabled={isConverting}
                   className="flex-1 gold-btn flex items-center justify-center gap-2"
                 >
                   {isConverting ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
                   Create Official Nominee
                 </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
}
