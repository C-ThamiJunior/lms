import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import {
  User, Course, Module, StudyMaterial, Test, Assignment, 
} from '../types/lms';
import {
  BookOpen, Plus, Upload, FileText, Users, Award, LogOut, CheckCircle, ExternalLink, Edit2, Video, Link as LinkIcon, Trash2, Clock, X, ChevronRight
} from 'lucide-react';

// Sub-components
import { TestCreation } from './TestCreation'; 
import { ModuleContentManager } from './modals/ModuleContentManager';
import { GradingCenter } from './dashboard/GradingCenter';
import { ModuleCreationModal } from './modals/ModuleCreationModal';

// Define Props
interface FacilitatorDashboardProps {
  currentUser?: User; 
  onLogout: () => void;
  onNavigateToLanding?: () => void;
}

const API_BASE_URL = 'b-t-backend-production-1580.up.railway.app/api';

export const FacilitatorDashboard: React.FC<FacilitatorDashboardProps> = ({ currentUser: propUser, onLogout, onNavigateToLanding }) => {
  // State for User and Data
  const [user, setUser] = useState<User | null>(propUser || null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [modules, setModules] = useState<Module[]>([]);
  const [studyMaterials, setStudyMaterials] = useState<StudyMaterial[]>([]);
  const [tests, setTests] = useState<Test[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [usersList, setUsersList] = useState<User[]>([]); 
  const [editingTest, setEditingTest] = useState<Test | null>(null);
  
  // UI State
  const [activeTab, setActiveTab] = useState<'modules' | 'lessons' | 'tests' | 'assignments' | 'grading'>('modules');
  const [showCreateTest, setShowCreateTest] = useState(false);
  const [selectedModuleForContent, setSelectedModuleForContent] = useState<Module | null>(null);
  const [showCreateModule, setShowCreateModule] = useState(false);
  // ✅ NEW: State for the Module Selector Modal
  const [showModuleSelector, setShowModuleSelector] = useState(false);
  const [loading, setLoading] = useState(true);

  // Fetch Data on Mount
  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return; 

      if (!user) {
        const storedUser = localStorage.getItem('user');
        if (storedUser) setUser(JSON.parse(storedUser));
      }

      const config = { headers: { Authorization: `Bearer ${token}` } };

     const [
        coursesRes, modulesRes, lessonsRes, quizzesRes, 
        assignmentsRes, submissionsRes, usersRes
      ] = await Promise.all([
        axios.get(`${API_BASE_URL}/courses`, config).catch(() => ({ data: [] })), // ✅ Catch error and return empty array
        axios.get(`${API_BASE_URL}/modules`, config).catch(() => ({ data: [] })),
        axios.get(`${API_BASE_URL}/lessons`, config).catch(() => ({ data: [] })),
        axios.get(`${API_BASE_URL}/quizzes`, config).catch(() => ({ data: [] })),
        axios.get(`${API_BASE_URL}/assignments`, config).catch(() => ({ data: [] })),
        axios.get(`${API_BASE_URL}/submissions/assignment`, config).catch(() => ({ data: [] })),
        axios.get(`${API_BASE_URL}/users`, config).catch(() => ({ data: [] }))
      ]);

      // ✅ SAFETY CHECK: Ensure it's an array before setting state
      setCourses(Array.isArray(coursesRes.data) ? coursesRes.data : []);
      setModules(Array.isArray(modulesRes.data) ? modulesRes.data : []);
      setStudyMaterials(Array.isArray(lessonsRes.data) ? lessonsRes.data : []);
      setTests(Array.isArray(quizzesRes.data) ? quizzesRes.data : []);
      setAssignments(Array.isArray(assignmentsRes.data) ? assignmentsRes.data : []);

    } catch (err) {
      console.error("Failed to load facilitator data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Filtering Logic
  const myCourses = useMemo(() => {
    if (!user) return [];
    return courses.filter(c => String(c.facilitatorId) === String(user.id));
  }, [courses, user]);

  const myModules = useMemo(() => {
    return modules.filter(m => myCourses.some(c => String(c.id) === String(m.courseId)));
  }, [modules, myCourses]);

  // Lessons Filter: Hides 'QUIZ' and 'ASSIGNMENT'
  const myLessons = useMemo(() => {
    return studyMaterials
        .filter(mat => myModules.some(m => String(m.id) === String(mat.moduleId)))
        .filter(mat => mat.contentType !== 'QUIZ' && mat.contentType !== 'ASSIGNMENT'); 
  }, [studyMaterials, myModules]);

  const myTests = useMemo(() => {
    return tests.filter(t => myCourses.some(c => String(c.id) === String(t.courseId)));
  }, [tests, myCourses]);

  const myAssignments = useMemo(() => {
    return assignments.filter(a => myCourses.some(c => String(c.id) === String(a.courseId)));
  }, [assignments, myCourses]);

  const handleDeleteTest = async (testId: string) => {
      if (!confirm("Are you sure? This will delete the test and all questions.")) return;
      try {
          const token = localStorage.getItem('token');
          await axios.delete(`${API_BASE_URL}/quizzes/${testId}`, {
              headers: { Authorization: `Bearer ${token}` }
          });
          fetchData();
      } catch (e) { alert("Failed to delete test"); }
  };

  if (loading) return <div className="p-10 text-center">Loading Dashboard...</div>;
  if (!user) return <div className="p-10 text-center">Please log in.</div>;

  return (
    <div className="min-h-screen bg-gray-50">
      
      {/* HEADER */}
      <header className="bg-white border-b border-red-600 shadow-sm sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex justify-between items-center">
            <div className="flex items-center space-x-3">
                <BookOpen className="w-8 h-8 text-red-600" />
                <h1 className="text-xl font-bold text-red-600">Facilitator Dashboard</h1>
            </div>
            <div className="flex items-center space-x-6">
                {onNavigateToLanding && (
                    <button onClick={onNavigateToLanding} className="text-gray-500 hover:text-red-600 text-sm font-medium">
                        Landing Page
                    </button>
                )}
                <span className="text-sm text-gray-600">Welcome, {user.firstname}</span>
                <button onClick={onLogout} className="flex items-center space-x-2 text-gray-500 hover:text-red-600 text-sm font-medium">
                    <LogOut className="w-4 h-4" /> <span>Logout</span>
                </button>
            </div>
        </div>
      </header>

      {/* TABS */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-wrap gap-2 mb-8 bg-white p-2 rounded-lg shadow-sm border border-gray-100">
            {[
              { id: 'modules', label: `My Modules`, icon: Users },
              { id: 'lessons', label: `All Lessons`, icon: BookOpen }, 
              { id: 'tests', label: `Tests`, icon: FileText },
              { id: 'assignments', label: `Assignments`, icon: Award },
              { id: 'grading', label: `Grading Center`, icon: CheckCircle }
            ].map((tab) => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center space-x-2 px-6 py-2.5 rounded-lg transition-all font-medium text-sm ${
                  activeTab === tab.id ? 'bg-red-600 text-white shadow-md' : 'text-gray-600 hover:bg-gray-100'
                }`}>
                <tab.icon className="w-4 h-4" /> <span>{tab.label}</span>
              </button>
            ))}
        </div>

        {/* CONTENT */}
        <div className="space-y-6">
          
          {/* MODULES TAB */}
          {activeTab === 'modules' && (
            <div className="space-y-6">
               <div className="flex justify-between items-center bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                   <div>
                      <h2 className="text-xl font-bold text-gray-900">Modules</h2>
                      <p className="text-sm text-gray-500">Manage content for your {myCourses.length} courses</p>
                   </div>
                   <button 
                      onClick={() => setShowCreateModule(true)} 
                      className="bg-red-600 text-white px-5 py-2.5 rounded-lg hover:bg-red-700 shadow-sm flex items-center space-x-2 font-medium"
                   >
                       <Plus className="w-4 h-4"/> <span>Create Module</span>
                   </button>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in">
                  {myModules.length === 0 && (
                    <div className="col-span-3 text-center py-12 text-gray-500 border-2 border-dashed rounded-lg">
                      You have no modules. Create one to start adding lessons.
                    </div>
                  )}
                  {myModules.map((module) => (
                      <div key={module.id} className="bg-white shadow-md rounded-xl overflow-hidden hover:shadow-xl transition border border-gray-100 flex flex-col">
                          <div className="h-32 bg-slate-50 flex items-center justify-center border-b border-gray-100">
                              <BookOpen className="text-red-200 w-12 h-12"/>
                          </div>
                          <div className="p-6 flex-1 flex flex-col">
                              <h3 className="text-lg font-bold text-gray-900 mb-2">{module.title}</h3>
                              <p className="text-sm text-gray-600 line-clamp-2 mb-4 flex-1">{module.description}</p>
                              <button onClick={() => setSelectedModuleForContent(module)} className="w-full bg-white border border-red-600 text-red-600 py-2 rounded-lg hover:bg-red-50 transition text-sm font-medium flex items-center justify-center space-x-2">
                                <Upload className="w-4 h-4" /> <span>Manage Content</span>
                              </button>
                          </div>
                      </div>
                  ))}
               </div>
            </div>
          )}

          {/* ALL LESSONS TAB */}
          {activeTab === 'lessons' && (
            <div className="space-y-6 animate-in fade-in">
              <div className="flex justify-between items-center bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">All Lessons</h2>
                    <p className="text-sm text-gray-500">View and manage all {myLessons.length} lessons (Videos, PDFs, Links).</p>
                  </div>
                  {/* ✅ FIXED: Create Lesson Button */}
                  <button 
                    onClick={() => setShowModuleSelector(true)} 
                    className="bg-red-600 text-white px-5 py-2.5 rounded-lg hover:bg-red-700 shadow-sm flex items-center space-x-2 font-medium"
                  >
                      <Plus className="w-4 h-4"/> <span>Create Lesson</span>
                  </button>
              </div>

              {myLessons.length === 0 ? (
                <div className="text-center py-12 text-gray-500 bg-white rounded-lg border border-dashed">
                  No lessons found. Click 'Create Lesson' to start.
                </div>
              ) : (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-gray-600">
                      <thead className="bg-gray-50 text-xs uppercase font-semibold text-gray-500">
                        <tr>
                          <th className="px-6 py-4">Title</th>
                          <th className="px-6 py-4">Type</th>
                          <th className="px-6 py-4">Module</th>
                          <th className="px-6 py-4">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {myLessons.map((lesson) => {
                          const parentModule = modules.find(m => String(m.id) === String(lesson.moduleId));
                          return (
                            <tr key={lesson.id} className="hover:bg-gray-50 transition">
                              <td className="px-6 py-4 font-medium text-gray-900">{lesson.title}</td>
                              <td className="px-6 py-4">
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-medium border border-blue-100">
                                  {lesson.contentType === 'VIDEO' ? <Video size={12}/> : 
                                   lesson.contentType === 'LINK' ? <LinkIcon size={12}/> : <FileText size={12}/>}
                                  {lesson.contentType || 'PDF'}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-gray-500">{parentModule?.title || 'Unknown'}</td>
                              <td className="px-6 py-4">
                                <button onClick={() => setSelectedModuleForContent(parentModule || null)} className="text-gray-500 hover:text-gray-900 flex items-center gap-1 text-xs font-medium">
                                  <Edit2 size={14} /> Edit
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TESTS TAB */}
          {activeTab === 'tests' && (
             <div className="space-y-6 animate-in fade-in">
                 <div className="flex justify-between items-center bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                     <div>
                       <h2 className="text-xl font-bold text-gray-900">Assessments</h2>
                       <p className="text-sm text-gray-500">Manage quizzes and exams for your courses</p>
                     </div>
                     <button onClick={() => { setEditingTest(null); setShowCreateTest(true); }} className="bg-red-600 text-white px-5 py-2.5 rounded-lg hover:bg-red-700 shadow-sm flex items-center space-x-2 font-medium">
                         <Plus className="w-4 h-4"/> <span>Create Assessment</span>
                     </button>
                 </div>

                 {myTests.length === 0 && (
                    <div className="text-center py-12 text-gray-500 bg-white rounded-lg border border-dashed">
                      No assessments created yet. Click the button above to start.
                    </div>
                 )}

                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                     {myTests.map(test => {
                         const parentModule = modules.find(m => String(m.id) === String(test.moduleId));
                         return (
                           <div key={test.id} className="bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-all group flex flex-col h-full">
                               <div className="p-5 flex-1">
                                  <div className="flex justify-between items-start mb-3">
                                     <h3 className="font-bold text-gray-900 text-lg leading-tight">{test.title}</h3>
                                     <span className={`text-xs px-2 py-1 rounded-full font-medium ${test.timed ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700'}`}>
                                       {test.timed ? 'Timed' : 'Untimed'}
                                     </span>
                                  </div>
                                  
                                  <div className="flex items-center gap-2 text-xs text-gray-500 mb-3">
                                      <span className="bg-gray-100 px-2 py-1 rounded">{parentModule?.title || 'Unknown Module'}</span>
                                      {test.timed && (
                                        <span className="flex items-center gap-1"><Clock size={12}/> {test.timeLimitInMinutes}m</span>
                                      )}
                                  </div>
                                  
                                  <p className="text-sm text-gray-600 line-clamp-3">{test.description || "No description provided."}</p>
                               </div>

                               <div className="border-t border-gray-100 p-4 bg-gray-50 rounded-b-xl flex justify-between items-center">
                                   <div className="text-xs text-gray-400 font-medium">ID: {test.id}</div>
                                   <div className="flex gap-2">
                                      <button onClick={() => { setEditingTest(test); setShowCreateTest(true); }} className="text-gray-500 hover:text-blue-600 p-1.5 hover:bg-blue-50 rounded transition"><Edit2 size={16}/></button>
                                      <button onClick={() => handleDeleteTest(test.id)} className="text-gray-500 hover:text-red-600 p-1.5 hover:bg-red-50 rounded transition"><Trash2 size={16}/></button>
                                   </div>
                               </div>
                           </div>
                         );
                     })}
                 </div>
             </div>
          )}
          
          {/* ASSIGNMENTS & GRADING */}
          {activeTab === 'assignments' && (
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in">
                 {myAssignments.length === 0 && <p className="col-span-3 text-center text-gray-500 py-10">No assignments created.</p>}
                 {myAssignments.map(assignment => (
                     <div key={assignment.id} className="bg-white border-l-4 border-slate-600 rounded-lg shadow-md p-6 hover:shadow-lg transition">
                         <h3 className="font-bold text-gray-900 text-lg mb-2">{assignment.title}</h3>
                         <p className="text-sm text-gray-600 mb-4 line-clamp-2">{assignment.description}</p>
                         <p className="text-xs text-gray-500">Due: {new Date(assignment.dueDate).toLocaleDateString()}</p>
                     </div>
                 ))}
             </div>
          )}

          {activeTab === 'grading' && (
            <GradingCenter 
                courses={myCourses} modules={myModules} 
                tests={myTests} assignments={myAssignments}
                users={usersList} testResults={[]} 
                assignmentSubmissions={[]} 
                onDataMutated={fetchData}
            />
          )}
        </div>
      </div>

      {/* MODALS */}
      
      {/* 1. Module Selector for Creating Lessons */}
      {showModuleSelector && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
                  <div className="flex justify-between items-center p-4 border-b">
                      <h3 className="text-lg font-bold text-gray-800">Select Module</h3>
                      <button onClick={() => setShowModuleSelector(false)}><X className="w-5 h-5 text-gray-400 hover:text-red-600" /></button>
                  </div>
                  <div className="p-4 overflow-y-auto max-h-[60vh]">
                      <p className="text-sm text-gray-500 mb-4">Choose a module to add this lesson to:</p>
                      {myModules.length === 0 && <p className="text-red-500 text-sm">You must create a module first.</p>}
                      <div className="space-y-2">
                          {myModules.map(m => (
                              <button 
                                key={m.id}
                                onClick={() => {
                                    setShowModuleSelector(false);
                                    setSelectedModuleForContent(m); // Opens the content manager
                                }}
                                className="w-full text-left p-3 border rounded-lg hover:bg-red-50 hover:border-red-200 transition flex justify-between items-center group"
                              >
                                  <span className="font-medium text-gray-700 group-hover:text-red-700">{m.title}</span>
                                  <ChevronRight size={16} className="text-gray-300 group-hover:text-red-500"/>
                              </button>
                          ))}
                      </div>
                  </div>
              </div>
          </div>
      )}

      {showCreateTest && (
        <TestCreation
          courses={myCourses}
          modules={myModules}
          currentUser={user}
          initialData={editingTest} 
          onCreateTest={() => { fetchData(); setShowCreateTest(false); }}
          onClose={() => setShowCreateTest(false)}
        />
      )}
      
      {selectedModuleForContent && (
        <ModuleContentManager
            module={selectedModuleForContent}
            materials={studyMaterials.filter(m => m.contentType !== 'QUIZ' && m.contentType !== 'ASSIGNMENT')}
            currentUser={user}
            onDataMutated={fetchData} 
            onClose={() => setSelectedModuleForContent(null)} 
        />
      )}

      {showCreateModule && (
        <ModuleCreationModal
            courses={myCourses}
            onDataMutated={fetchData}
            onClose={() => setShowCreateModule(false)}
        />
      )}
    </div>
  );
};