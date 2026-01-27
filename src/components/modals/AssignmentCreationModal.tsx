import React, { useState } from 'react';
import axios from 'axios';
import { X, Save, Calendar, FileText, UploadCloud } from 'lucide-react';
import { Course, Module, User } from '../../types/lms';

interface AssignmentCreationModalProps {
    courses: Course[];
    modules: Module[];
    currentUser: User | null;
    onClose: () => void;
    onCreated: () => void;
}

const API_BASE_URL = 'https://b-t-backend-uc9w.onrender.com/api';

export const AssignmentCreationModal: React.FC<AssignmentCreationModalProps> = ({ 
    courses, modules, currentUser, onClose, onCreated 
}) => {
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        courseId: '',
        moduleId: '',
        dueDate: '',
        totalMarks: 100
    });
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);

    const filteredModules = modules.filter(m => String(m.courseId) === String(formData.courseId));

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setSelectedFile(e.target.files[0]);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentUser) return;
        setLoading(true);

        try {
            // ✅ Use FormData to send text + file
            const data = new FormData();
            data.append('title', formData.title);
            data.append('description', formData.description);
            data.append('courseId', formData.courseId);
            data.append('moduleId', formData.moduleId);
            data.append('facilitatorId', String(currentUser.id));
            data.append('dueDate', formData.dueDate);
            data.append('totalMarks', String(formData.totalMarks));
            
            if (selectedFile) {
                data.append('file', selectedFile);
            }

            await axios.post(`${API_BASE_URL}/assignments`, data, {
                headers: { 
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'multipart/form-data' // Important!
                }
            });
            
            alert('Assignment created successfully!');
            onCreated();
        } catch (error) {
            console.error("Error creating assignment:", error);
            alert('Failed to create assignment. Please check the form.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
                
                <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-gray-50">
                    <div>
                        <h3 className="text-xl font-bold text-gray-900">Create New Assignment</h3>
                        <p className="text-sm text-gray-500">Set tasks and attach files</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition text-gray-500">
                        <X size={20}/>
                    </button>
                </div>

                <div className="p-6 overflow-y-auto">
                    <form id="assignment-form" onSubmit={handleSubmit} className="space-y-5">
                        
                        {/* Title */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Title</label>
                            <input type="text" required className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 outline-none" placeholder="e.g., Final Project" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
                        </div>

                        {/* Course & Module */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Course</label>
                                <select required className="w-full p-3 border border-gray-300 rounded-lg bg-white" value={formData.courseId} onChange={e => setFormData({...formData, courseId: e.target.value, moduleId: ''})}>
                                    <option value="">Select Course</option>
                                    {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Module</label>
                                <select required className="w-full p-3 border border-gray-300 rounded-lg bg-white" value={formData.moduleId} onChange={e => setFormData({...formData, moduleId: e.target.value})} disabled={!formData.courseId}>
                                    <option value="">Select Module</option>
                                    {filteredModules.map(m => <option key={m.id} value={m.id}>{m.title}</option>)}
                                </select>
                            </div>
                        </div>

                        {/* Description */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Instructions</label>
                            <textarea required rows={4} className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 outline-none" placeholder="Instructions..." value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
                        </div>

                        {/* File Upload - NEW */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Attach PDF (Optional)</label>
                            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-red-500 transition-colors cursor-pointer bg-gray-50">
                                <input 
                                    type="file" 
                                    accept="application/pdf" 
                                    onChange={handleFileChange}
                                    className="hidden" 
                                    id="file-upload"
                                />
                                <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center justify-center gap-2">
                                    <UploadCloud className="w-8 h-8 text-gray-400"/>
                                    <span className="text-sm text-gray-600">
                                        {selectedFile ? selectedFile.name : "Click to upload PDF"}
                                    </span>
                                </label>
                            </div>
                        </div>

                        {/* Date & Marks */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Due Date</label>
                                <input type="datetime-local" required className="w-full p-3 border border-gray-300 rounded-lg" value={formData.dueDate} onChange={e => setFormData({...formData, dueDate: e.target.value})} />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Total Marks</label>
                                <input type="number" required min="1" className="w-full p-3 border border-gray-300 rounded-lg" value={formData.totalMarks} onChange={e => setFormData({...formData, totalMarks: Number(e.target.value)})} />
                            </div>
                        </div>
                    </form>
                </div>

                <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
                    <button onClick={onClose} className="px-5 py-2.5 text-gray-600 font-medium hover:bg-gray-200 rounded-lg transition">Cancel</button>
                    <button form="assignment-form" disabled={loading} className="px-5 py-2.5 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition flex items-center gap-2 disabled:opacity-50">
                        {loading ? 'Creating...' : <><Save size={18}/> Create</>}
                    </button>
                </div>
            </div>
        </div>
    );
};