'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Vote, Category, Nominee } from '@/lib/types';
import { formatCurrency } from '@/lib/utils';
import { Loader2, Search, Download } from 'lucide-react';

export default function AdminVotes() {
  const [votes, setVotes] = useState<Vote[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const supabase = createClient();

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('votes')
        .select('*, category:categories(name), nominee:nominees(name, code)')
        .order('created_at', { ascending: false });
      
      if (data) setVotes(data as Vote[]);
      setLoading(false);
    }
    load();
  }, []);

  const handleExport = () => {
    // Basic CSV export
    const headers = ['Date', 'Transaction Ref', 'Voter Name', 'Voter Email', 'Category', 'Nominee', 'Quantity', 'Amount Paid', 'Status'];
    const csvContent = [
      headers.join(','),
      ...votes.map(v => [
        new Date(v.created_at).toLocaleString().replace(',', ''),
        v.paystack_reference,
        `"${v.voter_name || ''}"`,
        v.voter_email,
        `"${(v.category as unknown as Category)?.name || ''}"`,
        `"${(v.nominee as unknown as Nominee)?.name || ''}"`,
        v.quantity,
        (v.amount_pesewas / 100).toFixed(2),
        v.payment_status
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `votes_export_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const filteredVotes = votes.filter(v => 
    v.voter_email?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    v.paystack_reference?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (v.voter_name && v.voter_name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div>
      <div className="flex flex-col md:flex-row justify-between md:items-end gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-dark-100">Votes & Payments</h1>
          <p className="text-dark-400 text-sm">Track all voting transactions and revenue.</p>
        </div>
        <div className="flex gap-3">
           <div className="relative">
             <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-500" />
             <input className="form-input pl-10 text-sm py-2" placeholder="Search ref or email..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
           </div>
           <button onClick={handleExport} className="gold-btn-outline flex items-center gap-2 !py-2 !px-4 !text-xs">
             <Download className="w-4 h-4" /> Export CSV
           </button>
        </div>
      </div>

      <div className="glass-card border border-dark-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="admin-table whitespace-nowrap">
            <thead>
              <tr>
                <th>Date</th>
                <th>Voter Details</th>
                <th>Vote Selection</th>
                <th>Payment</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} className="text-center py-8"><Loader2 className="w-6 h-6 text-gold-400 animate-spin mx-auto" /></td></tr>
              ) : filteredVotes.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-8 text-dark-400">No transactions found.</td></tr>
              ) : (
                filteredVotes.map(v => (
                  <tr key={v.id}>
                    <td>
                      <p className="text-sm text-dark-100">{new Date(v.created_at).toLocaleDateString()}</p>
                      <p className="text-xs text-dark-500">{new Date(v.created_at).toLocaleTimeString()}</p>
                    </td>
                    <td>
                      <p className="text-sm font-medium text-dark-100">{v.voter_name || 'Anonymous'}</p>
                      <p className="text-xs text-dark-400">{v.voter_email}</p>
                    </td>
                    <td>
                      <p className="text-sm text-gold-400 font-medium">{(v.nominee as unknown as Nominee)?.name}</p>
                      <p className="text-xs text-dark-400">{(v.category as unknown as Category)?.name}</p>
                    </td>
                    <td>
                      <p className="text-sm font-bold text-dark-100">{formatCurrency(v.amount_pesewas)}</p>
                      <p className="text-xs text-dark-400">{v.quantity} vote(s)</p>
                      <p className="text-[10px] text-dark-500 font-mono mt-1">{v.paystack_reference}</p>
                    </td>
                    <td>
                      <span className={`badge ${v.payment_status === 'success' ? 'badge-approved' : v.payment_status === 'failed' ? 'badge-failed' : 'badge-pending'}`}>
                        {v.payment_status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
