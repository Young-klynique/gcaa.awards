'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Category } from '@/lib/types';
import { toast } from 'sonner';
import { Plus, Edit2, Trash2, Loader2, Check, X } from 'lucide-react';

export default function AdminCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Form states
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isActive, setIsActive] = useState(true);
  
  const supabase = createClient();

  const loadCategories = async () => {
    setLoading(true);
    const { data } = await supabase.from('categories').select('*').order('display_order', { ascending: true });
    if (data) setCategories(data);
    setLoading(false);
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const resetForm = () => {
    setName(''); setDescription(''); setIsActive(true);
    setIsAdding(false); setEditingId(null);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;

    if (editingId) {
      const { error } = await supabase.from('categories').update({ name, description, is_active: isActive }).eq('id', editingId);
      if (error) { toast.error(error.message); return; }
      toast.success('Category updated');
    } else {
      const { error } = await supabase.from('categories').insert({ name, description, is_active: isActive, display_order: categories.length });
      if (error) { toast.error(error.message); return; }
      toast.success('Category added');
    }
    
    resetForm();
    loadCategories();
  };

  const startEdit = (cat: Category) => {
    setEditingId(cat.id);
    setName(cat.name);
    setDescription(cat.description || '');
    setIsActive(cat.is_active);
    setIsAdding(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure? This will also delete all nominations and nominees under this category.')) return;
    const { error } = await supabase.from('categories').delete().eq('id', id);
    if (error) { toast.error(error.message); return; }
    toast.success('Category deleted');
    loadCategories();
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-dark-100">Award Categories</h1>
          <p className="text-dark-400 text-sm">Manage categories that people can be nominated for.</p>
        </div>
        {!isAdding && (
          <button onClick={() => setIsAdding(true)} className="gold-btn flex items-center gap-2 !py-2 !px-4 !text-xs">
            <Plus className="w-4 h-4" /> Add Category
          </button>
        )}
      </div>

      {isAdding && (
        <div className="glass-card p-6 border border-gold-500/30 mb-8">
          <div className="flex justify-between items-center mb-4">
             <h3 className="text-lg font-bold text-dark-100">{editingId ? 'Edit Category' : 'New Category'}</h3>
             <button onClick={resetForm} className="text-dark-400 hover:text-dark-200"><X className="w-5 h-5" /></button>
          </div>
          <form onSubmit={handleSave} className="space-y-4">
            <div><label className="form-label">Category Name *</label><input required className="form-input" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Best Male Vocalist" /></div>
            <div><label className="form-label">Description (optional)</label><textarea className="form-input" value={description} onChange={e => setDescription(e.target.value)} rows={2} /></div>
            <div className="flex items-center gap-2">
               <input type="checkbox" id="isActive" checked={isActive} onChange={e => setIsActive(e.target.checked)} className="w-4 h-4 accent-gold-500 rounded border-dark-600 bg-dark-800" />
               <label htmlFor="isActive" className="text-sm text-dark-200">Active (Visible to public)</label>
            </div>
            <div className="flex justify-end pt-2">
               <button type="submit" className="gold-btn !py-2 !px-6">Save</button>
            </div>
          </form>
        </div>
      )}

      <div className="glass-card border border-dark-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Description</th>
                <th>Status</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={4} className="text-center py-8"><Loader2 className="w-6 h-6 text-gold-400 animate-spin mx-auto" /></td></tr>
              ) : categories.length === 0 ? (
                <tr><td colSpan={4} className="text-center py-8 text-dark-400">No categories found. Create one to get started.</td></tr>
              ) : (
                categories.map(cat => (
                  <tr key={cat.id}>
                    <td className="font-medium text-dark-100">{cat.name}</td>
                    <td className="text-dark-400 max-w-xs truncate">{cat.description || '-'}</td>
                    <td>
                      <span className={`badge ${cat.is_active ? 'badge-approved' : 'badge-pending'}`}>
                        {cat.is_active ? 'Active' : 'Hidden'}
                      </span>
                    </td>
                    <td>
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => startEdit(cat)} className="p-2 text-dark-400 hover:text-gold-400 transition-colors bg-dark-800 rounded-lg"><Edit2 className="w-4 h-4" /></button>
                        <button onClick={() => handleDelete(cat.id)} className="p-2 text-dark-400 hover:text-red-400 transition-colors bg-dark-800 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                      </div>
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
