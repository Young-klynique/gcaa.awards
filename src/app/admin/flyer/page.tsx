'use client';

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Nominee, Category } from '@/lib/types';
import { toast } from 'sonner';
import { Loader2, Download, Image as ImageIcon, Settings2 } from 'lucide-react';
import html2canvas from 'html2canvas';

export default function FlyerGenerator() {
  const [nominees, setNominees] = useState<Nominee[]>([]);
  const [selectedNominee, setSelectedNominee] = useState<Nominee | null>(null);
  const [bgImage, setBgImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const flyerRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  const [layout, setLayout] = useState({
    photo: { top: 31, height: 26, width: 62, borderRadius: 150 },
    category: { show: false, top: 22.5, fontSize: 24, color: '#ffffff' },
    name: { top: 62, fontSize: 32, color: '#102a43' },
    code: { top: 73, fontSize: 50, color: '#8b1515' }
  });

  useEffect(() => {
    async function load() {
      const { data } = await supabase.from('nominees').select('*, category:categories(*)').eq('is_active', true).order('name');
      if (data) setNominees(data as Nominee[]);
      setLoading(false);
    }
    load();
  }, []);

  const handleBgUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => setBgImage(event.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const downloadFlyer = async () => {
    if (!flyerRef.current || !selectedNominee || !bgImage) return;
    setGenerating(true);
    try {
      const canvas = await html2canvas(flyerRef.current, {
        scale: 2, useCORS: true, allowTaint: false, backgroundColor: null
      });
      const image = canvas.toDataURL('image/jpeg', 0.9);
      const link = document.createElement('a');
      link.href = image;
      link.download = `${selectedNominee.name.replace(/\s+/g, '_')}_Flyer.jpg`;
      link.click();
      toast.success('Flyer downloaded successfully!');
    } catch (err) {
      console.error(err);
      toast.error('Error generating flyer');
    }
    setGenerating(false);
  };

  if (loading) return <div className="p-20 text-center"><Loader2 className="w-8 h-8 text-gold-400 animate-spin mx-auto" /></div>;

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-dark-100">Automated Flyer Generator</h1>
        <p className="text-dark-400 text-sm">Upload your blank template, adjust the positions, and instantly generate flyers for any nominee.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Controls */}
        <div className="lg:col-span-5 space-y-6">
          <div className="glass-card p-6 space-y-4">
            <h2 className="font-bold text-lg text-gold-400 flex items-center gap-2"><ImageIcon className="w-5 h-5"/> 1. Setup Base</h2>
            <div>
              <label className="form-label">Blank Background Template</label>
              <input type="file" accept="image/*" onChange={handleBgUpload} className="form-input text-sm" />
            </div>
            <div>
              <label className="form-label">Select Nominee to Render</label>
              <select className="form-select" onChange={e => setSelectedNominee(nominees.find(n => n.id === e.target.value) || null)}>
                <option value="">-- Choose a Nominee --</option>
                {nominees.map(n => <option key={n.id} value={n.id}>{n.name} ({(n.category as any)?.name})</option>)}
              </select>
            </div>
          </div>

          {bgImage && selectedNominee && (
            <div className="glass-card p-6 space-y-6">
              <h2 className="font-bold text-lg text-gold-400 flex items-center gap-2"><Settings2 className="w-5 h-5"/> 2. Adjust Positions</h2>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-dark-800 pb-2">
                  <h3 className="text-sm font-bold text-dark-200">Category Text</h3>
                  <label className="flex items-center gap-2 text-xs text-dark-400 cursor-pointer">
                    <input type="checkbox" checked={layout.category.show} onChange={e => setLayout({...layout, category: {...layout.category, show: e.target.checked}})} className="accent-gold-500" />
                    Show Text
                  </label>
                </div>
                {layout.category.show && (
                  <div className="flex gap-4">
                    <div className="flex-1"><label className="text-xs text-dark-400">Position (Top %)</label><input type="range" min="0" max="100" step="0.5" value={layout.category.top} onChange={e => setLayout({...layout, category: {...layout.category, top: parseFloat(e.target.value)}})} className="w-full accent-gold-500" /></div>
                    <div className="w-24"><label className="text-xs text-dark-400">Size (px)</label><input type="number" value={layout.category.fontSize} onChange={e => setLayout({...layout, category: {...layout.category, fontSize: parseInt(e.target.value)}})} className="form-input !py-1 !px-2 text-xs" /></div>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <h3 className="text-sm font-bold text-dark-200 border-b border-dark-800 pb-2">Nominee Photo</h3>
                <div className="flex gap-4">
                  <div className="flex-1"><label className="text-xs text-dark-400">Position (Top %)</label><input type="range" min="0" max="100" step="0.5" value={layout.photo.top} onChange={e => setLayout({...layout, photo: {...layout.photo, top: parseFloat(e.target.value)}})} className="w-full accent-gold-500" /></div>
                  <div className="w-24"><label className="text-xs text-dark-400">Height %</label><input type="number" value={layout.photo.height} onChange={e => setLayout({...layout, photo: {...layout.photo, height: parseInt(e.target.value)}})} className="form-input !py-1 !px-2 text-xs" /></div>
                </div>
                <div className="flex gap-4">
                  <div className="flex-1"><label className="text-xs text-dark-400">Width %</label><input type="range" min="10" max="100" value={layout.photo.width} onChange={e => setLayout({...layout, photo: {...layout.photo, width: parseInt(e.target.value)}})} className="w-full accent-gold-500" /></div>
                  <div className="w-24"><label className="text-xs text-dark-400">Rounding</label><input type="number" value={layout.photo.borderRadius} onChange={e => setLayout({...layout, photo: {...layout.photo, borderRadius: parseInt(e.target.value)}})} className="form-input !py-1 !px-2 text-xs" /></div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-sm font-bold text-dark-200 border-b border-dark-800 pb-2">Nominee Name</h3>
                <div className="flex gap-4">
                  <div className="flex-1"><label className="text-xs text-dark-400">Position (Top %)</label><input type="range" min="0" max="100" step="0.5" value={layout.name.top} onChange={e => setLayout({...layout, name: {...layout.name, top: parseFloat(e.target.value)}})} className="w-full accent-gold-500" /></div>
                  <div className="w-24"><label className="text-xs text-dark-400">Size (px)</label><input type="number" value={layout.name.fontSize} onChange={e => setLayout({...layout, name: {...layout.name, fontSize: parseInt(e.target.value)}})} className="form-input !py-1 !px-2 text-xs" /></div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-sm font-bold text-dark-200 border-b border-dark-800 pb-2">Voting Code</h3>
                <div className="flex gap-4">
                  <div className="flex-1"><label className="text-xs text-dark-400">Position (Top %)</label><input type="range" min="0" max="100" step="0.5" value={layout.code.top} onChange={e => setLayout({...layout, code: {...layout.code, top: parseFloat(e.target.value)}})} className="w-full accent-gold-500" /></div>
                  <div className="w-24"><label className="text-xs text-dark-400">Size (px)</label><input type="number" value={layout.code.fontSize} onChange={e => setLayout({...layout, code: {...layout.code, fontSize: parseInt(e.target.value)}})} className="form-input !py-1 !px-2 text-xs" /></div>
                </div>
              </div>

            </div>
          )}
        </div>

        {/* Live Preview */}
        <div className="lg:col-span-7">
          <div className="sticky top-24">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-lg text-dark-100">Live Preview</h2>
              <button onClick={downloadFlyer} disabled={!bgImage || !selectedNominee || generating} className="gold-btn !py-2 !px-4 !text-sm flex items-center gap-2">
                {generating ? <Loader2 className="w-4 h-4 animate-spin"/> : <Download className="w-4 h-4"/>} Download Flyer
              </button>
            </div>
            
            <div className="bg-dark-800 rounded-xl border border-dark-700 p-4 flex items-center justify-center overflow-hidden" style={{ minHeight: '600px' }}>
              {!bgImage ? (
                <p className="text-dark-500 text-sm">Upload a background template to see preview</p>
              ) : !selectedNominee ? (
                <p className="text-dark-500 text-sm">Select a nominee to render</p>
              ) : (
                <div ref={flyerRef} className="relative mx-auto bg-white shadow-2xl" style={{ width: '100%', maxWidth: '500px', aspectRatio: '9/16' }}>
                  <img src={bgImage} alt="Background" className="absolute inset-0 w-full h-full object-cover z-0" crossOrigin="anonymous" />
                  
                  {layout.category.show && (
                    <div className="absolute left-0 right-0 text-center z-10" style={{ top: `${layout.category.top}%` }}>
                      <span style={{ fontSize: `${layout.category.fontSize}px`, color: layout.category.color, fontFamily: 'Arial, sans-serif', fontWeight: 800, textTransform: 'uppercase' }}>
                        {(selectedNominee.category as any)?.name}
                      </span>
                    </div>
                  )}

                  <div className="absolute z-10 overflow-hidden flex items-center justify-center bg-gray-200"
                    style={{ 
                      top: `${layout.photo.top}%`, left: `${(100 - layout.photo.width) / 2}%`, width: `${layout.photo.width}%`, height: `${layout.photo.height}%`,
                      borderTopLeftRadius: `${layout.photo.borderRadius}px`, borderTopRightRadius: `${layout.photo.borderRadius}px`, borderBottomLeftRadius: '10px', borderBottomRightRadius: '10px',
                    }}>
                    {selectedNominee.photo_url ? (
                      <img src={`/api/admin/proxy-image?url=${encodeURIComponent(selectedNominee.photo_url)}`} alt="Nominee" className="w-full h-full object-cover" crossOrigin="anonymous" />
                    ) : (
                      <span className="text-gray-400 text-sm">No Photo</span>
                    )}
                  </div>

                  <div className="absolute left-0 right-0 text-center z-10 px-4" style={{ top: `${layout.name.top}%` }}>
                    <span style={{ fontSize: `${layout.name.fontSize}px`, color: layout.name.color, fontFamily: 'Georgia, serif', fontWeight: 900, textTransform: 'uppercase' }}>{selectedNominee.name}</span>
                  </div>

                  <div className="absolute left-0 right-0 text-center z-10" style={{ top: `${layout.code.top}%` }}>
                    <span style={{ fontSize: `${layout.code.fontSize}px`, color: layout.code.color, fontFamily: 'Arial, sans-serif', fontWeight: 900 }}>{selectedNominee.code}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
