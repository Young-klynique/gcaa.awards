'use client';

import { useState, useEffect, useCallback } from 'react';
import Header from '@/components/shared/Header';
import Footer from '@/components/shared/Footer';
import CountdownTimer from '@/components/shared/CountdownTimer';
import { createClient } from '@/lib/supabase/client';
import { Category, Nominee, EventSettings } from '@/lib/types';
import { isVotingOpen, formatCurrency } from '@/lib/utils';
import { loadPaystackScript, initiatePayment, generateReference } from '@/lib/paystack';
import { toast } from 'sonner';
import { Vote, Loader2, Search, X, User, CreditCard } from 'lucide-react';

export default function VotePage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [nominees, setNominees] = useState<Nominee[]>([]);
  const [settings, setSettings] = useState<EventSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedNominee, setSelectedNominee] = useState<Nominee | null>(null);
  const [voteQty, setVoteQty] = useState(1);
  const [voterEmail, setVoterEmail] = useState('');
  const [voterName, setVoterName] = useState('');
  const [processing, setProcessing] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    async function load() {
      const [catRes, nomRes, setRes] = await Promise.all([
        supabase.from('categories').select('*').eq('is_active', true).order('display_order'),
        supabase.from('nominees').select('*, category:categories(*)').eq('is_active', true).order('name'),
        supabase.from('event_settings').select('*').limit(1).single(),
      ]);
      if (catRes.data) setCategories(catRes.data);
      if (nomRes.data) setNominees(nomRes.data as Nominee[]);
      if (setRes.data) setSettings(setRes.data);
      setLoading(false);
      await loadPaystackScript();
    }
    load();
  }, []);

  const filteredNominees = nominees.filter(n => {
    const matchCat = activeCategory === 'all' || n.category_id === activeCategory;
    const matchSearch = n.name.toLowerCase().includes(searchQuery.toLowerCase()) || n.code.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCat && matchSearch;
  });

  const costPerVote = settings?.vote_cost_pesewas || 300;
  const totalCost = voteQty * costPerVote;

  const handleVote = useCallback(async () => {
    if (!selectedNominee || !voterEmail) { toast.error('Please enter your email'); return; }
    if (!isVotingOpen(settings)) { toast.error('Voting is currently closed'); return; }
    setProcessing(true);
    const ref = generateReference();
    try {
      initiatePayment({
        email: voterEmail,
        amountPesewas: totalCost,
        reference: ref,
        metadata: { nominee_id: selectedNominee.id, category_id: selectedNominee.category_id, quantity: voteQty, voter_name: voterName },
        onSuccess: function(response) {
          (async () => {
            try {
              const verifyRes = await fetch('/api/verify-payment', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ reference: response.reference, nominee_id: selectedNominee.id, category_id: selectedNominee.category_id, quantity: voteQty, voter_email: voterEmail, voter_name: voterName }),
              });
              const data = await verifyRes.json();
              if (data.success) {
                toast.success(`Successfully cast ${voteQty} vote(s) for ${selectedNominee.name}!`);
                setNominees(prev => prev.map(n => n.id === selectedNominee.id ? { ...n, vote_count: n.vote_count + voteQty } : n));
                setSelectedNominee(null); setVoterEmail(''); setVoterName(''); setVoteQty(1);
              } else { toast.error(data.error || 'Payment verification failed'); }
            } catch { toast.error('Error verifying payment'); }
            setProcessing(false);
          })();
        },
        onClose: function() { setProcessing(false); toast.info('Payment cancelled'); },
      });
    } catch (err: any) { 
      toast.error('Payment Error: ' + (err.message || 'Failed to initialize payment')); 
      setProcessing(false); 
    }
  }, [selectedNominee, voterEmail, voterName, voteQty, totalCost, settings]);

  if (loading) return <div className="min-h-screen gradient-bg flex items-center justify-center"><Loader2 className="w-8 h-8 text-gold-400 animate-spin" /></div>;

  const votingOpen = isVotingOpen(settings);

  return (
    <div className="min-h-screen flex flex-col gradient-bg">
      <Header />
      <main className="flex-1 pt-24 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: 'rgba(234,179,8,0.1)', border: '1px solid rgba(234,179,8,0.15)' }}>
              <Vote className="w-8 h-8 text-gold-400" />
            </div>
            <h1 className="font-display text-3xl sm:text-4xl font-bold mb-2"><span className="gold-text">Vote</span></h1>
            <p className="text-dark-400">Support your favorite nominees — GH₵ {(costPerVote / 100).toFixed(2)} per vote</p>
          </div>

          {settings?.voting_end && <div className="mb-8"><CountdownTimer endDate={settings.voting_end} label="Voting closes in" size="sm" /></div>}

          {!votingOpen ? (
            <div className="glass-card p-10 text-center"><p className="text-dark-400 text-lg">Voting has not yet started come back another time</p></div>
          ) : (
            <>
              {/* Filters */}
              <div className="flex flex-col sm:flex-row gap-4 mb-8">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-500" />
                  <input className="form-input pl-10" placeholder="Search nominees..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
                </div>
                <div className="flex gap-2 overflow-x-auto pb-2 snap-x hide-scrollbar" style={{ WebkitOverflowScrolling: 'touch' }}>
                  <button onClick={() => setActiveCategory('all')} className={`whitespace-nowrap snap-start px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeCategory === 'all' ? 'bg-gold-500 text-dark-950' : 'glass-card-light text-dark-300 hover:text-gold-400'}`}>All</button>
                  {categories.map(c => (
                    <button key={c.id} onClick={() => setActiveCategory(c.id)} className={`whitespace-nowrap snap-start px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeCategory === c.id ? 'bg-gold-500 text-dark-950' : 'glass-card-light text-dark-300 hover:text-gold-400'}`}>{c.name}</button>
                  ))}
                </div>
              </div>

              {/* Nominee Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-6">
                {filteredNominees.map(nominee => (
                  <div key={nominee.id} className="nominee-card flex flex-col">
                    <div className="aspect-square bg-dark-800 relative overflow-hidden">
                      {nominee.photo_url ? (
                        <img src={nominee.photo_url} alt={nominee.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center"><User className="w-10 sm:w-20 h-10 sm:h-20 text-dark-600" /></div>
                      )}
                      <div className="absolute top-2 right-2 sm:top-3 sm:right-3 badge badge-pending !text-[9px] sm:!text-xs !px-1.5 sm:!px-2 !py-0.5 sm:!py-1">{nominee.code}</div>
                    </div>
                    <div className="p-3 sm:p-5 flex flex-col flex-1 justify-between">
                      <div>
                        <h3 className="font-display text-sm sm:text-lg font-bold text-dark-100 mb-0.5 sm:mb-1 truncate">{nominee.name}</h3>
                        <p className="text-dark-500 text-[9px] sm:text-xs uppercase tracking-wider mb-2 sm:mb-3 truncate">{(nominee.category as unknown as Category)?.name || 'Category'}</p>
                      </div>
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-0 mt-auto">
                        <button onClick={() => setSelectedNominee(nominee)} className="gold-btn !py-1.5 sm:!py-2 !px-2 sm:!px-4 !text-[10px] sm:!text-xs w-full sm:w-auto text-center ml-auto">Vote</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              {filteredNominees.length === 0 && <div className="glass-card p-10 text-center"><p className="text-dark-400">No nominees found.</p></div>}
            </>
          )}
        </div>
      </main>

      {/* Vote Modal */}
      {selectedNominee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}>
          <div className="glass-card p-6 sm:p-8 max-w-md w-full relative max-h-[90vh] overflow-y-auto" style={{ borderColor: 'rgba(234,179,8,0.3)' }}>
            <button onClick={() => { setSelectedNominee(null); setProcessing(false); }} className="absolute top-4 right-4 text-dark-400 hover:text-dark-200"><X className="w-5 h-5" /></button>
            <div className="text-center mb-6">
              <div className="w-20 h-20 rounded-full mx-auto mb-3 overflow-hidden bg-dark-800">
                {selectedNominee.photo_url ? <img src={selectedNominee.photo_url} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><User className="w-10 h-10 text-dark-600" /></div>}
              </div>
              <h3 className="font-display text-xl font-bold text-dark-100">{selectedNominee.name}</h3>
              <p className="text-dark-500 text-sm">{selectedNominee.code}</p>
            </div>

            <div className="space-y-4">
              <div><label className="form-label">Your Name</label><input className="form-input" value={voterName} onChange={e => setVoterName(e.target.value)} placeholder="Your name" /></div>
              <div><label className="form-label">Your Email *</label><input type="email" required className="form-input" value={voterEmail} onChange={e => setVoterEmail(e.target.value)} placeholder="your@email.com" /></div>
              <div>
                <label className="form-label">Number of Votes</label>
                <div className="flex gap-2">
                  {[1, 5, 10, 20].map(q => (
                    <button key={q} onClick={() => setVoteQty(q)} className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${voteQty === q ? 'bg-gold-500 text-dark-950' : 'glass-card-light text-dark-300 hover:text-gold-400'}`}>{q}</button>
                  ))}
                </div>
                <input type="number" min={1} max={settings?.max_votes_per_person || 100} className="form-input mt-2" value={voteQty} onChange={e => setVoteQty(Math.max(1, parseInt(e.target.value) || 1))} />
              </div>

              <div className="glass-card-light p-4 rounded-xl">
                <div className="flex justify-between text-sm mb-1"><span className="text-dark-400">{voteQty} vote(s) × {formatCurrency(costPerVote)}</span><span className="text-dark-200 font-bold">{formatCurrency(totalCost)}</span></div>
              </div>

              <button onClick={handleVote} disabled={processing || !voterEmail} className="gold-btn w-full flex items-center justify-center gap-2">
                {processing ? <><Loader2 className="w-5 h-5 animate-spin" /> Processing...</> : <><CreditCard className="w-5 h-5" /> Pay {formatCurrency(totalCost)}</>}
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
