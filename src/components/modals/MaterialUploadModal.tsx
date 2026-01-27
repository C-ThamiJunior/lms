// src/components/modals/MaterialUploadModal.tsx
import React, { useState } from 'react';
import { X } from 'lucide-react';
import { Module, User } from '../../types/lms';

interface MaterialUploadModalProps {
  modules: Module[];
  currentUser: User;
  onDataMutated: () => void;
  onClose: () => void;
}

// Ensure this matches your backend port
const API_BASE_URL = 'https://b-t-backend-uc9w.onrender.com/api';

export const MaterialUploadModal: React.FC<MaterialUploadModalProps> = ({ modules, currentUser, onDataMutated, onClose }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    moduleId: '',
    type: 'pdf',
    url: ''
  });
  const [isUploading, setIsUploading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUploading(true);

    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error("No authentication token found");

      const payload = {
        title: formData.title,
        description: formData.description,
        moduleId: formData.moduleId,
        contentType: formData.type.toUpperCase(), 
        
        url: formData.url || 'http://placeholder-url.com/resource',
      };
      
      const response = await fetch(`${API_BASE_URL}/lessons`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) throw new Error('Failed to upload material');

      alert("Material uploaded successfully!");
      onDataMutated();
      onClose();
    } catch (error: any) {
      console.error("Upload error:", error);
      alert(`Error uploading: ${error.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4 overflow-hidden">
        <div className="flex justify-between items-center p-6 border-b border-gray-100">
          <h3 className="text-lg font-bold text-gray-800">Upload Content</h3>
          <button onClick={onClose}><X className="w-5 h-5 text-gray-400 hover:text-red-600" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Module</label>
              <select 
                className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                value={formData.moduleId}
                onChange={e => setFormData({...formData, moduleId: e.target.value})}
                required
              >
                  <option value="">Select Module...</option>
                  {modules.map(m => <option key={m.id} value={m.id}>{m.title}</option>)}
              </select>
          </div>
          
          <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Type</label>
              <select 
                className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                value={formData.type}
                onChange={e => setFormData({...formData, type: e.target.value})}
              >
                  <option value="pdf">PDF Document</option>
                  <option value="video">Video Link</option>
                  <option value="link">External Website</option>
              </select>
          </div>

          <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Title</label>
              <input 
                className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                value={formData.title}
                onChange={e => setFormData({...formData, title: e.target.value})}
                required
                placeholder="e.g., Lecture Notes Week 1"
              />
          </div>

          <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Resource URL</label>
              <input 
                className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                value={formData.url}
                onChange={e => setFormData({...formData, url: e.target.value})}
                placeholder="https://..."
              />
          </div>

          <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Description</label>
              <textarea 
                className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                value={formData.description}
                onChange={e => setFormData({...formData, description: e.target.value})}
                rows={3}
              />
          </div>
          <div className="flex justify-end pt-2">
              <button 
                type="submit" 
                disabled={isUploading}
                className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition shadow-sm font-medium disabled:opacity-50"
              >
                {isUploading ? 'Uploading...' : 'Upload'}
              </button>
          </div>
        </form>
      </div>
    </div>
  );
};