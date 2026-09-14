'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Nominee, Category } from '@/lib/types';
import { toast } from 'sonner';
import { Loader2, Edit2, Trash2, User, Trophy, Search, X } from 'lucide-react';

export default function AdminNominees() {
  const [nominees, setNominees] = useState<Nominee[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCat, setFilterCat] = useState('all');
  
  const [editingNominee, setEditingNominee] = useState<Nominee | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const supabase = createClient();

  const loadData = async () => {
    setLoading(true);
    const [nomRes, catRes] = await Promise.all([
      supabase.from('nominees').select('*, category:categories(name)').order('vote_count', { ascending: false }),
      supabase.from('categories').select('*').eq('is_active', true)
    ]);
    if (nomRes.data) setNominees(nomRes.data as Nominee[]);
    if (catRes.data) setCategories(catRes.data);
    setLoading(false);
  };

  useEffect(() => { 
    // eslint-disable-next-line
    loadData(); 
  }, []);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingNominee) return;
    setUploading(true);

    let photo_url = editingNominee.photo_url;

    // Handle photo upload
    if (photoFile) {
      const fileExt = photoFile.name.split('.').pop();
      const fileName = `${editingNominee.id}-${Math.random()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage.from('nominee-photos').upload(fileName, photoFile);
      if (uploadError) { toast.error('Error uploading photo'); setUploading(false); return; }
      
      const { data } = supabase.storage.from('nominee-photos').getPublicUrl(fileName);
      photo_url = data.publicUrl;
    }

    const { error } = await supabase.from('nominees').update({
      name: editingNominee.name,
      category_id: editingNominee.category_id,
      bio: editingNominee.bio,
      is_active: editingNominee.is_active,
      vote_count: editingNominee.vote_count,
      photo_url
    }).eq('id', editingNominee.id);

    setUploading(false);
    if (error) { toast.error(error.message); return; }
    
    toast.success('Nominee updated');
    setEditingNominee(null);
    setPhotoFile(null);
    loadData();
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this nominee? This cannot be undone.')) return;
    setUploading(true);
    const { error } = await supabase.from('nominees').delete().eq('id', id);
    setUploading(false);
    
    if (error) { toast.error(error.message); return; }
    
    toast.success('Nominee deleted successfully');
    setEditingNominee(null);
    loadData();
  };

  const filteredNominees = nominees.filter(n => {
    const matchCat = filterCat === 'all' || n.category_id === filterCat;
    const matchSearch = n.name.toLowerCase().includes(searchQuery.toLowerCase()) || n.code.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <div>
      <div className="flex flex-col md:flex-row justify-between md:items-end gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-dark-100">Official Nominees</h1>
          <p className="text-dark-400 text-sm">Manage verified candidates on the voting platform.</p>
        </div>
        <div className="flex gap-3">
           <div className="relative">
             <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-500" />
             <input className="form-input pl-10 text-sm py-2" placeholder="Search by name or code..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
           </div>
           <select className="form-select text-sm py-2 w-40" value={filterCat} onChange={e => setFilterCat(e.target.value)}>
             <option value="all">All Categories</option>
             {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
           </select>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {loading ? (
           <div className="col-span-full py-20 text-center"><Loader2 className="w-8 h-8 text-gold-400 animate-spin mx-auto" /></div>
        ) : filteredNominees.map(n => (
          <div key={n.id} className="glass-card overflow-hidden flex flex-col">
             <div className="aspect-square bg-dark-800 relative">
               {n.photo_url ? <img src={n.photo_url} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><User className="w-16 h-16 text-dark-600" /></div>}
               <div className="absolute top-2 right-2 badge badge-pending">{n.code}</div>
               {!n.is_active && <div className="absolute top-2 left-2 badge badge-failed">Hidden</div>}
             </div>
             <div className="p-4 flex-1 flex flex-col">
                <h3 className="font-bold text-dark-100 truncate">{n.name}</h3>
                <p className="text-xs text-dark-400 truncate mb-3">{(n.category as unknown as Category)?.name}</p>
                <div className="mt-auto flex items-center justify-between border-t border-dark-800/50 pt-3">
                   <div className="flex items-center gap-1 text-gold-400 font-bold"><Trophy className="w-4 h-4" /> {n.vote_count}</div>
                   <button onClick={() => { setEditingNominee(n); setPhotoFile(null); }} className="p-2 bg-dark-800 hover:bg-dark-700 text-dark-200 rounded-lg transition-colors"><Edit2 className="w-4 h-4" /></button>
                </div>
             </div>
          </div>
        ))}
      </div>

      {/* Edit Modal */}
      {editingNominee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
           <div className="glass-card p-6 max-w-md w-full">
              <div className="flex justify-between items-center mb-6">
                 <h2 className="text-xl font-bold text-dark-100">Edit Nominee: {editingNominee.code}</h2>
                 <button onClick={() => setEditingNominee(null)} className="text-dark-400 hover:text-dark-200"><X className="w-5 h-5" /></button>
              </div>
              <form onSubmit={handleUpdate} className="space-y-4">
                 <div>
                    <label className="form-label">Photo</label>
                    <input type="file" accept="image/*" onChange={e => setPhotoFile(e.target.files?.[0] || null)} className="form-input text-sm file:mr-4 file:py-1 file:px-3 file:rounded-full file:border-0 file:text-xs file:bg-gold-500 file:text-dark-950 hover:file:bg-gold-400" />
                 </div>
                 <div><label className="form-label">Name</label><input required className="form-input" value={editingNominee.name} onChange={e => setEditingNominee({...editingNominee, name: e.target.value})} /></div>
                 <div><label className="form-label">Category</label>
                    <select className="form-select" value={editingNominee.category_id} onChange={e => setEditingNominee({...editingNominee, category_id: e.target.value})}>
                      {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                 </div>
                 <div>
                    <label className="form-label">Total Votes (Manual Adjust)</label>
                    <input type="number" required min="0" className="form-input" value={editingNominee.vote_count} onChange={e => setEditingNominee({...editingNominee, vote_count: parseInt(e.target.value) || 0})} />
                    <p className="text-[10px] text-dark-400 mt-1">Use this to recover dropped votes.</p>
                 </div>
                 <div><label className="form-label">Bio / Reason</label><textarea className="form-input" rows={3} value={editingNominee.bio || ''} onChange={e => setEditingNominee({...editingNominee, bio: e.target.value})} /></div>
                 <div className="flex items-center gap-2 pt-2">
                   <input type="checkbox" id="isActiveNom" checked={editingNominee.is_active} onChange={e => setEditingNominee({...editingNominee, is_active: e.target.checked})} className="w-4 h-4 accent-gold-500 rounded bg-dark-800" />
                   <label htmlFor="isActiveNom" className="text-sm text-dark-200">Active (Visible on voting page)</label>
                 </div>
                 <div className="flex gap-3 mt-4">
                   <button type="button" onClick={() => handleDelete(editingNominee.id)} disabled={uploading} className="py-2 px-4 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 font-medium transition-colors flex items-center justify-center gap-2">
                     <Trash2 className="w-4 h-4" /> Delete
                   </button>
                   <button type="submit" disabled={uploading} className="gold-btn flex-1">{uploading ? 'Saving...' : 'Save Changes'}</button>
                 </div>
              </form>
           </div>
        </div>
      )}
    </div>
  );
}
