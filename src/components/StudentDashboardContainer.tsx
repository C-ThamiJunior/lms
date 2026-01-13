// LMS-Front-end/src/components/StudentDashboardContainer.tsx

import React, { useState, useEffect } from 'react';
import { StudentDashboard } from './StudentDashboard';
import { User, Course, Test, Assignment, StudyMaterial, Module, ChatMessage, AssignmentSubmission } from '../types/lms';

export const StudentDashboardContainer: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [dashboardData, setDashboardData] = useState<{
    currentUser: User | null;
    courses: Course[];
    tests: Test[];
    assignments: Assignment[];
    studyMaterials: StudyMaterial[];
    modules: Module[];
    messages: ChatMessage[];
    users: User[];
    assignmentSubmissions: AssignmentSubmission[];
  }>({
    currentUser: null,
    courses: [],
    tests: [],
    assignments: [],
    studyMaterials: [],
    modules: [],
    messages: [],
    users: [],
    assignmentSubmissions: []
  });

  const fetchWithAuth = async (url: string) => {
    const token = localStorage.getItem('token');
    if (!token) throw new Error("No authentication token found.");
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    if (!response.ok) throw new Error(`API Error: ${response.statusText}`);
    return response.json();
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const userStr = localStorage.getItem('user');
        if (!userStr) { window.location.href = '/login'; return; }
        const parsedUser = JSON.parse(userStr);

        // Fetch Data
        const results = await Promise.allSettled([
            fetchWithAuth(`/api/users/${parsedUser.id}`),
            fetchWithAuth(`/api/enrollments/user/${parsedUser.id}`),
            fetchWithAuth('/api/lessons'),
            fetchWithAuth('/api/modules'),
            fetchWithAuth('/api/assignments'),
            fetchWithAuth('/api/quizzes'),
            fetchWithAuth('/api/submissions/assignment')
        ]);

        const getResult = (index: number) => results[index].status === 'fulfilled' ? (results[index] as PromiseFulfilledResult<any>).value : [];

        const userData = getResult(0);
        const enrollments = getResult(1); // List of Enrollment objects
        const rawLessons = getResult(2);  // Backend LessonDTOs
        const rawModules = getResult(3);
        const assignments = getResult(4);
        const tests = getResult(5);
        const submissions = getResult(6);

        // --- DATA MAPPING ---

        // 1. Extract Courses from Enrollments
        const myCourses = Array.isArray(enrollments) ? enrollments.map((e: any) => e.course) : [];

        // 2. Map Backend LessonDTO to Frontend StudyMaterial
        // Backend: { id, title, contentType, url, moduleId }
        // Frontend: { id, title, type, url, moduleId }
        const mappedLessons: StudyMaterial[] = Array.isArray(rawLessons) ? rawLessons.map((l: any) => ({
            id: String(l.id),
            moduleId: String(l.moduleId),
            title: l.title,
            description: l.description,
            type: l.contentType ? l.contentType.toLowerCase() : 'document', // 'VIDEO' -> 'video'
            url: l.url,
            uploadedAt: '', 
            uploadedBy: ''
        })) : [];

        // 3. Ensure Module IDs are strings for comparison
        const mappedModules: Module[] = Array.isArray(rawModules) ? rawModules.map((m: any) => ({
            ...m,
            id: String(m.id),
            courseId: String(m.courseId)
        })) : [];

        setDashboardData({
            currentUser: userData,
            users: [],
            courses: myCourses,
            tests: tests,
            assignments: assignments,
            studyMaterials: mappedLessons, // ✅ Passed mapped lessons
            modules: mappedModules,        // ✅ Passed mapped modules
            messages: [],
            assignmentSubmissions: submissions
        });

      } catch (err: any) {
        console.error("Dashboard Load Error:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  if (loading) return <div className="p-10 text-center">Loading Content...</div>;
  if (error) return <div className="p-10 text-center text-red-600">Error: {error}</div>;

  return (
    <StudentDashboard
      currentUser={dashboardData.currentUser!}
      courses={dashboardData.courses}
      tests={dashboardData.tests}
      assignments={dashboardData.assignments}
      studyMaterials={dashboardData.studyMaterials}
      modules={dashboardData.modules}
      messages={dashboardData.messages}
      users={dashboardData.users}
      assignmentSubmissions={dashboardData.assignmentSubmissions}
      onDataMutated={() => window.location.reload()}
      onNavigateToLanding={() => window.location.href = '/'}
      onLogout={() => { localStorage.clear(); window.location.href = '/login'; }}
    />
  );
};