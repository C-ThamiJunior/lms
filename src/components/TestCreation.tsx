import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, CheckCircle, Clock, Save, AlertCircle } from 'lucide-react';
import { Course, Module, User, Test } from '../types/lms';

interface TestCreationProps {
  courses: Course[];
  modules: Module[];
  currentUser: User | null;
  initialData?: Test | null;
  onCreateTest: (data: any) => void;
  onClose: () => void;
}

const API_BASE_URL = 'https://b-t-backend-production-1580.up.railway.app/api';

export const TestCreation: React.FC<TestCreationProps> = ({ modules, onClose, onCreateTest, initialData }) => {
  const isEditing = !!initialData;
  const [loading, setLoading] = useState(false);

  // Step 1: Basic Info
  const [basicInfo, setBasicInfo] = useState({
    title: '',
    description: '',
    moduleId: '',
    timed: false,
    timeLimitInMinutes: 0
  });

  // Step 2: Questions
  const [questions, setQuestions] = useState<any[]>([]);
  
  // Load initial data if editing
  useEffect(() => {
    if (initialData) {
      setBasicInfo({
        title: initialData.title,
        description: initialData.description || '',
        moduleId: String(initialData.moduleId || ''),
        timed: initialData.timed || false,
        timeLimitInMinutes: initialData.timeLimitInMinutes || 0
      });
      fetchQuestions(initialData.id);
    }
  }, [initialData]);

  const fetchQuestions = async (quizId: string) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/quizzes/${quizId}/questions`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if(res.ok) {
        const data = await res.json();
        setQuestions(data);
      }
    } catch (e) { console.error("Failed to load questions", e); }
  };
  
  // Current Question Form State
  const [currentQ, setCurrentQ] = useState({
    text: '',
    questionType: 'MULTIPLE_CHOICE',
    options: ['Option 1', 'Option 2'],
    correctAnswer: '',
    points: 1
  });

  const addOption = () => setCurrentQ({ ...currentQ, options: [...currentQ.options, `Option ${currentQ.options.length + 1}`] });
  
  const updateOption = (index: number, val: string) => {
    const newOpts = [...currentQ.options];
    newOpts[index] = val;
    setCurrentQ({ ...currentQ, options: newOpts });
  };

  const removeOption = (index: number) => {
    const newOpts = currentQ.options.filter((_, i) => i !== index);
    setCurrentQ({ ...currentQ, options: newOpts });
  };

  const saveQuestion = () => {
    if (!currentQ.text || !currentQ.correctAnswer) return alert("Please fill in question text and correct answer");
    
    // Add to list
    setQuestions([...questions, { ...currentQ, id: Date.now() }]); 
    
    // Reset form
    setCurrentQ({
      text: '',
      questionType: 'MULTIPLE_CHOICE',
      options: ['Option 1', 'Option 2'],
      correctAnswer: '',
      points: 1
    });
  };

  const removeQuestion = (id: number) => {
    setQuestions(questions.filter(q => q.id !== id));
  };

  const handleSubmit = async () => {
    if (!basicInfo.moduleId && !isEditing) return alert("Please select a module");
    if (questions.length === 0) return alert("Please add at least one question");
    if (!basicInfo.title) return alert("Please enter a test title");

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      
      // ✅ Construct Payload strictly matching Backend DTO
      const payload = {
        title: basicInfo.title,
        description: basicInfo.description,
        moduleId: parseInt(basicInfo.moduleId), // Ensure Number
        timed: basicInfo.timed,
        timeLimitInMinutes: basicInfo.timed ? Number(basicInfo.timeLimitInMinutes) : 0,
        questions: questions.map(q => ({
          text: q.text,
          questionType: q.questionType,
          options: q.questionType === 'MULTIPLE_CHOICE' ? q.options : [],
          correctAnswer: q.correctAnswer,
          points: Number(q.points)
        }))
      };

      const url = isEditing ? `${API_BASE_URL}/quizzes/${initialData.id}` : `${API_BASE_URL}/quizzes`;
      const method = isEditing ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const err = await res.json(); 
        throw new Error(err.message || 'Failed to save test');
      }

      alert(isEditing ? "Test Updated Successfully!" : "Test Created Successfully!");
      onCreateTest(await res.json());
      onClose();

    } catch (error: any) {
      console.error(error);
      alert(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl h-[90vh] flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200 bg-gray-50">
          <h2 className="text-xl font-bold text-gray-800">{isEditing ? 'Edit Assessment' : 'Create New Assessment'}</h2>
          <button onClick={onClose}><X className="w-5 h-5 text-gray-500 hover:text-red-600" /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* LEFT COLUMN: Basic Info & Current Question Form */}
            <div className="space-y-6">
              
              {/* 1. Quiz Settings */}
              <div className="bg-blue-50 p-5 rounded-lg border border-blue-100 space-y-4">
                <h3 className="font-bold text-blue-900 flex items-center gap-2">
                  <span className="bg-blue-200 text-blue-800 w-6 h-6 rounded-full flex items-center justify-center text-xs">1</span>
                  Assessment Details
                </h3>
                
                {!isEditing && (
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Module <span className="text-red-500">*</span></label>
                    <select 
                      className="w-full p-2 border rounded bg-white focus:ring-2 focus:ring-blue-500"
                      value={basicInfo.moduleId}
                      onChange={e => setBasicInfo({...basicInfo, moduleId: e.target.value})}
                    >
                      <option value="">-- Select Module --</option>
                      {modules.map(m => <option key={m.id} value={m.id}>{m.title}</option>)}
                    </select>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Title <span className="text-red-500">*</span></label>
                  <input className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500" 
                    value={basicInfo.title} onChange={e => setBasicInfo({...basicInfo, title: e.target.value})} placeholder="e.g. Mid-Term Exam" />
                </div>
                
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Description</label>
                  <textarea className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500" rows={2}
                    value={basicInfo.description} onChange={e => setBasicInfo({...basicInfo, description: e.target.value})} />
                </div>

                <div className="flex items-center gap-4 bg-white p-3 rounded border border-blue-100">
                   <label className="flex items-center gap-2 text-sm font-medium text-gray-700 cursor-pointer">
                      <input type="checkbox" checked={basicInfo.timed} onChange={e => setBasicInfo({...basicInfo, timed: e.target.checked})} className="w-4 h-4 text-blue-600 rounded"/>
                      Timed Quiz?
                   </label>
                   {basicInfo.timed && (
                     <div className="flex items-center gap-2 ml-auto">
                        <Clock className="w-4 h-4 text-gray-500" />
                        <input type="number" className="w-20 p-1 border rounded" value={basicInfo.timeLimitInMinutes} onChange={e => setBasicInfo({...basicInfo, timeLimitInMinutes: parseInt(e.target.value)})} />
                        <span className="text-sm text-gray-500">mins</span>
                     </div>
                   )}
                </div>
              </div>

              {/* 2. Add Question Form */}
              <div className="bg-gray-50 p-5 rounded-lg border border-gray-200 space-y-4">
                <div className="flex justify-between items-center border-b border-gray-200 pb-2">
                    <h3 className="font-bold text-gray-800 flex items-center gap-2">
                      <span className="bg-gray-200 text-gray-800 w-6 h-6 rounded-full flex items-center justify-center text-xs">2</span>
                      Add Question
                    </h3>
                </div>

                <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Question Text <span className="text-red-500">*</span></label>
                    <textarea 
                      className="w-full p-3 border rounded focus:ring-2 focus:ring-gray-500"
                      placeholder="Enter question text here..."
                      rows={2}
                      value={currentQ.text}
                      onChange={e => setCurrentQ({...currentQ, text: e.target.value})}
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                   <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Type</label>
                      <select className="w-full p-2 border rounded bg-white" value={currentQ.questionType} onChange={e => setCurrentQ({...currentQ, questionType: e.target.value, correctAnswer: ''})}>
                          <option value="MULTIPLE_CHOICE">Multiple Choice</option>
                          <option value="TRUE_FALSE">True / False</option>
                          <option value="SHORT_ANSWER">Short Answer</option>
                      </select>
                   </div>
                   <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Points</label>
                      <input type="number" className="w-full p-2 border rounded" value={currentQ.points} onChange={e => setCurrentQ({...currentQ, points: parseInt(e.target.value)})} />
                   </div>
                </div>

                {currentQ.questionType === 'MULTIPLE_CHOICE' && (
                  <div className="space-y-2 bg-white p-3 rounded border border-gray-200">
                    <label className="block text-xs font-bold text-gray-500 uppercase">Options</label>
                    {currentQ.options.map((opt, idx) => (
                      <div key={idx} className="flex gap-2">
                        <input className="flex-1 p-2 border rounded text-sm" value={opt} onChange={e => updateOption(idx, e.target.value)} />
                        <button onClick={() => removeOption(idx)} className="text-red-400 hover:text-red-600"><X size={16}/></button>
                      </div>
                    ))}
                    <button onClick={addOption} className="text-xs text-blue-600 font-medium hover:underline flex items-center gap-1">
                      <Plus size={12}/> Add Option
                    </button>
                  </div>
                )}

                <div>
                   <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Correct Answer <span className="text-red-500">*</span></label>
                   {currentQ.questionType === 'MULTIPLE_CHOICE' ? (
                      <select className="w-full p-2 border rounded" value={currentQ.correctAnswer} onChange={e => setCurrentQ({...currentQ, correctAnswer: e.target.value})}>
                          <option value="">-- Select Correct Option --</option>
                          {currentQ.options.map((opt, idx) => (
                             opt && <option key={idx} value={opt}>{opt}</option>
                          ))}
                      </select>
                   ) : currentQ.questionType === 'TRUE_FALSE' ? (
                      <select className="w-full p-2 border rounded" value={currentQ.correctAnswer} onChange={e => setCurrentQ({...currentQ, correctAnswer: e.target.value})}>
                          <option value="">-- Select --</option>
                          <option value="TRUE">True</option>
                          <option value="FALSE">False</option>
                      </select>
                   ) : (
                      <input className="w-full p-2 border rounded" placeholder="Exact text match" value={currentQ.correctAnswer} onChange={e => setCurrentQ({...currentQ, correctAnswer: e.target.value})} />
                   )}
                </div>

                <button onClick={saveQuestion} className="w-full bg-gray-800 text-white py-2 rounded hover:bg-black transition flex justify-center items-center gap-2">
                   <Plus size={16} /> Add to Test
                </button>
              </div>

            </div>

            {/* RIGHT COLUMN: Question Preview List */}
            <div className="border-l border-gray-200 pl-8 flex flex-col h-full">
               <div className="flex justify-between items-center mb-4">
                 <h3 className="font-bold text-gray-800">Questions Preview</h3>
                 <span className="text-xs font-semibold bg-gray-100 text-gray-600 px-2 py-1 rounded">{questions.length} Questions</span>
               </div>
               
               <div className="flex-1 overflow-y-auto space-y-3 pr-2">
                  {questions.length === 0 && (
                    <div className="text-center py-12 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                      <AlertCircle className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                      <p className="text-gray-400 italic text-sm">No questions added yet.<br/>Use the form on the left.</p>
                    </div>
                  )}
                  
                  {questions.map((q, idx) => (
                    <div key={q.id || idx} className="p-4 border rounded-lg bg-white shadow-sm hover:border-blue-300 transition relative group">
                        <button onClick={() => removeQuestion(q.id)} className="absolute top-2 right-2 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition"><Trash2 size={16}/></button>
                        <div className="flex gap-3">
                           <span className="font-bold text-gray-300 text-lg">Q{idx+1}</span>
                           <div className="flex-1">
                              <p className="font-medium text-gray-800 text-sm mb-1">{q.text}</p>
                              <div className="flex flex-wrap gap-2 text-xs text-gray-500">
                                 <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded border border-blue-100">{q.questionType.replace('_', ' ')}</span>
                                 <span className="bg-green-50 text-green-700 px-2 py-0.5 rounded border border-green-100">Ans: {q.correctAnswer}</span>
                                 <span className="ml-auto font-semibold">{q.points} pts</span>
                              </div>
                           </div>
                        </div>
                    </div>
                  ))}
               </div>

               <div className="pt-6 mt-4 border-t border-gray-100">
                  <button 
                    onClick={handleSubmit} 
                    disabled={loading}
                    className="w-full bg-red-600 text-white py-3 rounded-xl font-bold hover:bg-red-700 shadow-lg hover:shadow-xl transition-all flex justify-center items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                     {loading ? 'Saving...' : <><CheckCircle size={20} /> {isEditing ? 'Save Changes' : 'Create Assessment'}</>}
                  </button>
               </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};