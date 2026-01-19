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
  Users, Video, Link as LinkIcon, File,
  CheckCircle, ChevronRight, X, Clock, AlertCircle
} from 'lucide-react';
import { ChatSystem } from './ChatSystem';
import { DiscussionForum } from './DiscussionForum';
// ✅ Import the Notification Component
import { NotificationDropdown, NotificationItem } from './NotificationDropdown';

// --- SUB-COMPONENT: ASSIGNMENT SUBMIT MODAL ---
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
    // Match exactly what the Controller expects
    formData.append('assignmentId', assignment.id.toString());
    formData.append('studentId', currentUser.id.toString());
    formData.append('file', file);
    formData.append('comments', comments);
    
    // Note: Facilitator ID is auto-handled by backend now

    fetch('https://b-t-backend-production-1580.up.railway.app/api/submissions/assignment', { 
      method: 'POST',
      body: formData,
    })
    .then(async res => {
      if (!res.ok) {
          const text = await res.text();
          throw new Error(text || 'Server error');
      }
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-in fade-in">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
        <div className="flex justify-between items-center p-6 border-b bg-gray-50 rounded-t-lg">
          <div>
              <h3 className="text-lg font-bold text-gray-900">Submit Assignment</h3>
              <p className="text-xs text-gray-500 truncate max-w-[250px]">{assignment.title}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Upload File *</label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 hover:border-red-500 transition-colors bg-gray-50 text-center">
                <input
                  type="file"
                  required
                  onChange={handleFileChange}
                  className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-red-50 file:text-red-700 hover:file:bg-red-100"
                />
            </div>
            {file && <p className="text-xs text-green-600 mt-2 font-medium">Selected: {file.name}</p>}
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Comments (Optional)</label>
            <textarea
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition"
              rows={3}
              placeholder="Add a note for your instructor..."
            />
          </div>

          <div className="flex justify-end space-x-3 pt-2">
            <button type="button" onClick={onClose} disabled={isSubmitting} className="px-4 py-2 text-gray-600 font-medium hover:bg-gray-100 rounded-lg transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={!file || isSubmitting} className="px-6 py-2 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md">
              {isSubmitting ? 'Uploading...' : 'Submit Work'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// --- MAIN COMPONENT: STUDENT DASHBOARD ---
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
  const [myQuizAttempts, setMyQuizAttempts] = useState<any[]>([]);

  // ✅ Notifications State
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  // UI State
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'materials' | 'tests' | 'assignments' | 'chat' | 'discussions'>('materials');
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [showSettings, setShowSettings] = useState(false);

  // Test Taking State
  const [activeTest, setActiveTest] = useState<Test | null>(null);
  const [testQuestions, setTestQuestions] = useState<any[]>([]); 
  const [testAnswers, setTestAnswers] = useState<{[key: number]: string}>({});
  const [testResult, setTestResult] = useState<any | null>(null);
  const [isSubmittingTest, setIsSubmittingTest] = useState(false);


  // --- DATA FETCHING ---
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
        coursesRes, modulesRes, lessonsRes, quizzesRes, assignmentsRes, 
        submissionsRes, usersRes, messagesRes, attemptsRes
      ] = await Promise.all([
        axios.get(`${API_BASE_URL}/courses`, config).catch(() => ({ data: [] })),
        axios.get(`${API_BASE_URL}/modules`, config).catch(() => ({ data: [] })),
        axios.get(`${API_BASE_URL}/lessons`, config).catch(() => ({ data: [] })),
        axios.get(`${API_BASE_URL}/quizzes`, config).catch(() => ({ data: [] })),
        axios.get(`${API_BASE_URL}/assignments`, config).catch(() => ({ data: [] })),
        axios.get(`${API_BASE_URL}/submissions/assignment`, config).catch(() => ({ data: [] })),
        axios.get(`${API_BASE_URL}/users`, config).catch(() => ({ data: [] })),
        axios.get(`${API_BASE_URL}/messages/user/${currentUserId}`, config).catch(() => ({ data: [] })),
        axios.get(`${API_BASE_URL}/attempts/quiz`, config).catch(() => ({ data: [] }))
      ]);

      setCourses(Array.isArray(coursesRes.data) ? coursesRes.data : []);
      setModules(Array.isArray(modulesRes.data) ? modulesRes.data : []);
      setStudyMaterials(Array.isArray(lessonsRes.data) ? lessonsRes.data : []);
      setTests(Array.isArray(quizzesRes.data) ? quizzesRes.data : []);
      setAssignments(Array.isArray(assignmentsRes.data) ? assignmentsRes.data : []);
      
      // ✅ ROBUST SUBMISSION FILTERING (Handles nested objects and flat IDs)
      const mySubmissions = Array.isArray(submissionsRes.data) ? submissionsRes.data.filter((s: any) => {
         const submissionStudentId = s.student?.id || s.studentId || s.learnerId;
         const submissionLearnerId = s.learner?.id;
         const finalId = submissionStudentId || submissionLearnerId;
         return String(finalId) === String(currentUserId);
      }) : [];
      setAssignmentSubmissions(mySubmissions);

      setUsersList(Array.isArray(usersRes.data) ? usersRes.data : []);
      setMessages(Array.isArray(messagesRes.data) ? messagesRes.data : []);
      
      const allAttempts = Array.isArray(attemptsRes.data) ? attemptsRes.data : [];
      const myAttempts = allAttempts.filter((a: any) => String(a.learnerId) === String(currentUserId));
      setMyQuizAttempts(myAttempts);

    } catch (err) {
      console.error("Failed to load student data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // --- LIVE CHAT POLLING ---
  useEffect(() => {
    if (!user?.id) return;
    const intervalId = setInterval(async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;
        const res = await axios.get(`${API_BASE_URL}/messages/user/${user.id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setMessages(Array.isArray(res.data) ? res.data : []);
      } catch (err) { /* Silent fail */ }
    }, 5000); // Poll every 5 seconds
    return () => clearInterval(intervalId);
  }, [user?.id]);

  // --- NOTIFICATION ENGINE ---
  useEffect(() => {
    if (!user) return;
    const newNotifs: NotificationItem[] = [];

    // 1. Unread Messages
    const unreadMsgs = messages.filter(m => !m.read && String(m.senderId) !== String(user.id));
    if (unreadMsgs.length > 0) {
      newNotifs.push({
        id: 'msg-bundle',
        title: 'Unread Messages',
        message: `You have ${unreadMsgs.length} new message(s).`,
        type: 'info',
        timestamp: new Date(),
        isRead: false
      });
    }

    // 2. Graded Assignments
    assignmentSubmissions.forEach(sub => {
        if (sub.grade !== null && sub.grade !== undefined && sub.gradedAt) {
            newNotifs.push({
                id: `grade-${sub.id}`,
                title: 'Assignment Graded',
                message: `Your assignment #${sub.assignmentId} was graded: ${sub.grade}%`,
                type: 'success',
                timestamp: new Date(sub.gradedAt),
                isRead: false 
            });
        }
    });

    // 3. Pending Assignments (Due Soon)
    assignments.forEach(a => {
        // Robust 'isActive' check
        const active = (a as any).active !== undefined ? (a as any).active : (a.isActive !== undefined ? a.isActive : true);
        if (active && new Date(a.dueDate) > new Date()) {
             newNotifs.push({
                 id: `assign-${a.id}`,
                 title: 'Pending Assignment',
                 message: `${a.title} is due on ${new Date(a.dueDate).toLocaleDateString()}`,
                 type: 'warning',
                 timestamp: new Date(a.createdAt || new Date()),
                 isRead: true // Default to read to avoid spam
             });
        }
    });

    setNotifications(newNotifs);
  }, [messages, assignmentSubmissions, assignments, user]);


  // --- FILTERING LOGIC ---
  const enrolledCourseIds = useMemo(() => courses.map(c => String(c.id)), [courses]);

  const availableMaterials = useMemo(() => {
    return studyMaterials.filter(mat => {
        const module = modules.find(m => String(m.id) === String(mat.moduleId));
        const materialType = ((mat as any).contentType || mat.type || '').toUpperCase();
        const isHiddenType = materialType === 'QUIZ' || materialType === 'ASSIGNMENT';
        return module && enrolledCourseIds.includes(String(module.courseId)) && !isHiddenType;
    });
  }, [studyMaterials, modules, enrolledCourseIds]);

  // Split Tests: Pending vs Completed
  const { pendingTests, completedTests } = useMemo(() => {
    const allTests = tests.filter(t => enrolledCourseIds.includes(String(t.courseId)));
    const completed = allTests.filter(t => myQuizAttempts.some(a => String(a.quizId) === String(t.id)));
    const pending = allTests.filter(t => !myQuizAttempts.some(a => String(a.quizId) === String(t.id)));
    return { pendingTests: pending, completedTests: completed };
  }, [tests, enrolledCourseIds, myQuizAttempts]);

  // Split Assignments: Pending vs Submitted
  const { pendingAssignments, submittedAssignments } = useMemo(() => {
    const allAssignments = assignments.filter(a => {
        const isEnrolled = enrolledCourseIds.includes(String(a.courseId));
        const isActive = (a as any).active !== undefined ? (a as any).active : (a.isActive !== undefined ? a.isActive : true);
        return isEnrolled && isActive;
    });
    
    const submitted = allAssignments.filter(a => 
        assignmentSubmissions.some(s => String(s.assignmentId) === String(a.id))
    );
    
    const pending = allAssignments.filter(a => 
        !assignmentSubmissions.some(s => String(s.assignmentId) === String(a.id))
    );

    return { pendingAssignments: pending, submittedAssignments: submitted };
  }, [assignments, enrolledCourseIds, assignmentSubmissions]);


  // --- ACTIONS ---
  const handleSendMessage = async (receiverId: string, messageContent: string) => {
    try {
      const token = localStorage.getItem('token');
      const payload = {
        sender: { id: user?.id },
        receiver: { id: receiverId },
        content: messageContent 
      };
      const res = await axios.post(`${API_BASE_URL}/messages`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessages(prev => [...prev, res.data]);
    } catch (error) {
      console.error("Failed to send message", error);
    }
  };

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
        alert("Could not load test questions.");
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
        fetchData(); // Refresh to move test to completed
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

  // --- RENDER TEST PLAYER ---
  if (activeTest) {
    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <header className="bg-white border-b border-gray-200 sticky top-0 z-30 px-6 py-4 flex justify-between items-center shadow-sm">
                <div>
                    <h2 className="text-xl font-bold text-gray-800">{activeTest.title}</h2>
                    <p className="text-sm text-gray-500">
                        {testQuestions.length} Questions • {activeTest.timeLimitInMinutes ? `${activeTest.timeLimitInMinutes} mins` : 'Untimed'}
                    </p>
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
                        {testQuestions.map((q, idx) => (
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
                                                    <input type="radio" name={`q-${q.id}`} value={opt.optionText || opt} checked={testAnswers[q.id] === (opt.optionText || opt)} onChange={(e) => handleAnswerChange(q.id, e.target.value)} className="w-4 h-4 text-red-600 focus:ring-red-500"/>
                                                    <span className="ml-3 text-gray-700">{opt.optionText || opt}</span>
                                                </label>
                                            ))}
                                        </div>
                                    )}
                                    {q.questionType === 'TRUE_FALSE' && (
                                        <div className="space-y-3">
                                            {['TRUE', 'FALSE'].map(opt => (
                                                <label key={opt} className={`flex items-center p-4 border rounded-lg cursor-pointer transition-all ${testAnswers[q.id] === opt ? 'border-red-600 bg-red-50' : 'border-gray-200 hover:bg-gray-50'}`}>
                                                    <input type="radio" name={`q-${q.id}`} value={opt} checked={testAnswers[q.id] === opt} onChange={(e) => handleAnswerChange(q.id, e.target.value)} className="w-4 h-4 text-red-600 focus:ring-red-500"/>
                                                    <span className="ml-3 text-gray-700">{opt}</span>
                                                </label>
                                            ))}
                                        </div>
                                    )}
                                    {q.questionType === 'SHORT_ANSWER' && (
                                        <textarea rows={3} placeholder="Type your answer..." className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500" value={testAnswers[q.id] || ''} onChange={(e) => handleAnswerChange(q.id, e.target.value)} />
                                    )}
                                </div>
                            </div>
                        ))}
                        <div className="flex justify-end pt-4 pb-12">
                            <button onClick={handleSubmitTest} disabled={isSubmittingTest} className="bg-red-600 text-white px-8 py-4 rounded-xl text-lg font-bold hover:bg-red-700 transition shadow-lg disabled:opacity-50 flex items-center gap-2">
                                {isSubmittingTest ? 'Submitting...' : <>Submit Test <ChevronRight/></>}
                            </button>
                        </div>
                    </>
                )}
            </main>
        </div>
    );
  }

  // --- RENDER MAIN DASHBOARD ---
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
                {/* ✅ NOTIFICATION BELL */}
                <NotificationDropdown 
                    notifications={notifications}
                    onMarkAsRead={(id) => setNotifications(prev => prev.map(n => n.id === id ? {...n, isRead: true} : n))}
                    onClearAll={() => setNotifications([])}
                />

                {onNavigateToLanding && (
                    <button onClick={onNavigateToLanding} className="flex items-center space-x-1 text-gray-500 hover:text-red-600 text-sm font-medium transition-colors">
                        <Home className="w-4 h-4" />
                        <span>Home</span>
                    </button>
                )}
              <div className="relative group">
                <button onClick={() => setShowSettings(!showSettings)} className="bg-slate-600 border-0 text-white flex items-center justify-center rounded-full w-10 h-10 hover:bg-slate-700 transition-colors">
                  {user.firstname ? user.firstname.substring(0,2).toUpperCase() : 'NM'}
                </button>
                {showSettings && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 border border-gray-200 z-50">
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
            <button key={key} onClick={() => setActiveTab(key as any)} className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors flex-1 justify-center ${activeTab === key ? 'bg-red-600 text-white shadow-md' : 'text-gray-700 hover:bg-gray-100'}`}>
              <Icon className="w-4 h-4" />
              <span className="text-sm font-medium">{label}</span>
            </button>
          ))}
        </div>

        {/* --- CONTENT AREA --- */}
        
        {activeTab === 'materials' && (
          <div className="space-y-6 animate-in fade-in">
            <h2 className="text-2xl font-bold text-black">Study Materials</h2>
            {availableMaterials.length === 0 ? (
              <div className="text-center py-12"><BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" /><p className="text-gray-600">No study materials available yet.</p></div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {availableMaterials.map((material) => {
                  const module = modules.find(m => String(m.id) === String(material.moduleId));
                  const getIcon = () => {
                      const type = material.contentType ? material.contentType.toLowerCase() : (material.type || 'pdf');
                      if(type.includes('video')) return <Video className="w-5 h-5"/>;
                      if(type.includes('link')) return <LinkIcon className="w-5 h-5"/>;
                      return <File className="w-5 h-5"/>;
                  }
                  return (
                    <div key={material.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300">
                      <div className="h-32 bg-slate-100 flex items-center justify-center">{getIcon()}</div>
                      <div className="p-6">
                          <div className="flex items-center justify-between mb-2">
                             <h3 className="text-lg font-semibold text-gray-800 line-clamp-1">{material.title}</h3>
                             <span className="text-xs font-medium bg-gray-100 px-2 py-1 rounded text-gray-600 uppercase">{material.contentType || material.type || 'DOC'}</span>
                          </div>
                          <p className="text-sm text-gray-600 mb-4 line-clamp-2">{material.description || "No description."}</p>
                          <p className="text-xs text-gray-500 mb-4">Module: {module?.title || 'General'}</p>
                          <div className="pt-4 border-t border-gray-100 flex justify-end">
                             <button onClick={() => window.open(material.url, '_blank')} className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition-colors text-sm">View Material</button>
                          </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TESTS TAB (SEPARATED) */}
        {activeTab === 'tests' && (
          <div className="space-y-12 animate-in fade-in">
            {/* PENDING TESTS */}
            <div className="space-y-6">
                <div className="flex items-center gap-3">
                    <div className="bg-red-100 p-2 rounded-lg"><Clock className="w-6 h-6 text-red-600"/></div>
                    <h2 className="text-2xl font-bold text-black">Available Tests</h2>
                </div>
                {pendingTests.length === 0 ? (
                  <div className="text-center py-8 text-gray-500 bg-white rounded-xl border border-gray-200 border-dashed"><p>No new tests to write.</p></div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {pendingTests.map((test) => (
                        <div key={test.id} className="bg-white border-l-4 border-red-600 rounded-lg shadow-md p-6 hover:shadow-xl transition-shadow flex flex-col justify-between">
                          <div>
                              <div className="flex items-center mb-3"><Award className="w-6 h-6 text-red-600 mr-2" /><h3 className="text-lg font-semibold text-gray-800">{test.title}</h3></div>
                              <p className="text-sm text-gray-600 mb-4 line-clamp-2">{test.description || "No description."}</p>
                              <div className="space-y-1 mb-4">
                                 <p className="text-xs text-gray-500">Duration: <span className="font-medium text-gray-700">{test.timeLimitInMinutes ? `${test.timeLimitInMinutes} mins` : 'Untimed'}</span></p>
                                 <p className="text-xs text-gray-500">Marks: <span className="font-medium text-gray-700">{test.totalMarks}</span></p>
                              </div>
                          </div>
                          <button onClick={() => handleStartTest(test)} className="w-full bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition-colors text-sm font-medium">Start Test</button>
                        </div>
                    ))}
                  </div>
                )}
            </div>
            {/* COMPLETED TESTS */}
            <div className="space-y-6">
                <div className="flex items-center gap-3">
                    <div className="bg-green-100 p-2 rounded-lg"><CheckCircle className="w-6 h-6 text-green-600"/></div>
                    <h2 className="text-2xl font-bold text-black">Completed Tests</h2>
                </div>
                {completedTests.length === 0 ? (
                  <div className="text-center py-8 text-gray-500 bg-white rounded-xl border border-gray-200 border-dashed"><p>You haven't completed any tests yet.</p></div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {completedTests.map((test) => {
                        const attempt = myQuizAttempts.find(a => String(a.quizId) === String(test.id));
                        return (
                            <div key={test.id} className="bg-gray-50 border border-gray-200 rounded-lg p-6 flex flex-col justify-between opacity-80 hover:opacity-100 transition">
                              <div>
                                  <div className="flex items-center justify-between mb-3"><h3 className="text-lg font-semibold text-gray-700">{test.title}</h3><span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full font-bold">Completed</span></div>
                                  <div className="mt-4 bg-white p-3 rounded border border-gray-200 text-center">
                                     <p className="text-xs text-gray-500 uppercase font-bold">Your Score</p>
                                     <p className="text-2xl font-bold text-gray-900">{attempt?.score} / {attempt?.totalMarks}</p>
                                  </div>
                              </div>
                              <button disabled className="w-full mt-4 bg-gray-200 text-gray-500 px-4 py-2 rounded text-sm font-medium cursor-not-allowed">Already Submitted</button>
                            </div>
                        );
                    })}
                  </div>
                )}
            </div>
          </div>
        )}

        {/* ASSIGNMENTS TAB (SEPARATED) */}
        {activeTab === 'assignments' && (
          <div className="space-y-12 animate-in fade-in">
            {/* PENDING */}
            <div className="space-y-6">
                <div className="flex items-center gap-3">
                    <div className="bg-yellow-100 p-2 rounded-lg"><AlertCircle className="w-6 h-6 text-yellow-600"/></div>
                    <h2 className="text-2xl font-bold text-black">Pending Assignments</h2>
                </div>
                {pendingAssignments.length === 0 ? (
                  <div className="text-center py-8 text-gray-500 bg-white rounded-xl border border-gray-200 border-dashed"><p>No pending assignments.</p></div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {pendingAssignments.map((assignment) => (
                      <div key={assignment.id} className="bg-white rounded-lg shadow-md p-6 flex flex-col justify-between hover:shadow-lg transition-shadow border-l-4 border-yellow-500">
                        <div>
                            <div className="flex justify-between items-start mb-2">
                                <h3 className="text-lg font-semibold text-gray-800">{assignment.title}</h3>
                                <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full font-bold">To Do</span>
                            </div>
                            <p className="text-sm text-gray-600 mb-4 line-clamp-2">{assignment.description || "Complete the tasks before the deadline."}</p>
                        </div>
                        <div className="mt-auto pt-4 border-t border-gray-100">
                          <div className="flex justify-between items-center mb-3">
                              <p className="text-xs text-gray-500">Marks: {assignment.totalMarks}</p>
                              <p className="text-xs text-gray-500">Due: {new Date(assignment.dueDate).toLocaleDateString()}</p>
                          </div>
                          <div className="flex gap-2">
                               {assignment.fileUrl && (
                                   <button onClick={() => window.open(assignment.fileUrl, '_blank')} className="flex-1 bg-slate-100 text-slate-700 px-3 py-2 rounded text-sm hover:bg-slate-200 transition-colors">Download PDF</button>
                               )}
                               <button onClick={() => setSelectedAssignment(assignment)} className="flex-1 bg-red-600 text-white px-3 py-2 rounded text-sm hover:bg-red-700 transition-colors font-medium shadow-sm">Submit Work</button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
            </div>

            {/* SUBMITTED */}
            <div className="space-y-6">
                <div className="flex items-center gap-3">
                    <div className="bg-blue-100 p-2 rounded-lg"><CheckCircle className="w-6 h-6 text-blue-600"/></div>
                    <h2 className="text-2xl font-bold text-black">Submitted Assignments</h2>
                </div>
                {submittedAssignments.length === 0 ? (
                  <div className="text-center py-8 text-gray-500 bg-white rounded-xl border border-gray-200 border-dashed"><p>No submissions yet.</p></div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {submittedAssignments.map((assignment) => {
                      const submission = assignmentSubmissions.find(s => String(s.assignmentId) === String(assignment.id));
                      const isGraded = submission && (submission.grade !== undefined && submission.grade !== null);
                      return (
                        <div key={assignment.id} className="bg-gray-50 border border-gray-200 rounded-lg p-6 flex flex-col justify-between">
                          <div>
                              <div className="flex justify-between items-start mb-3">
                                  <h3 className="text-lg font-semibold text-gray-800">{assignment.title}</h3>
                                  <span className={`text-xs px-2 py-1 rounded-full font-bold ${isGraded ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>{isGraded ? 'Graded' : 'Submitted'}</span>
                              </div>
                              {isGraded ? (
                                  <div className="bg-white p-4 rounded-lg border border-green-200 mb-3 shadow-sm">
                                      <div className="flex justify-between items-center mb-1">
                                          <span className="text-xs text-gray-500 font-bold uppercase tracking-wide">Final Grade</span>
                                          <span className="text-xl font-bold text-green-700">{submission.grade} / {assignment.totalMarks || 100}</span>
                                      </div>
                                      {submission.feedback && <div className="text-sm text-gray-600 italic border-t border-gray-100 pt-2 mt-2 bg-gray-50 p-2 rounded">"{submission.feedback}"</div>}
                                  </div>
                              ) : (
                                  <div className="bg-white p-3 rounded border border-gray-200 mb-3 text-center"><Clock className="w-5 h-5 text-gray-400 mx-auto mb-1"/><p className="text-xs text-gray-500 italic">Waiting for grading...</p></div>
                              )}
                          </div>
                          <div className="flex space-x-2 mt-4">
                               <button onClick={() => window.open(submission?.fileUrl, '_blank')} className="flex-1 bg-white border border-gray-300 text-gray-700 px-3 py-2 rounded text-sm hover:bg-gray-50 font-medium">View My File</button>
                               {!isGraded && <button onClick={() => setSelectedAssignment(assignment)} className="flex-1 bg-blue-600 text-white px-3 py-2 rounded text-sm hover:bg-blue-700 font-medium shadow-sm">Resubmit</button>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
            </div>
          </div>
        )}

        {/* CHAT TAB */}
        {activeTab === 'chat' && (
          <div className="space-y-6 animate-in fade-in">
            <h2 className="text-2xl font-bold text-black">Chat with Instructors & Peers</h2>
            <div className="bg-white p-6 rounded-lg shadow-md">
                 <ChatSystem currentUser={user} users={usersList.filter(u => u.id !== user.id)} messages={messages} onSendMessage={handleSendMessage} onMarkAsRead={() => {}} />
            </div>
          </div>
        )}

        {/* DISCUSSIONS TAB */}
        {activeTab === 'discussions' && (
          <div className="space-y-6 animate-in fade-in">
            <h2 className="text-2xl font-bold text-black">Course Discussions</h2>
             <div className="bg-white p-6 rounded-lg shadow-md">
                <DiscussionForum discussions={[]} courses={courses} modules={modules} users={usersList} currentUser={user} onCreateDiscussion={() => {}} onReplyToDiscussion={() => {}} />
             </div>
          </div>
        )}
      </div>

      {/* MODAL */}
      {selectedAssignment && (
        <AssignmentSubmitModal 
            assignment={selectedAssignment} 
            currentUser={user} 
            onClose={() => setSelectedAssignment(null)} 
            onDataMutated={() => { fetchData(); setSelectedAssignment(null); }} 
        />
      )}
    </div>
  );
};