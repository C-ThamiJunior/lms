import React from 'react';
import { User, Course, Test, Assignment, StudyMaterial, Module } from '../types/lms';
import { BookOpen, FileText, Upload, Users, TrendingUp, Plus, LogOut, Play } from 'lucide-react';

interface FacilitatorLandingPageProps {
  currentUser: User;
  courses: Course[];
  tests: Test[];
  assignments: Assignment[];
  studyMaterials: StudyMaterial[];
  modules: Module[];
  users: User[];
  onNavigateToDashboard: () => void;
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
  onLogout,
}) => {
  // Get facilitator's courses
  const myCourses = courses.filter(course => course.facilitatorId === currentUser.id);
  
  // Get materials for facilitator's courses
  const myMaterials = studyMaterials.filter(material => {
    const module = modules.find(m => m.id === material.moduleId);
    return module && myCourses.some(c => c.id === module.courseId);
  });

  // Get tests and assignments for facilitator's courses
  const myTests = tests.filter(test => myCourses.some(c => c.id === test.courseId));
  const myAssignments = assignments.filter(assignment => myCourses.some(c => c.id === assignment.courseId));

  const students = users.filter(u => u.role === 'student');
  const activeStudents = students.filter(s => s.isActive);

  // Recent activity (simplified)
  const recentActivities = [
    { action: 'Course Created', details: 'New course materials uploaded', time: '2 hours ago' },
    { action: 'Test Published', details: 'Mathematics Quiz now available', time: '1 day ago' },
    { action: 'Assignment Graded', details: '15 submissions reviewed', time: '2 days ago' },
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
                <span className="font-medium">{currentUser.name}</span>
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
              Welcome back, {currentUser.name}!
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
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">My Courses</p>
                <p className="text-3xl font-bold text-black">{myCourses.length}</p>
              </div>
              <BookOpen className="w-8 h-8 text-red-600" />
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Study Materials</p>
                <p className="text-3xl font-bold text-blue-600">{myMaterials.length}</p>
              </div>
              <Upload className="w-8 h-8 text-blue-600" />
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Tests Created</p>
                <p className="text-3xl font-bold text-green-600">{myTests.length}</p>
              </div>
              <FileText className="w-8 h-8 text-green-600" />
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Students</p>
                <p className="text-3xl font-bold text-purple-600">{activeStudents.length}</p>
              </div>
              <Users className="w-8 h-8 text-purple-600" />
            </div>
          </div>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* My Courses */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-black mb-4 flex items-center space-x-2">
              <BookOpen className="w-5 h-5 text-red-600" />
              <span>My Courses</span>
            </h2>
            
            {myCourses.length === 0 ? (
              <div className="text-center py-8">
                <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600">No courses created yet</p>
                <p className="text-sm text-gray-500">Start by creating your first course</p>
              </div>
            ) : (
              <div className="space-y-4">
                {myCourses.slice(0, 3).map(course => (
                  <div key={course.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="font-medium text-black">{course.title}</h3>
                        <p className="text-sm text-gray-600">{course.description}</p>
                      </div>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        course.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {course.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500">
                      Created: {new Date(course.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                ))}
                {myCourses.length > 3 && (
                  <p className="text-sm text-gray-500 text-center">
                    +{myCourses.length - 3} more courses
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-black mb-4 flex items-center space-x-2">
              <TrendingUp className="w-5 h-5 text-red-600" />
              <span>Recent Activity</span>
            </h2>
            
            <div className="space-y-4">
              {recentActivities.map((activity, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
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

        {/* Quick Actions */}
        <div className="mt-8">
          <h2 className="text-xl font-semibold text-black mb-6 text-center">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <button
              onClick={onNavigateToDashboard}
              className="bg-red-600 text-white p-6 rounded-lg hover:bg-red-700 transition-colors flex flex-col items-center space-y-3"
            >
              <Plus className="w-8 h-8" />
              <span className="font-medium">Create Course</span>
              <span className="text-sm opacity-90">Start a new course</span>
            </button>
            
            <button
              onClick={onNavigateToDashboard}
              className="bg-blue-600 text-white p-6 rounded-lg hover:bg-blue-700 transition-colors flex flex-col items-center space-y-3"
            >
              <Upload className="w-8 h-8" />
              <span className="font-medium">Upload Materials</span>
              <span className="text-sm opacity-90">Add study content</span>
            </button>
            
            <button
              onClick={onNavigateToDashboard}
              className="bg-green-600 text-white p-6 rounded-lg hover:bg-green-700 transition-colors flex flex-col items-center space-y-3"
            >
              <FileText className="w-8 h-8" />
              <span className="font-medium">Create Test</span>
              <span className="text-sm opacity-90">Design assessments</span>
            </button>
            
            <button
              onClick={onNavigateToDashboard}
              className="bg-purple-600 text-white p-6 rounded-lg hover:bg-purple-700 transition-colors flex flex-col items-center space-y-3"
            >
              <Users className="w-8 h-8" />
              <span className="font-medium">View Students</span>
              <span className="text-sm opacity-90">Monitor progress</span>
            </button>
          </div>
        </div>

        {/* Performance Overview */}
        <div className="mt-8 bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-black mb-4 flex items-center space-x-2">
            <TrendingUp className="w-5 h-5 text-red-600" />
            <span>Teaching Overview</span>
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-red-600 mb-2">{myTests.length + myAssignments.length}</div>
              <p className="text-gray-600">Total Assessments</p>
            </div>
            
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600 mb-2">{myMaterials.length}</div>
              <p className="text-gray-600">Materials Uploaded</p>
            </div>
            
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600 mb-2">{myCourses.filter(c => c.isActive).length}</div>
              <p className="text-gray-600">Active Courses</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};