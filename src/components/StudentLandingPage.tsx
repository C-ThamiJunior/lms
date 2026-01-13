import React from 'react';
import { User, Course, Test, Assignment, Enrollment } from '../types/lms';
import { BookOpen, Clock, CheckCircle, LogOut, LayoutDashboard, PlusCircle, Search } from 'lucide-react';

interface StudentLandingPageProps {
  currentUser: User;
  courses: Course[]; // All available courses
  enrollments: Enrollment[]; // User's enrollments
  tests: Test[];
  assignments: Assignment[];
  onNavigateToDashboard: () => void;
  onNavigateToCatalog: () => void; // ✅ NEW PROP
  onLogout: () => void;
}

export const StudentLandingPage: React.FC<StudentLandingPageProps> = ({
  currentUser,
  courses,
  enrollments,
  tests,
  assignments,
  onNavigateToDashboard,
  onNavigateToCatalog,
  onLogout,
}) => {
  
  // Filter to find only the courses the student is enrolled in
  // Note: This relies on Enrollment type having 'course' property (Fixed in types/lms.ts)
  const myCourses = courses.filter(course => 
    enrollments.some(e => String(e.course.id) === String(course.id))
  );

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b shadow-sm sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <BookOpen className="text-red-600 w-8 h-8" />
            <h1 className="text-xl font-bold text-gray-800">Student Portal</h1>
          </div>
          <div className="flex items-center gap-4">
             <span className="text-sm text-gray-600">Welcome, <b>{currentUser.name || currentUser.firstname}</b></span>
             <button onClick={onLogout} className="text-gray-500 hover:text-red-600">
               <LogOut size={20} />
             </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-8 space-y-8">
        
        {/* Quick Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
           <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
              <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
                <BookOpen size={24} />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{myCourses.length}</p>
                <p className="text-sm text-gray-500">Active Courses</p>
              </div>
           </div>
           
           <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
              <div className="p-3 bg-orange-50 text-orange-600 rounded-lg">
                <Clock size={24} />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{assignments.length}</p>
                <p className="text-sm text-gray-500">Pending Assignments</p>
              </div>
           </div>

           <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
              <div className="p-3 bg-green-50 text-green-600 rounded-lg">
                <CheckCircle size={24} />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{tests.length}</p>
                <p className="text-sm text-gray-500">Tests Available</p>
              </div>
           </div>
        </div>

        {/* Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* 1. Go to Dashboard */}
            <div 
              onClick={onNavigateToDashboard}
              className="group bg-white p-8 rounded-xl shadow-sm border border-gray-200 hover:shadow-md hover:border-red-200 cursor-pointer transition-all flex flex-col items-center text-center"
            >
                <div className="mb-4 p-4 bg-gray-50 rounded-full group-hover:bg-red-50 group-hover:text-red-600 transition-colors">
                    <LayoutDashboard size={40} className="text-gray-400 group-hover:text-red-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Go to My Dashboard</h3>
                <p className="text-gray-500">Continue learning, take tests, and submit assignments.</p>
            </div>

            {/* 2. Register for Courses (✅ NEW FEATURE) */}
            <div 
              onClick={onNavigateToCatalog}
              className="group bg-white p-8 rounded-xl shadow-sm border border-gray-200 hover:shadow-md hover:border-blue-200 cursor-pointer transition-all flex flex-col items-center text-center"
            >
                <div className="mb-4 p-4 bg-gray-50 rounded-full group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                    <Search size={40} className="text-gray-400 group-hover:text-blue-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Browse Course Catalog</h3>
                <p className="text-gray-500">Find new courses and enroll to expand your knowledge.</p>
                <button className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition">
                   Register Now
                </button>
            </div>
        </div>

        {/* Recent Enrollments List */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100">
                <h3 className="font-bold text-gray-800">My Enrolled Courses</h3>
            </div>
            <div className="divide-y divide-gray-100">
                {myCourses.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">
                        You are not enrolled in any courses yet.
                    </div>
                ) : (
                    myCourses.map(course => (
                        <div key={course.id} className="p-6 flex justify-between items-center hover:bg-gray-50 transition">
                            <div>
                                <h4 className="font-bold text-gray-900">{course.title}</h4>
                                <p className="text-sm text-gray-500 line-clamp-1">{course.description}</p>
                            </div>
                            <button onClick={onNavigateToDashboard} className="text-sm font-medium text-red-600 hover:underline">
                                Continue &rarr;
                            </button>
                        </div>
                    ))
                )}
            </div>
        </div>

      </main>
    </div>
  );
};