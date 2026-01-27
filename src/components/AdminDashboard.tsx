// src/components/AdminDashboard.tsx
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import axios from 'axios';
import {
  User,
  ActivityLog,
  Course,
  Test,
  Assignment,
} from '../types/lms';
import {
  Users,
  Activity,
  LogOut,
  Shield,
  BookOpen,
  PlusCircle,
  Edit2,
  Trash2,
  TrendingUp,
  UserPlus,
  BarChart,
  FileText,
  Clipboard,
  Settings,
  Search
} from 'lucide-react';

interface AdminDashboardProps {
  currentUser: User;
  onLogout: () => void;
  onResetPassword: (userId: string, newPass: string) => Promise<void>;
  onToggleUserStatus: (userId: string) => Promise<void>;
}

// API Configuration
const API_BASE_URL = 'https://b-t-backend-uc9w.onrender.com/api';
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    Authorization: `Bearer ${localStorage.getItem('token')}`,
  },
});

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  currentUser,
  onLogout,
  onResetPassword,
  onToggleUserStatus,
}) => {
  const [activeTab, setActiveTab] = useState<
    'dashboard' | 'users' | 'courses' | 'assessments' | 'reports' | 'activity' | 'system'
  >('dashboard');

  // --- Data State ---
  const [users, setUsers] = useState<User[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [quizzes, setQuizzes] = useState<Test[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // --- Form State ---
  const [showCreateCourse, setShowCreateCourse] = useState(false);
  const [courseForm, setCourseForm] = useState({ title: '', description: '', facilitatorId: '' });
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);

  // --- Data Fetching ---
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [usersRes, coursesRes, quizzesRes, assignmentsRes] = await Promise.all([
        api.get<User[]>('/users'),
        api.get<Course[]>('/courses'),
        api.get<Test[]>('/quizzes'),
        api.get<Assignment[]>('/assignments'),
      ]);

      setUsers(usersRes.data);
      setCourses(coursesRes.data);
      setQuizzes(quizzesRes.data);
      setAssignments(assignmentsRes.data);
      setError(null);
    } catch (err: any) {
      console.error('Failed to fetch admin data', err);
      setError('Failed to load data. Is the server running?');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // --- Derived Data ---
  const facilitators = useMemo(() => users.filter(u => u.role === 'FACILITATOR'), [users]);
  
  const stats = {
    totalUsers: users.length,
    courses: courses.length,
    assessments: quizzes.length + assignments.length,
  };

  // --- Handlers ---
  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingCourse) {
        // Mock Update
        alert(`Updated ${courseForm.title} (API Update endpoint pending)`);
      } else {
        const res = await api.post('/courses', {
            title: courseForm.title,
            description: courseForm.description,
            facilitatorId: Number(courseForm.facilitatorId)
        });
        setCourses([...courses, res.data]);
        alert("Course Created!");
      }
      setShowCreateCourse(false);
      setCourseForm({ title: '', description: '', facilitatorId: '' });
      setEditingCourse(null);
    } catch (err) {
      alert("Failed to save course");
    }
  };

  const handleDeleteCourse = async (id: string) => {
      if(!confirm("Are you sure?")) return;
      try {
          await api.delete(`/courses/${id}`);
          setCourses(courses.filter(c => c.id !== id));
      } catch (e) { alert("Failed to delete"); }
  }

  // --- Tab Configuration (Matches LMS-Front-end (2)) ---
  const tabs = [
    { key: "dashboard", label: "Dashboard", icon: BarChart },
    { key: "users", label: "User Management", icon: Users },
    { key: "courses", label: "Course Management", icon: BookOpen },
    { key: "assessments", label: "Assessments", icon: FileText },
    { key: "reports", label: "Reports", icon: BarChart },
    { key: "activity", label: "Activity Logs", icon: Clipboard },
    { key: "system", label: "System Settings", icon: Settings },
  ];

  if (loading) return <div className="p-10 text-center">Loading Dashboard...</div>;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      
      {/* --- HEADER (Styled to match (2)) --- */}
      <header className="bg-white text-black border-b border-red-600 shadow-sm sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <Shield className="w-8 h-8 text-red-600" />
              <h1 className="text-xl font-bold text-red-600">Admin Dashboard</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">Welcome, {currentUser.name}</span>
              <button
                onClick={onLogout}
                className="flex items-center space-x-2 text-gray-500 hover:text-red-600 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* --- TABS (Folder Style from (2)) --- */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full mt-6">
        <div className="overflow-x-auto border-b-2 border-red-600 flex space-x-1">
            {tabs.map((tab) => (
            <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`flex items-center space-x-2 px-6 py-3 rounded-t-lg transition-colors whitespace-nowrap text-sm font-medium ${
                activeTab === tab.key
                    ? "bg-red-600 text-white shadow-sm"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-900"
                }`}
            >
                <tab.icon className="w-4 h-4" />
                <span>{tab.label}</span>
            </button>
            ))}
        </div>
      </div>

      {/* --- CONTENT AREA --- */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        
        {/* DASHBOARD OVERVIEW */}
        {activeTab === 'dashboard' && (
          <div>
            <h2 className="text-3xl font-bold text-black mb-6">Admin Overview</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Total Users Card */}
              <div className="bg-white text-slate-600 rounded-xl shadow-md p-6 flex flex-col justify-between h-56 border border-gray-100">
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-red-50 rounded-full">
                    <Users className="w-8 h-8 text-red-600" />
                  </div>
                  <h3 className="text-xl font-semibold">Total Users</h3>
                </div>
                <div className="mt-4 text-4xl font-bold text-slate-800">{stats.totalUsers}</div>
                <p className="mt-2 text-slate-500 text-sm">
                  Includes students, facilitators, and admins.
                </p>
              </div>

              {/* Total Courses Card */}
              <div className="bg-white text-slate-600 rounded-xl shadow-md p-6 flex flex-col justify-between h-56 border border-gray-100">
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-blue-50 rounded-full">
                    <BookOpen className="w-8 h-8 text-blue-600" />
                  </div>
                  <h3 className="text-xl font-semibold">Total Courses</h3>
                </div>
                <div className="mt-4 text-4xl font-bold text-slate-800">{stats.courses}</div>
                <p className="mt-2 text-slate-500 text-sm">
                  Active courses managed by facilitators.
                </p>
              </div>

              {/* Assessments Card */}
              <div className="bg-white text-slate-600 rounded-xl shadow-md p-6 flex flex-col justify-between h-56 border border-gray-100">
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-green-50 rounded-full">
                    <FileText className="w-8 h-8 text-green-600" />
                  </div>
                  <h3 className="text-xl font-semibold">Total Assessments</h3>
                </div>
                <div className="mt-4 text-4xl font-bold text-slate-800">{stats.assessments}</div>
                <p className="mt-2 text-slate-500 text-sm">
                  Quizzes and Assignments combined.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* USERS MANAGEMENT */}
        {activeTab === 'users' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-black">User Management</h2>
              <button
                onClick={() => alert("Add User Modal Logic Here")} // Placeholder for modal
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
              >
                <UserPlus className="w-4 h-4" /> Add User
              </button>
            </div>
            
            <div className="overflow-hidden bg-white rounded-lg shadow-md border border-gray-200">
              <table className="min-w-full text-left">
                <thead className="bg-slate-800 text-white">
                  <tr>
                    <th className="px-6 py-4 font-semibold text-sm">Name</th>
                    <th className="px-6 py-4 font-semibold text-sm">Email</th>
                    <th className="px-6 py-4 font-semibold text-sm">Role</th>
                    <th className="px-6 py-4 font-semibold text-sm">Status</th>
                    <th className="px-6 py-4 font-semibold text-sm">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {users.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 text-gray-800 font-medium">{user.name || user.firstname}</td>
                      <td className="px-6 py-4 text-gray-600">{user.email}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded text-xs font-semibold uppercase ${
                            user.role === 'admin' ? 'bg-purple-100 text-purple-700' :
                            user.role === 'facilitator' ? 'bg-blue-100 text-blue-700' :
                            'bg-green-100 text-green-700'
                        }`}>
                            {user.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-600">Active</td>
                      <td className="px-6 py-4 flex space-x-2">
                        <button className="bg-slate-800 text-white px-3 py-1 rounded text-xs hover:bg-slate-700 flex items-center gap-1">
                          <Edit2 className="w-3 h-3" /> Edit
                        </button>
                        <button 
                            onClick={() => onToggleUserStatus(user.id)}
                            className="bg-red-600 text-white px-3 py-1 rounded text-xs hover:bg-red-700 flex items-center gap-1">
                          <Shield className="w-3 h-3" /> Toggle
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

         {/* Course Management Content */}
        {activeTab === 'courses' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-black">Manage Courses</h2>
              <button
                onClick={() => setShowCreateCourse(!showCreateCourse)}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
              >
                <PlusCircle className="w-4 h-4" /> {showCreateCourse ? 'Cancel' : 'Add Course'}
              </button>
            </div>

            {showCreateCourse && (
                <div className="bg-white p-6 rounded-lg shadow-md mb-8 border-l-4 border-red-600">
                    <h3 className="text-lg font-bold text-gray-800 mb-4">Create New Course</h3>
                    <form onSubmit={handleCreateCourse} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Course Title</label>
                                <input 
                                    className="p-2 border border-gray-300 rounded w-full"
                                    value={courseForm.title}
                                    onChange={e => setCourseForm({...courseForm, title: e.target.value})}
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Assign Facilitator</label>
                                <select 
                                    className="p-2 border border-gray-300 rounded w-full"
                                    value={courseForm.facilitatorId}
                                    onChange={e => setCourseForm({...courseForm, facilitatorId: e.target.value})}
                                    required
                                >
                                    <option value="">Select Facilitator</option>
                                    {facilitators.map(f => (
                                        <option key={f.id} value={f.id}>{f.firstname} {f.surname}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                            <textarea 
                                className="p-2 border border-gray-300 rounded w-full"
                                rows={3}
                                value={courseForm.description}
                                onChange={e => setCourseForm({...courseForm, description: e.target.value})}
                                required
                            />
                        </div>
                        <button type="submit" className="bg-black text-white px-6 py-2 rounded hover:bg-gray-800">
                            Save Course
                        </button>
                    </form>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {courses.map((course) => (
                <div key={course.id} className="bg-white rounded-lg shadow p-6 border border-gray-200">
                    <h3 className="text-xl font-bold text-gray-800">{course.title}</h3>
                    <p className="text-gray-600 text-sm mt-2 mb-4 line-clamp-2">{course.description}</p>
                    <div className="flex justify-between items-center pt-4 border-t">
                        <span className="text-xs text-gray-500">
                            Facilitator: {users.find(u => u.id === course.facilitatorId)?.firstname || 'Unassigned'}
                        </span>
                        <button onClick={() => handleDeleteCourse(course.id)} className="text-red-500 hover:text-red-700">
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ASSESSMENTS (Table View) */}
        {activeTab === 'assessments' && (
             <div>
             <div className="flex justify-between items-center mb-6">
               <h2 className="text-2xl font-bold text-black">Assessments</h2>
             </div>
             <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
                <table className="min-w-full text-left">
                    <thead className="bg-slate-800 text-white">
                        <tr>
                            <th className="px-6 py-4 text-sm font-semibold">Title</th>
                            <th className="px-6 py-4 text-sm font-semibold">Type</th>
                            <th className="px-6 py-4 text-sm font-semibold">Course/Module</th>
                            <th className="px-6 py-4 text-sm font-semibold">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {quizzes.map(q => (
                            <tr key={q.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 text-gray-800 font-medium">{q.title}</td>
                                <td className="px-6 py-4"><span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">Quiz</span></td>
                                <td className="px-6 py-4 text-gray-600">Module: {q.moduleId}</td>
                                <td className="px-6 py-4 flex gap-2">
                                    <button className="text-slate-500 hover:text-blue-600"><Edit2 className="w-4 h-4"/></button>
                                </td>
                            </tr>
                        ))}
                        {assignments.map(a => (
                            <tr key={a.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 text-gray-800 font-medium">{a.title}</td>
                                <td className="px-6 py-4"><span className="bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded">Assignment</span></td>
                                <td className="px-6 py-4 text-gray-600">Module: {a.moduleId}</td>
                                <td className="px-6 py-4 flex gap-2">
                                    <button className="text-slate-500 hover:text-blue-600"><Edit2 className="w-4 h-4"/></button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
             </div>
           </div>
        )}

        {/* Placeholders for other tabs */}
        {['reports', 'activity', 'system'].includes(activeTab) && (
            <div className="bg-white p-12 rounded-lg shadow-md text-center border border-gray-200">
                <Settings className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-gray-800 capitalize">{activeTab}</h3>
                <p className="text-gray-500 mt-2">This module is currently under development.</p>
            </div>
        )}

      </div>
    </div>
  );
};