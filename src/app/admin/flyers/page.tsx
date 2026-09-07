'use client';

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Category, Nominee } from '@/lib/types';
import html2canvas from 'html2canvas';
import { toast } from 'sonner';
import { Image as ImageIcon, Download, Loader2, Trophy, User } from 'lucide-react';

export default function AdminFlyerGenerator() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [nominees, setNominees] = useState<Nominee[]>([]);
  const [selectedCatId, setSelectedCatId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const flyerRef = useRef<HTMLDivElement>(null);

  const supabase = createClient();

  useEffect(() => {
    async function load() {
      const { data: catData } = await supabase.from('categories').select('*').eq('is_active', true);
      if (catData) {
        setCategories(catData);
        if (catData.length > 0) setSelectedCatId(catData[0].id);
      }
      setLoading(false);
    }
    load();
  }, []);

  useEffect(() => {
    async function loadNominees() {
      if (!selectedCatId) return;
      const { data } = await supabase.from('nominees').select('*').eq('category_id', selectedCatId).eq('is_active', true);
      if (data) setNominees(data as Nominee[]);
    }
    loadNominees();
  }, [selectedCatId]);

  const generateFlyer = async () => {
    if (!flyerRef.current) return;
    setGenerating(true);
    toast.info('Generating high-quality flyer... Please wait.');

    try {
      const canvas = await html2canvas(flyerRef.current, {
        scale: 2, // High resolution
        useCORS: true,
        backgroundColor: '#020617',
      });
      
      const link = document.createElement('a');
      link.download = `category-${selectedCatId}-flyer.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      toast.success('Flyer downloaded successfully!');
    } catch (err) {
      console.error(err);
      toast.error('Failed to generate flyer');
    } finally {
      setGenerating(false);
    }
  };

  const selectedCat = categories.find(c => c.id === selectedCatId);

  return (
    <div>
      <div className="flex flex-col md:flex-row justify-between md:items-end gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-dark-100">Flyer Generator</h1>
          <p className="text-dark-400 text-sm">Create social media ready promotional images for categories.</p>
        </div>
        <div className="flex gap-3 items-center">
           <select className="form-select text-sm py-2 w-64" value={selectedCatId} onChange={e => setSelectedCatId(e.target.value)}>
             {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
           </select>
           <button onClick={generateFlyer} disabled={generating || !selectedCatId} className="gold-btn flex items-center gap-2 !py-2 !px-4 !text-xs">
             {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
             Download Image
           </button>
        </div>
      </div>

      {loading ? (
        <div className="py-20 text-center"><Loader2 className="w-8 h-8 text-gold-400 animate-spin mx-auto" /></div>
      ) : (
        <div className="glass-card border border-dark-800 p-8 flex justify-center overflow-x-auto bg-dark-950/50">
          
          {/* THE FLYER TEMPLATE - Fixed size 1080x1080 for Instagram square */}
          <div 
            ref={flyerRef}
            className="bg-dark-950 relative overflow-hidden"
            style={{ width: '1080px', height: '1080px', flexShrink: 0 }}
          >
            {/* Background elements */}
            <div className="absolute inset-0 bg-gradient-to-br from-dark-950 via-dark-900 to-dark-950" />
            <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle at 50% 0%, rgba(234, 179, 8, 0.15) 0%, transparent 60%)' }} />
            
            {/* Corner decorations */}
            <div className="absolute top-0 left-0 w-32 h-32 border-t-4 border-l-4 border-gold-500/50 m-8" />
            <div className="absolute top-0 right-0 w-32 h-32 border-t-4 border-r-4 border-gold-500/50 m-8" />
            <div className="absolute bottom-0 left-0 w-32 h-32 border-b-4 border-l-4 border-gold-500/50 m-8" />
            <div className="absolute bottom-0 right-0 w-32 h-32 border-b-4 border-r-4 border-gold-500/50 m-8" />

            <div className="relative z-10 flex flex-col h-full p-16">
              {/* Header */}
              <div className="text-center mb-12">
                <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-gold-400 to-gold-600 rounded-2xl flex items-center justify-center">
                   <Trophy className="w-12 h-12 text-dark-950" />
                </div>
                <h2 className="font-display text-4xl font-bold tracking-widest text-gold-400 uppercase mb-4">NASPA GCAA Awards & Movie 2026</h2>
                <h1 className="font-display text-7xl font-bold text-white leading-tight mb-4">Official Nominees</h1>
                <div className="inline-block px-8 py-3 bg-gold-500/10 border border-gold-500/30 rounded-full">
                  <p className="text-3xl font-bold text-gold-400">{selectedCat?.name}</p>
                </div>
              </div>

              {/* Grid of Nominees */}
              <div className="flex-1 flex items-center justify-center">
                <div className={`grid gap-8 w-full max-w-4xl mx-auto ${nominees.length <= 4 ? 'grid-cols-2' : nominees.length <= 6 ? 'grid-cols-3' : 'grid-cols-4'}`}>
                  {nominees.slice(0, 8).map(n => (
                    <div key={n.id} className="text-center">
                       <div className="aspect-square bg-dark-800 rounded-xl overflow-hidden border-2 border-gold-500/30 mb-4 shadow-[0_0_20px_rgba(234,179,8,0.15)]">
                          {n.photo_url ? (
                            <img src={n.photo_url} crossOrigin="anonymous" className="w-full h-full object-cover" alt="" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center"><User className="w-16 h-16 text-dark-600" /></div>
                          )}
                       </div>
                       <h3 className="font-bold text-xl text-white mb-2 truncate px-2">{n.name}</h3>
                       <div className="inline-block px-4 py-1.5 bg-dark-800 border border-gold-500/20 rounded-full text-gold-400 font-mono text-lg font-bold">
                         {n.code}
                       </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Footer */}
              <div className="mt-12 text-center pt-8 border-t border-dark-800">
                 <p className="text-2xl text-dark-300 mb-2">To vote, visit the official website:</p>
                 <p className="text-4xl font-bold gold-text">www.yourwebsite.com/vote</p>
                 <p className="text-xl text-dark-400 mt-4">GH₵ 1.00 per vote • Multiple votes allowed</p>
              </div>
            </div>
          </div>
          {/* END FLYER TEMPLATE */}

        </div>
      )}
    </div>
  );
}
