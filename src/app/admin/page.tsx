'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Users, Vote, Trophy, DollarSign, Activity } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    nominations: 0,
    nominees: 0,
    votes: 0,
    revenue: 0,
  });
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function loadStats() {
      // Execute counts in parallel
      const [nomRes, activeNomRes, voteRes, allNomsVotes] = await Promise.all([
        supabase.from('nominations').select('*', { count: 'exact', head: true }),
        supabase.from('nominees').select('*', { count: 'exact', head: true }).eq('is_active', true),
        supabase.from('votes').select('amount_pesewas').eq('payment_status', 'success'),
        supabase.from('nominees').select('id, name, code, votes(amount_pesewas, payment_status)')
      ]);

      const totalRevenue = voteRes.data?.reduce((sum, v) => sum + v.amount_pesewas, 0) || 0;
      
      let topEarners = [];
      if (allNomsVotes.data) {
         topEarners = allNomsVotes.data.map((n: any) => {
           const rev = (n.votes || []).filter((v: any) => v.payment_status === 'success').reduce((sum: number, v: any) => sum + v.amount_pesewas, 0);
           return { name: n.name, code: n.code, revenue: rev };
         }).sort((a: any, b: any) => b.revenue - a.revenue).slice(0, 5);
      }
      
      setStats({
        nominations: nomRes.count || 0,
        nominees: activeNomRes.count || 0,
        votes: voteRes.data?.length || 0,
        revenue: totalRevenue,
        topEarners
      } as any);
      
      setLoading(false);
    }
    
    loadStats();
  }, []);

  if (loading) return <div className="animate-pulse flex space-x-4"><div className="flex-1 space-y-6 py-1"><div className="h-4 bg-dark-800 rounded w-1/4"></div><div className="grid grid-cols-4 gap-4"><div className="h-24 bg-dark-800 rounded"></div><div className="h-24 bg-dark-800 rounded"></div><div className="h-24 bg-dark-800 rounded"></div><div className="h-24 bg-dark-800 rounded"></div></div></div></div>;

  const statCards = [
    { title: 'Total Revenue', value: formatCurrency(stats.revenue), icon: DollarSign, color: 'text-green-400', bg: 'bg-green-400/10', border: 'border-green-400/20' },
    { title: 'Total Votes', value: stats.votes.toLocaleString(), icon: Vote, color: 'text-gold-400', bg: 'bg-gold-400/10', border: 'border-gold-400/20' },
    { title: 'Active Nominees', value: stats.nominees.toLocaleString(), icon: Trophy, color: 'text-blue-400', bg: 'bg-blue-400/10', border: 'border-blue-400/20' },
    { title: 'Nominations', value: stats.nominations.toLocaleString(), icon: Users, color: 'text-purple-400', bg: 'bg-purple-400/10', border: 'border-purple-400/20' },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-dark-100">Dashboard Overview</h1>
        <p className="text-dark-400 text-sm">Welcome to the admin panel. Here&apos;s what&apos;s happening.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statCards.map((stat, i) => (
          <div key={i} className={`glass-card p-6 border ${stat.border}`}>
            <div className="flex items-center justify-between mb-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${stat.bg}`}>
                <stat.icon className={`w-6 h-6 ${stat.color}`} />
              </div>
              <Activity className="w-4 h-4 text-dark-500" />
            </div>
            <h3 className="text-dark-400 text-sm font-medium mb-1">{stat.title}</h3>
            <p className="font-display text-3xl font-bold text-dark-100">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-card p-6 border border-dark-800">
           <h3 className="text-lg font-bold text-dark-100 mb-4">Quick Actions</h3>
           <div className="space-y-3">
             <p className="text-dark-400 text-sm mb-4">Common tasks to manage the platform efficiently.</p>
             <a href="/admin/nominations" className="block w-full p-4 rounded-xl bg-dark-800/50 hover:bg-dark-800 border border-dark-700/50 transition-colors">
               <div className="flex items-center gap-3">
                 <Users className="w-5 h-5 text-gold-400" />
                 <div><p className="text-sm font-medium text-dark-100">Review Nominations</p><p className="text-xs text-dark-400">Approve or reject public submissions</p></div>
               </div>
             </a>
             <a href="/admin/flyers" className="block w-full p-4 rounded-xl bg-dark-800/50 hover:bg-dark-800 border border-dark-700/50 transition-colors">
               <div className="flex items-center gap-3">
                 <Trophy className="w-5 h-5 text-gold-400" />
                 <div><p className="text-sm font-medium text-dark-100">Generate Category Flyers</p><p className="text-xs text-dark-400">Create promotional images for categories</p></div>
               </div>
             </a>
           </div>
        </div>
        
        <div className="glass-card p-6 border border-dark-800">
           <div className="flex items-center justify-between mb-6">
             <h3 className="text-lg font-bold text-dark-100">Top Earners</h3>
             <Trophy className="w-5 h-5 text-gold-400" />
           </div>
           
           {(stats as any).topEarners?.length > 0 ? (
             <div className="space-y-4">
               {(stats as any).topEarners.map((earner: any, idx: number) => (
                 <div key={idx} className="flex items-center justify-between p-3 bg-dark-800/50 rounded-lg border border-dark-700/50">
                   <div className="flex items-center gap-3">
                     <div className="w-8 h-8 rounded bg-dark-700 flex items-center justify-center text-dark-300 font-bold text-sm">
                       #{idx + 1}
                     </div>
                     <div>
                       <p className="font-medium text-dark-100 text-sm truncate max-w-[150px] sm:max-w-[200px]">{earner.name}</p>
                       <p className="text-xs text-dark-400">{earner.code}</p>
                     </div>
                   </div>
                   <div className="text-right">
                     <p className="font-bold text-green-400 text-sm">{formatCurrency(earner.revenue)}</p>
                   </div>
                 </div>
               ))}
             </div>
           ) : (
             <div className="text-center py-8">
               <div className="w-16 h-16 rounded-full bg-dark-800 flex items-center justify-center mx-auto mb-4 border border-dark-700">
                  <Vote className="w-8 h-8 text-dark-500" />
               </div>
               <p className="text-dark-400 text-sm">No revenue data available yet.</p>
             </div>
           )}
        </div>
      </div>
    </div>
  );
}
