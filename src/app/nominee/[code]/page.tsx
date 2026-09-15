'use client';

import { useState, useEffect, use } from 'react';
import Header from '@/components/shared/Header';
import Footer from '@/components/shared/Footer';
import { createClient } from '@/lib/supabase/client';
import { Nominee, Category } from '@/lib/types';
import { Loader2, User, Trophy, Share2, Activity } from 'lucide-react';
import { toast } from 'sonner';

export default function NomineeDashboard({ params }: { params: Promise<{ code: string }> }) {
  const { code } = use(params);
  const [nominee, setNominee] = useState<Nominee | null>(null);
  const [leaderboard, setLeaderboard] = useState<Nominee[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const [settings, setSettings] = useState<any>(null);

  useEffect(() => {
    async function loadData() {
      // Fetch settings
      const { data: setRes } = await supabase.from('event_settings').select('*').single();
      setSettings(setRes);

      // Fetch the specific nominee
      const { data: nomData, error: nomErr } = await supabase
        .from('nominees')
        .select('*, category:categories(*)')
        .eq('code', code)
        .single();

      if (nomErr || !nomData) {
        setLoading(false);
        return;
      }

      setNominee(nomData as Nominee);

      // Fetch the leaderboard for their category
      const { data: boardData } = await supabase
        .from('nominees')
        .select('*')
        .eq('category_id', nomData.category_id)
        .eq('is_active', true)
        .order('vote_count', { ascending: false });

      if (boardData) setLeaderboard(boardData as Nominee[]);
      setLoading(false);
    }

    loadData();

    // Set up real-time subscription for vote counts
    const channel = supabase
      .channel('nominee-updates')
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'nominees',
        filter: `category_id=eq.${nominee?.category_id || ''}`,
      }, (payload) => {
        const updated = payload.new as Nominee;
        if (updated.code === code) {
          setNominee(prev => prev ? { ...prev, vote_count: updated.vote_count } : prev);
        }
        setLeaderboard(prev => {
          const newBoard = prev.map(n => n.id === updated.id ? { ...n, vote_count: updated.vote_count } : n);
          return newBoard.sort((a, b) => b.vote_count - a.vote_count);
        });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [code, nominee?.category_id]);

  const handleShare = async () => {
    const url = `${window.location.origin}/vote?category=${nominee?.category_id}&search=${nominee?.code}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Vote for ${nominee?.name}`,
          text: `Support me for ${(nominee?.category as unknown as Category)?.name} at the Awards & Dinner Night 2026!`,
          url: url,
        });
      } catch (err) {
        console.error('Error sharing', err);
      }
    } else {
      navigator.clipboard.writeText(url);
      toast.success('Voting link copied to clipboard!');
    }
  };

  if (loading) return <div className="min-h-screen gradient-bg flex items-center justify-center"><Loader2 className="w-8 h-8 text-gold-400 animate-spin" /></div>;
  if (!nominee) return <div className="min-h-screen gradient-bg flex items-center justify-center flex-col"><h2 className="text-2xl font-bold mb-2 text-dark-100">Nominee Not Found</h2><p className="text-dark-400">The code you entered is invalid.</p></div>;

  const category = nominee.category as unknown as Category;
  const rank = leaderboard.findIndex(n => n.id === nominee.id) + 1;
  const totalCategoryVotes = leaderboard.reduce((sum, n) => sum + n.vote_count, 0);
  const votePercentage = totalCategoryVotes > 0 ? ((nominee.vote_count / totalCategoryVotes) * 100).toFixed(1) : '0.0';
  
  // Conditionally hide votes based on settings (defaults to true if undefined)
  const showVotes = settings?.show_nominee_votes !== false;

  return (
    <div className="min-h-screen flex flex-col gradient-bg">
      <Header />
      <main className="flex-1 pt-24 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          {/* Header Stats */}
          <div className="glass-card p-8 mb-8 flex flex-col md:flex-row items-center gap-8 text-center md:text-left">
            <div className="w-32 h-32 rounded-2xl overflow-hidden bg-dark-800 border-2 border-gold-500/30 flex-shrink-0">
              {nominee.photo_url ? (
                <img src={nominee.photo_url} alt={nominee.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center"><User className="w-12 h-12 text-dark-600" /></div>
              )}
            </div>
            <div className="flex-1">
              <div className="badge badge-pending mb-2">{nominee.code}</div>
              <h1 className="font-display text-3xl font-bold text-dark-100 mb-1">{nominee.name}</h1>
              <p className="text-gold-400 font-medium mb-4">{category?.name}</p>
              <button onClick={handleShare} className="gold-btn-outline !py-2 !px-4 !text-xs flex items-center gap-2 mx-auto md:mx-0">
                <Share2 className="w-4 h-4" /> Share My Voting Link
              </button>
            </div>
            
            {showVotes && (
              <div className="flex gap-4 md:flex-col md:border-l border-dark-800/50 md:pl-8">
                <div className="text-center">
                  <p className="text-dark-500 text-xs uppercase tracking-wider mb-1">Total Votes</p>
                  <p className="font-display text-4xl font-bold gold-text pulse-gold">{nominee.vote_count}</p>
                </div>
                <div className="text-center">
                  <p className="text-dark-500 text-xs uppercase tracking-wider mb-1">Current Rank</p>
                  <p className="font-display text-2xl font-bold text-dark-100 flex items-center justify-center gap-1">
                    <Trophy className={`w-5 h-5 ${rank === 1 ? 'text-gold-400' : rank === 2 ? 'text-gray-400' : rank === 3 ? 'text-amber-600' : 'text-dark-500'}`} />
                    #{rank}
                  </p>
                </div>
              </div>
            )}
            
            {!showVotes && (
              <div className="flex gap-4 md:flex-col md:border-l border-dark-800/50 md:pl-8">
                <div className="text-center">
                  <p className="text-dark-500 text-xs uppercase tracking-wider mb-1">Status</p>
                  <p className="font-display text-lg font-bold text-dark-100">Hidden for Suspense!</p>
                </div>
              </div>
            )}
          </div>

          {/* Detailed Stats */}
          {showVotes ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
               <div className="glass-card p-6">
                  <h3 className="font-display text-xl font-bold text-dark-100 mb-4 flex items-center gap-2">
                    <Activity className="w-5 h-5 text-gold-400" /> Vote Analysis
                  </h3>
                  <div className="space-y-6">
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-dark-300">Category Share</span>
                        <span className="text-gold-400 font-bold">{votePercentage}%</span>
                      </div>
                      <div className="vote-progress">
                        <div className="vote-progress-bar" style={{ width: `${votePercentage}%` }} />
                      </div>
                    </div>
                    <div className="pt-4 border-t border-dark-800/50">
                       <p className="text-sm text-dark-400">You need <strong className="text-dark-100">{rank === 1 ? '0' : (leaderboard[0]?.vote_count - nominee.vote_count + 1) || 0}</strong> more votes to take the #1 spot.</p>
                    </div>
                  </div>
               </div>
  
               {/* Leaderboard */}
               <div className="glass-card p-6">
                  <h3 className="font-display text-xl font-bold text-dark-100 mb-4 flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-gold-400" /> Category Leaderboard
                  </h3>
                  <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2">
                    {leaderboard.map((n, idx) => (
                      <div key={n.id} className={`flex items-center justify-between p-3 rounded-lg ${n.id === nominee.id ? 'bg-gold-500/10 border border-gold-500/20' : 'bg-dark-800/50'}`}>
                        <div className="flex items-center gap-3">
                          <span className={`font-bold w-5 text-center ${idx === 0 ? 'text-gold-400' : idx === 1 ? 'text-gray-400' : idx === 2 ? 'text-amber-600' : 'text-dark-500'}`}>
                            {idx + 1}
                          </span>
                          <div className="w-8 h-8 rounded-full overflow-hidden bg-dark-700 flex-shrink-0">
                            {n.photo_url ? <img src={n.photo_url} alt="" className="w-full h-full object-cover" /> : <User className="w-full h-full p-1 text-dark-500" />}
                          </div>
                          <div>
                             <p className={`text-sm font-medium ${n.id === nominee.id ? 'text-gold-400' : 'text-dark-200'}`}>
                               {n.id === nominee.id ? 'You' : n.name}
                             </p>
                             <p className="text-xs text-dark-500">{n.code}</p>
                          </div>
                        </div>
                        <span className="font-bold text-dark-100">{n.vote_count}</span>
                      </div>
                    ))}
                  </div>
               </div>
            </div>
          ) : (
            <div className="glass-card p-10 text-center">
              <Trophy className="w-16 h-16 text-gold-400/50 mx-auto mb-4" />
              <h2 className="font-display text-2xl font-bold text-dark-100 mb-2">Voting Results Hidden</h2>
              <p className="text-dark-400 text-lg">
                The competition is heating up! We have temporarily hidden the voting results to build suspense for the main event. Keep sharing your link and encouraging your fans to vote!
              </p>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
