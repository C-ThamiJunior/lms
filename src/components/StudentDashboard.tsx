import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { 
  User, 
  Course, 
  Test, 
  Assignment, 
  StudyMaterial, 
  Module, 
  ChatMessage, 
  AssignmentSubmission 
} from '../types/lms';
import { 
  BookOpen, Home, FileText, Award, MessageCircle, 
  Users, Play, X, LogOut, Video, File, Link as LinkIcon,
  Clock, CheckCircle, ChevronRight, AlertCircle
} from 'lucide-react';
import { ChatSystem } from './ChatSystem';
import { DiscussionForum } from './DiscussionForum';

// --- Sub-Components (Assignment Modal) ---
const AssignmentSubmitModal: React.FC<{
  assignment: Assignment;
  currentUser: User;
  onClose: () => void;
  onDataMutated: () => void;
}> = ({ assignment, currentUser, onClose, onDataMutated }) => {
  const [file, setFile] = useState<File | null>(null);
  const [comments, setComments] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFile(e.target.files?.[0] || null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      alert('Please select a file to submit.');
      return;
    }

    setIsSubmitting(true);
    const formData = new FormData();
    formData.append('assignmentId', assignment.id.toString()); // Ensure string
    formData.append('studentId', currentUser.id.toString());
    formData.append('file', file);
    formData.append('comments', comments);
    
    // Note: Ensure your backend uses this URL, or update to match your Controller
    fetch('https://b-t-backend-production-1580.up.railway.app/api/submissions/assignment', { 
      method: 'POST',
      body: formData,
    })
    .then(res => {
      if (!res.ok) throw new Error('Network response was not ok');
      return res.json();
    })
    .then(() => {
      alert('Submission successful!');
      onDataMutated();
      onClose();
    })
    .catch(err => {
      console.error('Failed to submit assignment:', err);
      alert(`Error submitting assignment: ${err.message}`);
    })
    .finally(() => {
      setIsSubmitting(false);
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
        <div className="flex justify-between items-center p-6 border-b">
          <h3 className="text-lg font-semibold text-black">Submit: {assignment.title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Upload File *</label>
            <input
              type="file"
              required
              onChange={handleFileChange}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
            />
            {file && <p className="text-sm text-gray-600 mt-1">Selected: {file.name}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Comments (Optional)</label>
            <textarea
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
              rows={3}
              placeholder="Add any comments for your facilitator..."
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button type="button" onClick={onClose} disabled={isSubmitting} className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50">
              Cancel
            </button>
            <button type="submit" disabled={!file || isSubmitting} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
              {isSubmitting ? 'Submitting...' : 'Submit Work'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// --- Main Component ---
interface StudentDashboardProps {
  currentUser?: User;
  onLogout: () => void;
  onNavigateToLanding?: () => void;
}

const API_BASE_URL = 'https://b-t-backend-production-1580.up.railway.app/api';

export const StudentDashboard: React.FC<StudentDashboardProps> = ({ 
  currentUser: propUser, 
  onLogout, 
  onNavigateToLanding 
}) => {
  // State Management
  const [user, setUser] = useState<User | null>(propUser || null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [modules, setModules] = useState<Module[]>([]);
  const [studyMaterials, setStudyMaterials] = useState<StudyMaterial[]>([]);
  const [tests, setTests] = useState<Test[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [assignmentSubmissions, setAssignmentSubmissions] = useState<AssignmentSubmission[]>([]);
  const [usersList, setUsersList] = useState<User[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  
  // UI State
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'materials' | 'tests' | 'assignments' | 'chat' | 'discussions'>('materials');
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [showSettings, setShowSettings] = useState(false);

  // --- TEST TAKING STATE ---
  const [activeTest, setActiveTest] = useState<Test | null>(null);
  const [testQuestions, setTestQuestions] = useState<any[]>([]); 
  const [testAnswers, setTestAnswers] = useState<{[key: number]: string}>({});
  const [testResult, setTestResult] = useState<any | null>(null);
  const [isSubmittingTest, setIsSubmittingTest] = useState(false);


  // --- Data Fetching ---
  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      let currentUserId = user?.id;
      if (!user) {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
           const parsed = JSON.parse(storedUser);
           setUser(parsed);
           currentUserId = parsed.id;
        }
      }

      if (!currentUserId) return;

      const config = { headers: { Authorization: `Bearer ${token}` } };

      const [
        coursesRes, // ✅ CHANGED: Fetching Courses Directly instead of Enrollments
        modulesRes, 
        lessonsRes, 
        quizzesRes, 
        assignmentsRes, 
        submissionsRes,
        usersRes
      ] = await Promise.all([
        axios.get(`${API_BASE_URL}/courses`, config), // ✅ UPDATED ENDPOINT
        axios.get(`${API_BASE_URL}/modules`, config),
        axios.get(`${API_BASE_URL}/lessons`, config),
        axios.get(`${API_BASE_URL}/quizzes`, config),
        axios.get(`${API_BASE_URL}/assignments`, config),
        axios.get(`${API_BASE_URL}/submissions/assignment`, config),
        axios.get(`${API_BASE_URL}/users`, config)
      ]);

      // ✅ Safe Fallback: If coursesRes is null/undefined/error, use empty array
      const allCourses = Array.isArray(coursesRes.data) ? coursesRes.data : [];
      setCourses(allCourses);
      
      setModules(modulesRes.data);
      setStudyMaterials(lessonsRes.data);
      setTests(quizzesRes.data);
      setAssignments(assignmentsRes.data);
      
      const mySubmissions = submissionsRes.data.filter((s: any) => 
         String(s.learnerId) === String(currentUserId) || String(s.studentId) === String(currentUserId)
      );
      setAssignmentSubmissions(mySubmissions);
      setUsersList(usersRes.data);

    } catch (err) {
      console.error("Failed to load student data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // --- Filtering Logic ---
  const enrolledCourseIds = useMemo(() => courses.map(c => String(c.id)), [courses]);

  const availableMaterials = useMemo(() => {
    return studyMaterials.filter(mat => {
        const module = modules.find(m => String(m.id) === String(mat.moduleId));
        return module && enrolledCourseIds.includes(String(module.courseId));
    });
  }, [studyMaterials, modules, enrolledCourseIds]);

  const availableTests = useMemo(() => {
    return tests.filter(t => enrolledCourseIds.includes(String(t.courseId)));
  }, [tests, enrolledCourseIds]);

  const availableAssignments = useMemo(() => {
    return assignments.filter(a => enrolledCourseIds.includes(String(a.courseId)) && a.isActive);
  }, [assignments, enrolledCourseIds]);


  // --- TEST PLAYER LOGIC ---
  // ... (Test Player Logic stays the same) ...
  const handleStartTest = async (test: Test) => {
    setActiveTest(test);
    setTestAnswers({});
    setTestResult(null);
    setTestQuestions([]);
    try {
        const token = localStorage.getItem('token');
        const res = await axios.get(`${API_BASE_URL}/quizzes/${test.id}/questions`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        setTestQuestions(res.data);
    } catch (error) {
        console.error("Failed to load questions", error);
        alert("Could not load test questions. Please try again.");
        setActiveTest(null);
    }
  };

  const handleAnswerChange = (questionId: number, value: string) => {
    setTestAnswers(prev => ({ ...prev, [questionId]: value }));
  };

  const handleSubmitTest = async () => {
    if(!activeTest || !user) return;
    if(!confirm("Are you sure you want to submit your test?")) return;

    setIsSubmittingTest(true);
    try {
        const token = localStorage.getItem('token');
        const payload = {
            quizId: activeTest.id,
            learnerId: user.id,
            answers: testAnswers 
        };
        const res = await axios.post(`${API_BASE_URL}/attempts/quiz/submit`, payload, {
            headers: { Authorization: `Bearer ${token}` }
        });
        setTestResult(res.data);
    } catch (error) {
        console.error("Submission failed", error);
        alert("Failed to submit test.");
    } finally {
        setIsSubmittingTest(false);
    }
  };

  const closeTestPlayer = () => {
    setActiveTest(null);
    setTestResult(null);
    setTestAnswers({});
    setTestQuestions([]);
  };

  if (loading) return <div className="p-10 text-center">Loading Student Dashboard...</div>;
  if (!user) return <div className="p-10 text-center">Please log in.</div>;

  // --- RENDER TEST PLAYER (Overlay) ---
  if (activeTest) {
    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <header className="bg-white border-b border-gray-200 sticky top-0 z-30 px-6 py-4 flex justify-between items-center shadow-sm">
                <div>
                    <h2 className="text-xl font-bold text-gray-800">{activeTest.title}</h2>
                    <p className="text-sm text-gray-500">{testQuestions.length} Questions • {activeTest.duration || 'Untimed'}</p>
                </div>
                {!testResult && (
                    <button onClick={closeTestPlayer} className="text-gray-500 hover:text-red-600 font-medium">Exit Test</button>
                )}
            </header>

            <main className="flex-1 max-w-3xl mx-auto w-full p-6 space-y-8">
                {testResult ? (
                    <div className="bg-white rounded-xl shadow-lg p-8 text-center animate-in fade-in">
                        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <CheckCircle className="w-10 h-10 text-green-600" />
                        </div>
                        <h2 className="text-3xl font-bold text-gray-900 mb-2">Test Submitted!</h2>
                        <div className="bg-slate-50 p-6 rounded-lg max-w-md mx-auto mb-8 mt-6">
                            <p className="text-sm text-gray-500 uppercase tracking-wide font-semibold mb-1">Your Score</p>
                            <p className="text-4xl font-extrabold text-slate-900">
                                {testResult.score} / {testResult.totalMarks}
                            </p>
                            <p className="text-sm text-green-600 font-medium mt-2">
                                {Math.round((testResult.score / testResult.totalMarks) * 100)}%
                            </p>
                        </div>
                        <button onClick={closeTestPlayer} className="bg-slate-900 text-white px-8 py-3 rounded-lg hover:bg-slate-800 transition shadow-lg">
                            Return to Dashboard
                        </button>
                    </div>
                ) : (
                    <>
                        {testQuestions.length === 0 ? (
                            <div className="text-center py-10 text-gray-500">Loading questions...</div>
                        ) : (
                            testQuestions.map((q, idx) => (
                                <div key={q.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                                    <div className="bg-slate-50 px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                                        <span className="font-bold text-slate-700">Question {idx + 1}</span>
                                        <span className="text-xs font-semibold bg-white border border-gray-200 px-2 py-1 rounded text-gray-500">{q.points} Pts</span>
                                    </div>
                                    <div className="p-6">
                                        <p className="text-lg text-gray-800 mb-6 font-medium">{q.text}</p>
                                        {q.questionType === 'MULTIPLE_CHOICE' && q.options && (
                                            <div className="space-y-3">
                                                {q.options.map((opt: any) => (
                                                    <label key={opt.id || opt} className={`flex items-center p-4 border rounded-lg cursor-pointer transition-all ${testAnswers[q.id] === (opt.optionText || opt) ? 'border-red-600 bg-red-50' : 'border-gray-200 hover:bg-gray-50'}`}>
                                                        <input 
                                                            type="radio" 
                                                            name={`q-${q.id}`} 
                                                            value={opt.optionText || opt} 
                                                            checked={testAnswers[q.id] === (opt.optionText || opt)}
                                                            onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                                                            className="w-4 h-4 text-red-600 focus:ring-red-500"
                                                        />
                                                        <span className="ml-3 text-gray-700">{opt.optionText || opt}</span>
                                                    </label>
                                                ))}
                                            </div>
                                        )}
                                        {q.questionType === 'TRUE_FALSE' && (
                                            <div className="space-y-3">
                                                {['TRUE', 'FALSE'].map(opt => (
                                                    <label key={opt} className={`flex items-center p-4 border rounded-lg cursor-pointer transition-all ${testAnswers[q.id] === opt ? 'border-red-600 bg-red-50' : 'border-gray-200 hover:bg-gray-50'}`}>
                                                        <input 
                                                            type="radio" 
                                                            name={`q-${q.id}`} 
                                                            value={opt} 
                                                            checked={testAnswers[q.id] === opt}
                                                            onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                                                            className="w-4 h-4 text-red-600 focus:ring-red-500"
                                                        />
                                                        <span className="ml-3 text-gray-700">{opt}</span>
                                                    </label>
                                                ))}
                                            </div>
                                        )}
                                        {q.questionType === 'SHORT_ANSWER' && (
                                            <textarea 
                                                rows={3} 
                                                placeholder="Type your answer..." 
                                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                                                value={testAnswers[q.id] || ''}
                                                onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                                            />
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                        <div className="flex justify-end pt-4 pb-12">
                            <button 
                                onClick={handleSubmitTest}
                                disabled={isSubmittingTest}
                                className="bg-red-600 text-white px-8 py-4 rounded-xl text-lg font-bold hover:bg-red-700 transition shadow-lg disabled:opacity-50 flex items-center gap-2"
                            >
                                {isSubmittingTest ? 'Submitting...' : <>Submit Test <ChevronRight/></>}
                            </button>
                        </div>
                    </>
                )}
            </main>
        </div>
    );
  }

  // --- STANDARD DASHBOARD RENDER ---
  return (
    <div className="min-h-screen bg-gray-50">
      
      {/* HEADER */}
      <header className="bg-white text-black border-b border-red-600 shadow-sm sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <BookOpen className="w-8 h-8 text-red-600" />
              <h1 className="text-xl font-bold text-red-600">Student Dashboard</h1>
            </div>
            
            <div className="flex items-center space-x-4">
                {onNavigateToLanding && (
                    <button 
                        onClick={onNavigateToLanding} 
                        className="flex items-center space-x-1 text-gray-500 hover:text-red-600 text-sm font-medium transition-colors"
                    >
                        <Home className="w-4 h-4" />
                        <span>Home</span>
                    </button>
                )}
              <div className="relative group">
                <button 
                  onClick={() => setShowSettings(!showSettings)}
                  className="bg-slate-600 border-0 text-white flex items-center justify-center rounded-full w-10 h-10 hover:bg-slate-700 transition-colors"
                >
                  {user.firstname ? user.firstname.substring(0,2).toUpperCase() : 'NM'}
                </button>
                
                {showSettings && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 border border-gray-200 z-50">
                    <button className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Profile</button>
                    <button onClick={onLogout} className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100">Logout</button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>
      
      {/* NAVIGATION TABS */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-wrap gap-2 mb-8 bg-white p-2 rounded-lg shadow-sm">
          {[
            { key: 'materials', label: 'Study Materials', icon: BookOpen },
            { key: 'tests', label: 'Tests', icon: FileText },
            { key: 'assignments', label: 'Assignments', icon: Award },
            { key: 'chat', label: 'Chat', icon: MessageCircle },
            { key: 'discussions', label: 'Discussions', icon: Users },
          ].map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key as any)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors flex-1 justify-center ${
                activeTab === key
                  ? 'bg-red-600 text-white shadow-md'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span className="text-sm font-medium">{label}</span>
            </button>
          ))}
        </div>

        {/* --- CONTENT AREA --- */}
        
        {/* Study Materials Tab */}
        {activeTab === 'materials' && (
          <div className="space-y-6 animate-in fade-in">
            <h2 className="text-2xl font-bold text-black">Study Materials</h2>
            {availableMaterials.length === 0 ? (
              <div className="text-center py-12">
                <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No study materials available yet.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {availableMaterials.map((material, idx) => {
                  const module = modules.find(m => String(m.id) === String(material.moduleId));
                  // Icon Selection
                  const getIcon = () => {
                      const type = material.contentType ? material.contentType.toLowerCase() : 'pdf';
                      if(type.includes('video')) return <Video className="w-5 h-5"/>;
                      if(type.includes('link')) return <LinkIcon className="w-5 h-5"/>;
                      return <File className="w-5 h-5"/>;
                  }

                  return (
                    <div key={material.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300">
                      <div className="h-32 bg-slate-100 flex items-center justify-center">
                          {getIcon()}
                      </div>
                      
                      <div className="p-6">
                          <div className="flex items-center justify-between mb-2">
                             <h3 className="text-lg font-semibold text-gray-800 line-clamp-1">{material.title}</h3>
                             <span className="text-xs font-medium bg-gray-100 px-2 py-1 rounded text-gray-600 uppercase">
                                 {material.contentType || 'DOC'}
                             </span>
                          </div>
                          <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                              {material.description || "No description provided."}
                          </p>
                          <p className="text-xs text-gray-500 mb-4">Module: {module?.title || 'General'}</p>

                          <div className="pt-4 border-t border-gray-100 flex justify-end">
                             <button 
                                onClick={() => window.open(material.url, '_blank')}
                                className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition-colors text-sm">
                                View Material
                             </button>
                          </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Tests Tab */}
        {activeTab === 'tests' && (
          <div className="space-y-6 animate-in fade-in">
            <h2 className="text-2xl font-bold text-black">Available Tests</h2>
            {availableTests.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No tests available at the moment.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {availableTests.map((test) => {
                  const isOpen = true; 
                  return (
                    <div key={test.id} className="bg-white border-l-2 border-red-600 rounded-lg shadow-md p-6 hover:shadow-xl transition-shadow flex flex-col justify-between">
                      <div>
                          <div className="flex items-center mb-3">
                            <Award className="w-6 h-6 text-red-600 mr-2" />
                            <h3 className="text-lg font-semibold text-gray-800">{test.title}</h3>
                          </div>
                          
                          <p className="text-sm text-gray-600 mb-4 line-clamp-2">{test.description || "No description."}</p>
                          
                          <div className="space-y-1 mb-4">
                             <p className="text-xs text-gray-500">Duration: <span className="font-medium text-gray-700">{test.duration || 60} mins</span></p>
                             <p className="text-xs text-gray-500">Marks: <span className="font-medium text-gray-700">{test.totalMarks}</span></p>
                          </div>
                      </div>
                      
                      <button
                        onClick={() => handleStartTest(test)}
                        disabled={!isOpen}
                        className="w-full bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition-colors text-sm disabled:opacity-50"
                      >
                          Start Test
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Assignments Tab */}
        {activeTab === 'assignments' && (
          <div className="space-y-6 animate-in fade-in">
            <h2 className="text-2xl font-bold text-black">Assignments</h2>
            {availableAssignments.length === 0 ? (
              <div className="text-center py-12">
                <Award className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No assignments available at the moment.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {availableAssignments.map((assignment) => {
                  const submission = assignmentSubmissions.find(s => String(s.assignmentId) === String(assignment.id));
                  const isSubmitted = !!submission;

                  return (
                    <div key={assignment.id} className="bg-white rounded-lg shadow-md p-6 flex flex-col justify-between hover:shadow-lg transition-shadow border-l-2 border-slate-800">
                      <div>
                          <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-gray-800">{assignment.title}</h3>
                            <span className={`px-2 py-1 text-xs rounded-full font-medium ${isSubmitted ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}`}>
                                {isSubmitted ? "Submitted" : "Pending"}
                            </span>
                          </div>

                          <p className="text-sm text-gray-600 mb-4">{assignment.description || "Complete the tasks before the deadline."}</p>
                      </div>
                      
                      <div className="flex justify-between items-center mt-auto pt-4">
                        <p className="text-xs text-gray-500">Due: {new Date(assignment.dueDate).toLocaleDateString()}</p>
                        <div className="flex space-x-2">
                             <button 
                                onClick={() => window.open(assignment.fileUrl, '_blank')}
                                className="bg-slate-700 text-white px-3 py-1 rounded hover:bg-slate-800 transition-colors text-sm"
                             >
                                View
                             </button>
                             <button 
                                onClick={() => setSelectedAssignment(assignment)}
                                className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700 transition-colors text-sm"
                             >
                                {isSubmitted ? 'Update' : 'Submit'}
                             </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Chat Tab */}
        {activeTab === 'chat' && (
          <div className="space-y-6 animate-in fade-in">
            <h2 className="text-2xl font-bold text-black">Chat with Students</h2>
            <div className="bg-white p-6 rounded-lg shadow-md">
                 <ChatSystem
                  currentUser={user}
                  users={usersList.filter(u => u.id !== user.id)}
                  messages={messages}
                  onSendMessage={(receiverId, message) => console.log('Sending', receiverId, message)}
                  onMarkAsRead={(msgId) => console.log('Reading', msgId)}
                />
            </div>
          </div>
        )}

        {/* Discussions Tab */}
        {activeTab === 'discussions' && (
          <div className="space-y-6 animate-in fade-in">
            <h2 className="text-2xl font-bold text-black">Course Discussions</h2>
             <div className="bg-white p-6 rounded-lg shadow-md">
                <DiscussionForum
                  discussions={[]} 
                  courses={courses}
                  modules={modules}
                  users={usersList}
                  currentUser={user}
                  onCreateDiscussion={() => {}}
                  onReplyToDiscussion={() => {}}
                />
             </div>
          </div>
        )}
      </div>

      {/* Modal */}
      {selectedAssignment && (
        <AssignmentSubmitModal
          assignment={selectedAssignment}
          currentUser={user}
          onClose={() => setSelectedAssignment(null)}
          onDataMutated={() => {
            fetchData();
            setSelectedAssignment(null); 
          }}
        />
      )}
    </div>
  );
};