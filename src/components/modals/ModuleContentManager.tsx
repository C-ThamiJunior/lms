import React, { useState, useEffect } from 'react';
import { X, Edit2, Trash2, Plus, FileText, Video, Link as LinkIcon, Save, ExternalLink } from 'lucide-react';
import { Module, User, StudyMaterial } from '../../types/lms';

interface ModuleContentManagerProps {
  module: Module;
  materials: StudyMaterial[]; 
  currentUser: User | null; // Allow null for safety
  onDataMutated: () => void;
  onClose: () => void;
}

const API_BASE_URL = 'https://b-t-backend-production-1580.up.railway.app/api';

export const ModuleContentManager: React.FC<ModuleContentManagerProps> = ({ module, materials, currentUser, onDataMutated, onClose }) => {
  // Filter materials for THIS module only
  const moduleMaterials = materials.filter(m => String(m.moduleId) === String(module.id));

  const [view, setView] = useState<'list' | 'form'>('list');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'PDF',
    url: ''
  });

  // Reset form when switching views
  const handleAddNew = () => {
    setEditingId(null);
    setFormData({ title: '', description: '', type: 'PDF', url: '' });
    setView('form');
  };

  const handleEdit = (material: StudyMaterial) => {
    setEditingId(material.id);
    setFormData({
      title: material.title,
      description: material.description || '',
      type: material.contentType || 'PDF', 
      url: material.url || ''
    });
    setView('form');
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this lesson?")) return;
    try {
      const token = localStorage.getItem('token');
      await fetch(`${API_BASE_URL}/lessons/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      onDataMutated();
    } catch (e) { alert("Failed to delete"); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const token = localStorage.getItem('token');

    try {
      const payload = {
        title: formData.title,
        description: formData.description,
        moduleId: module.id,
        contentType: formData.type.toUpperCase(), 
        url: formData.url,
        orderIndex: 0
      };

      const url = editingId 
        ? `${API_BASE_URL}/lessons/${editingId}`
        : `${API_BASE_URL}/lessons`;
      
      const method = editingId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error("Failed to save");

      onDataMutated();
      setView('list');
    } catch (error: any) {
      alert("Error saving: " + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-gray-50">
          <div>
            <h3 className="text-lg font-bold text-gray-900">
              {view === 'list' ? `Manage: ${module.title}` : (editingId ? 'Edit Lesson' : 'Add New Lesson')}
            </h3>
            {view === 'list' && <p className="text-sm text-gray-500">{moduleMaterials.length} lessons found</p>}
          </div>
          <button onClick={onClose}><X className="w-5 h-5 text-gray-400 hover:text-red-600" /></button>
        </div>

        {/* LIST VIEW */}
        {view === 'list' && (
          <div className="p-6 overflow-y-auto flex-1">
            <button onClick={handleAddNew} className="w-full mb-6 py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-red-500 hover:text-red-600 font-medium flex items-center justify-center gap-2 transition-all">
              <Plus className="w-5 h-5" /> Add New Content
            </button>

            <div className="space-y-3">
              {moduleMaterials.map(mat => (
                <div key={mat.id} className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg hover:shadow-sm transition">
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-red-50 rounded text-red-600">
                      {mat.contentType === 'VIDEO' ? <Video size={20}/> : mat.contentType === 'LINK' ? <LinkIcon size={20}/> : <FileText size={20}/>}
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-800">{mat.title}</h4>
                      <p className="text-xs text-gray-500 truncate max-w-xs">{mat.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {mat.url && (
                        <a href={mat.url} target="_blank" rel="noreferrer" className="p-2 text-gray-400 hover:text-blue-600" title="View">
                            <ExternalLink size={18} />
                        </a>
                    )}
                    <button onClick={() => handleEdit(mat)} className="p-2 text-gray-400 hover:text-yellow-600" title="Edit">
                      <Edit2 size={18} />
                    </button>
                    <button onClick={() => handleDelete(mat.id)} className="p-2 text-gray-400 hover:text-red-600" title="Delete">
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              ))}
              {moduleMaterials.length === 0 && <p className="text-center text-gray-400 py-4">No lessons yet.</p>}
            </div>
          </div>
        )}

        {/* FORM VIEW (Create / Edit) */}
        {view === 'form' && (
          <form onSubmit={handleSubmit} className="p-6 overflow-y-auto flex-1 space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Type</label>
              <select 
                className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-red-500"
                value={formData.type}
                onChange={e => setFormData({...formData, type: e.target.value})}
              >
                  <option value="PDF">PDF / Document</option>
                  <option value="VIDEO">Video</option>
                  <option value="LINK">External Link</option>
                  <option value="TEXT">Text Content</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Title</label>
              <input 
                className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-red-500"
                value={formData.title}
                onChange={e => setFormData({...formData, title: e.target.value})}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Resource URL</label>
              <input 
                className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-red-500"
                value={formData.url}
                onChange={e => setFormData({...formData, url: e.target.value})}
                placeholder="https://..."
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Description</label>
              <textarea 
                className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-red-500"
                value={formData.description}
                onChange={e => setFormData({...formData, description: e.target.value})}
                rows={4}
              />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 mt-4">
              <button 
                type="button" 
                onClick={() => setView('list')}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                Cancel
              </button>
              <button 
                type="submit" 
                disabled={isSubmitting}
                className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 flex items-center gap-2"
              >
                {isSubmitting ? 'Saving...' : <><Save size={18}/> Save Lesson</>}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};