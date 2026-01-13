import React, { useState } from 'react';
import { X } from 'lucide-react';
import { Course } from '../../types/lms';

interface ModuleCreationModalProps {
  courses: Course[];
  onDataMutated: () => void;
  onClose: () => void;
}

const API_BASE_URL = 'https://b-t-backend-production-1580.up.railway.app/api';

export const ModuleCreationModal: React.FC<ModuleCreationModalProps> = ({ courses, onDataMutated, onClose }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    courseId: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/modules`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
            title: formData.title,
            description: formData.description,
            courseId: Number(formData.courseId)
        })
      });

      if (!response.ok) throw new Error('Failed to create module');

      alert("Module created successfully!");
      onDataMutated();
      onClose();
    } catch (error: any) {
      alert(`Error: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
        <div className="flex justify-between items-center p-6 border-b">
          <h3 className="text-lg font-bold text-gray-800">Create New Module</h3>
          <button onClick={onClose}><X className="w-5 h-5 text-gray-400 hover:text-red-600" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Link to Course</label>
              <select 
                className="w-full p-2.5 border border-gray-300 rounded focus:ring-2 focus:ring-red-500"
                value={formData.courseId}
                onChange={e => setFormData({...formData, courseId: e.target.value})}
                required
              >
                  <option value="">Select Course...</option>
                  {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
              </select>
          </div>
          <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Module Title</label>
              <input 
                className="w-full p-2.5 border border-gray-300 rounded focus:ring-2 focus:ring-red-500"
                value={formData.title}
                onChange={e => setFormData({...formData, title: e.target.value})}
                required
                placeholder="e.g. Introduction to React"
              />
          </div>
          <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Description</label>
              <textarea 
                className="w-full p-2.5 border border-gray-300 rounded focus:ring-2 focus:ring-red-500"
                value={formData.description}
                onChange={e => setFormData({...formData, description: e.target.value})}
                rows={3}
                required
              />
          </div>
          <div className="flex justify-end pt-2">
              <button 
                type="submit" 
                disabled={isSubmitting}
                className="bg-red-600 text-white px-6 py-2 rounded hover:bg-red-700 transition disabled:opacity-50"
              >
                {isSubmitting ? 'Saving...' : 'Create Module'}
              </button>
          </div>
        </form>
      </div>
    </div>
  );
};