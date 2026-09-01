'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/shared/Header';
import Footer from '@/components/shared/Footer';
import { Search, Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

export default function NomineePortalLogin() {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code) return;
    
    setLoading(true);
    const { data, error } = await supabase
      .from('nominees')
      .select('code')
      .eq('code', code.toUpperCase())
      .single();

    setLoading(false);

    if (error || !data) {
      toast.error('Invalid nominee code. Please check and try again.');
      return;
    }

    router.push(`/nominee/${data.code}`);
  };

  return (
    <div className="min-h-screen flex flex-col gradient-bg">
      <Header />
      <main className="flex-1 pt-32 pb-16 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
        <div className="w-full max-w-md">
          <div className="glass-card p-8 text-center">
            <h1 className="font-display text-3xl font-bold mb-2"><span className="gold-text">Nominee Portal</span></h1>
            <p className="text-dark-400 text-sm mb-8">Enter your unique code to view your real-time voting results and stats.</p>
            
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <input 
                  type="text" 
                  required 
                  className="form-input text-center text-lg tracking-widest uppercase" 
                  placeholder="e.g., AWD-001" 
                  value={code} 
                  onChange={e => setCode(e.target.value)} 
                />
              </div>
              <button 
                type="submit" 
                disabled={loading || !code} 
                className="gold-btn w-full flex items-center justify-center gap-2"
              >
                {loading ? <><Loader2 className="w-5 h-5 animate-spin" /> Verifying...</> : <><Search className="w-5 h-5" /> Access Portal</>}
              </button>
            </form>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
