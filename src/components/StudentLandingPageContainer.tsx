import React, { useState, useEffect } from 'react';
import { StudentLandingPage } from './StudentLandingPage';
import { User, Course, Test, Assignment, Enrollment } from '../types/lms';

export const StudentLandingPageContainer: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<{
    currentUser: User | null;
    courses: Course[];
    enrollments: Enrollment[];
    tests: Test[];
    assignments: Assignment[];
  }>({
    currentUser: null,
    courses: [],
    enrollments: [],
    tests: [],
    assignments: [],
  });

  // Helper for authenticated fetch
  const fetchWithAuth = async (url: string) => {
    const token = localStorage.getItem('token');
    if (!token) throw new Error("No token found");
    
    const res = await fetch(url, {
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json' 
      }
    });
    if (!res.ok) throw new Error(`Failed to fetch ${url}`);
    return res.json();
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const userStr = localStorage.getItem('user');
        if (!userStr) {
           window.location.href = '/login';
           return;
        }
        const currentUser = JSON.parse(userStr);

        // Fetch Data in Parallel
        const [coursesData, enrollmentsData, assignmentsData, quizzesData] = await Promise.all([
          fetchWithAuth('/api/courses'),                    // All Courses (for catalog logic)
          fetchWithAuth(`/api/enrollments/user/${currentUser.id}`), // My Enrollments
          fetchWithAuth('/api/assignments'),                // All Assignments
          fetchWithAuth('/api/quizzes')                     // All Tests
        ]);

        // FILTERING: Only show assignments/tests for courses the student is enrolled in
        const enrolledCourseIds = enrollmentsData.map((e: any) => e.course.id.toString());

        const myAssignments = assignmentsData.filter((a: any) => 
          enrolledCourseIds.includes(a.courseId.toString()) && a.isActive
        );

        const myTests = quizzesData.filter((t: any) => 
          enrolledCourseIds.includes(t.courseId.toString()) && t.isActive
        );

        setData({
          currentUser,
          courses: coursesData,
          enrollments: enrollmentsData,
          tests: myTests,
          assignments: myAssignments
        });

      } catch (error) {
        console.error("Error loading landing page:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  };

  const handleNavigateToDashboard = () => {
    window.location.href = '/dashboard';
  };

  const handleNavigateToCatalog = () => {
    // You can route this to a dedicated catalog page or modal
    window.location.href = '/course-catalog'; 
  };

  if (loading || !data.currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      </div>
    );
  }

  return (
    <StudentLandingPage
      currentUser={data.currentUser}
      courses={data.courses}
      enrollments={data.enrollments}
      tests={data.tests}
      assignments={data.assignments}
      onNavigateToDashboard={handleNavigateToDashboard}
      onNavigateToCatalog={handleNavigateToCatalog}
      onLogout={handleLogout}
    />
  );
};