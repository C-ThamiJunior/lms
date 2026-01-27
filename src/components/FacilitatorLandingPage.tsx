import React from 'react';
import { User, Course, Test, Assignment, StudyMaterial, Module } from '../types/lms';
import { BookOpen, FileText, Upload, Users, TrendingUp, Plus, LogOut, Play, CheckCircle } from 'lucide-react';

interface FacilitatorLandingPageProps {
  currentUser: User;
  courses: Course[];
  tests: Test[];
  assignments: Assignment[];
  studyMaterials: StudyMaterial[];
  modules: Module[];
  users: User[];
  onNavigateToDashboard: () => void;
  onNavigateToGrading: () => void; // ✅ Added missing prop definition
  onLogout: () => void;
}

export const FacilitatorLandingPage: React.FC<FacilitatorLandingPageProps> = ({
  currentUser,
  courses,
  tests,
  assignments,
  studyMaterials,
  modules,
  users,
  onNavigateToDashboard,
  onNavigateToGrading, // ✅ Added to props
  onLogout,
}) => {
  // Get facilitator's courses
  const myCourses = courses.filter(course => String(course.facilitatorId) === String(currentUser.id));
  
  // Get materials for facilitator's courses
  const myMaterials = studyMaterials.filter(material => {
    const module = modules.find(m => String(m.id) === String(material.moduleId));
    return module && myCourses.some(c => String(c.id) === String(module.courseId));
  });

  // Get tests and assignments for facilitator's courses
  const myTests = tests.filter(test => myCourses.some(c => String(c.id) === String(test.courseId)));
  const myAssignments = assignments.filter(assignment => myCourses.some(c => String(c.id) === String(assignment.courseId)));

  const students = users.filter(u => String(u.role).toUpperCase() === 'STUDENT');
  const activeStudents = students.filter(s => s.isActive);

  // Recent activity (simplified/mocked for visual)
  const recentActivities = [
    { action: 'System Ready', details: 'Dashboard loaded successfully', time: 'Just now' },
    { action: 'Courses Sync', details: `${myCourses.length} courses loaded`, time: '1 min ago' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-black text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <BookOpen className="w-8 h-8 text-red-600" />
              <h1 className="text-xl font-bold">Facilitator Portal</h1>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-sm">
                <span className="text-gray-300">Welcome back, </span>
                <span className="font-medium">{currentUser.firstname || currentUser.name}</span>
              </div>
              <button
                onClick={onLogout}
                className="flex items-center space-x-2 text-gray-300 hover:text-white transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="bg-white rounded-lg shadow-md p-8 mb-8">
          <div className="text-center">
            <div className="mx-auto w-20 h-20 bg-red-600 rounded-full flex items-center justify-center mb-6">
              <Users className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-black mb-4">
              Welcome back, {currentUser.firstname || currentUser.name}!
            </h1>
            <p className="text-gray-600 text-lg mb-6">
              Ready to inspire and educate? Manage your courses and track student progress.
            </p>
            <button
              onClick={onNavigateToDashboard}
              className="bg-red-600 text-white px-8 py-3 rounded-lg hover:bg-red-700 transition-colors flex items-center space-x-2 mx-auto"
            >
              <Play className="w-5 h-5" />
              <span>Go to Dashboard</span>
            </button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-red-600">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">My Courses</p>
                <p className="text-3xl font-bold text-black">{myCourses.length}</p>
              </div>
              <BookOpen className="w-8 h-8 text-red-100" />
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-blue-600">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Study Materials</p>
                <p className="text-3xl font-bold text-blue-600">{myMaterials.length}</p>
              </div>
              <Upload className="w-8 h-8 text-blue-100" />
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-green-600">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Assessments</p>
                <p className="text-3xl font-bold text-green-600">{myTests.length + myAssignments.length}</p>
              </div>
              <FileText className="w-8 h-8 text-green-100" />
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-purple-600">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Users</p>
                <p className="text-3xl font-bold text-purple-600">{users.length}</p>
              </div>
              <Users className="w-8 h-8 text-purple-100" />
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8 mb-8">
          <h2 className="text-xl font-semibold text-black mb-6 text-center">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <button
              onClick={onNavigateToDashboard}
              className="bg-white border border-gray-200 p-6 rounded-xl hover:shadow-lg transition-all flex flex-col items-center space-y-3 group"
            >
              <div className="p-3 bg-red-50 rounded-full group-hover:bg-red-600 transition-colors">
                 <Plus className="w-6 h-6 text-red-600 group-hover:text-white" />
              </div>
              <span className="font-bold text-gray-800">Create Course</span>
            </button>
            
            <button
              onClick={onNavigateToDashboard}
              className="bg-white border border-gray-200 p-6 rounded-xl hover:shadow-lg transition-all flex flex-col items-center space-y-3 group"
            >
              <div className="p-3 bg-blue-50 rounded-full group-hover:bg-blue-600 transition-colors">
                 <Upload className="w-6 h-6 text-blue-600 group-hover:text-white" />
              </div>
              <span className="font-bold text-gray-800">Upload Content</span>
            </button>
            
            <button
              onClick={onNavigateToDashboard}
              className="bg-white border border-gray-200 p-6 rounded-xl hover:shadow-lg transition-all flex flex-col items-center space-y-3 group"
            >
              <div className="p-3 bg-green-50 rounded-full group-hover:bg-green-600 transition-colors">
                 <FileText className="w-6 h-6 text-green-600 group-hover:text-white" />
              </div>
              <span className="font-bold text-gray-800">Create Test</span>
            </button>
            
            {/* ✅ NEW: Grading Center Button */}
            <button
              onClick={onNavigateToGrading}
              className="bg-white border border-gray-200 p-6 rounded-xl hover:shadow-lg transition-all flex flex-col items-center space-y-3 group"
            >
              <div className="p-3 bg-purple-50 rounded-full group-hover:bg-purple-600 transition-colors">
                 <CheckCircle className="w-6 h-6 text-purple-600 group-hover:text-white" />
              </div>
              <span className="font-bold text-gray-800">Grading Center</span>
            </button>
          </div>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* My Courses */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-black mb-4 flex items-center space-x-2">
              <BookOpen className="w-5 h-5 text-red-600" />
              <span>My Recent Courses</span>
            </h2>
            
            {myCourses.length === 0 ? (
              <div className="text-center py-8">
                <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600">No courses created yet</p>
                <button onClick={onNavigateToDashboard} className="text-sm text-red-600 font-bold mt-2 hover:underline">Go to Dashboard to Create</button>
              </div>
            ) : (
              <div className="space-y-4">
                {myCourses.slice(0, 3).map(course => (
                  <div key={course.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="font-medium text-black">{course.title}</h3>
                        <p className="text-sm text-gray-600 line-clamp-1">{course.description}</p>
                      </div>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        course.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {course.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-black mb-4 flex items-center space-x-2">
              <TrendingUp className="w-5 h-5 text-red-600" />
              <span>Recent System Activity</span>
            </h2>
            
            <div className="space-y-4">
              {recentActivities.map((activity, index) => (
                <div key={index} className="border-l-4 border-red-200 bg-gray-50 p-4 rounded-r-lg">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium text-black">{activity.action}</h3>
                      <p className="text-sm text-gray-600">{activity.details}</p>
                    </div>
                    <span className="text-xs text-gray-500">{activity.time}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};