// FacilitatorPage.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { FacilitatorDashboard } from './FacilitatorDashboard';
import {
  User,
  Course,
  Module,
  StudyMaterial,
  Test,
  Assignment,
  TestResult,
  AssignmentSubmission,
  ChatMessage,
  Discussion,
} from '../types/lms';

const API_BASE_URL = 'https://b-t-backend-production-1580.up.railway.app/api';

// NOTE: This file only adds API integration. UI structure and styling are unchanged.

export const FacilitatorPage: React.FC = () => {
  // --- CURRENT USER AND TOKEN ---
  const storedUser = localStorage.getItem('user');
  const storedToken = localStorage.getItem('token');

  // keep backwards compatibility with your previous mock user if needed
  const MOCK_CURRENT_USER: User = {
    id: 1,
    email: 'facilitator@btportal.com',
    firstname: 'Facilitator',
    surname: 'User',
    role: 'FACILITATOR',
    isEnabled: true,
  };

  const [currentUser] = useState<User>(storedUser ? JSON.parse(storedUser) : MOCK_CURRENT_USER);
  const token = storedToken || '';

  // --- STATE ---
  const [users, setUsers] = useState<User[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [modules, setModules] = useState<Module[]>([]);
  const [studyMaterials, setStudyMaterials] = useState<StudyMaterial[]>([]);
  const [tests, setTests] = useState<Test[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [assignmentSubmissions, setAssignmentSubmissions] = useState<AssignmentSubmission[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [discussions, setDiscussions] = useState<Discussion[]>([]);

  const [loading, setLoading] = useState<boolean>(true);

  // auth headers helper
  const authHeaders = {
    'Content-Type': 'application/json',
    Authorization: token ? `Bearer ${token}` : '',
  };

  // safe fetch helper (handles JSON parse errors, 403/401)
  const safeFetchJson = async (url: string, opts?: RequestInit) => {
    try {
      const res = await fetch(url, opts);
      if (res.status === 401 || res.status === 403) {
        // auth error — return null and allow caller to handle
        console.warn('Auth error fetching', url, res.status);
        return { status: res.status, data: null };
      }
      const data = await res.json().catch(() => null);
      return { status: res.status, data };
    } catch (err) {
      console.error('Network error fetching', url, err);
      return { status: 0, data: null };
    }
  };

  // --- FETCH ALL DATA ---
  const fetchData = useCallback(async () => {
    setLoading(true);

    const endpoints = [
      '/users',
      '/courses',
      '/modules',
      '/lessons', // study materials
      '/quizzes', // tests/quizzes
      '/assignments',
      '/test-results',
      '/submissions/assignment', // assignment submissions
      // optional endpoints (messages/discussions) if available
    ];

    try {
      const [
        usersRes,
        coursesRes,
        modulesRes,
        lessonsRes,
        quizzesRes,
        assignmentsRes,
        testResultsRes,
        assignmentSubRes,
      ] = await Promise.all(
        endpoints.map((ep) =>
          safeFetchJson(`${API_BASE_URL}${ep}`, {
            method: 'GET',
            headers: authHeaders,
          })
        )
      );

      // If backend returned 403 for users (or other endpoints), we'll stop gracefully
      if (usersRes.status === 403) {
        console.warn('403 when fetching /users — token might be invalid or lack role');
        // set arrays to empty so UI doesn't crash
        setUsers([]);
      } else {
        setUsers(Array.isArray(usersRes.data) ? usersRes.data : []);
      }

      setCourses(Array.isArray(coursesRes.data) ? coursesRes.data : []);
      setModules(Array.isArray(modulesRes.data) ? modulesRes.data : []);

      // Map lessons -> StudyMaterial
      const lessonsData = Array.isArray(lessonsRes.data) ? lessonsRes.data : [];
      const mappedMaterials: StudyMaterial[] = lessonsData.map((lesson: any) => {
        // Your example lesson shape:
        // { id, title, contentType, orderIndex, moduleId, (optional) contentUrl, (optional) createdAt }
        const typeMapping = (lesson.contentType || '').toUpperCase();
        const mappedType =
          typeMapping === 'VIDEO' ? 'video' : typeMapping === 'PDF' ? 'pdf' : 'document';

        const material: StudyMaterial = {
          id: lesson.id,
          title: lesson.title,
          moduleId: String(lesson.moduleId ?? lesson.moduleId),
          description: lesson.content || '',
          type: mappedType,
          url: lesson.contentUrl || '', // may be empty if backend doesn't supply
          uploadedAt: lesson.createdAt || new Date().toISOString(),
          uploadedBy: (lesson.uploadedBy as number) ?? currentUser.id,
        };
        return material;
      });
      setStudyMaterials(mappedMaterials);

      // Map quizzes -> Tests
      const quizzesData = Array.isArray(quizzesRes.data) ? quizzesRes.data : [];
      const mappedTests: Test[] = quizzesData.map((q: any) => ({
        id: q.id,
        title: q.title,
        courseId: q.courseId ?? (q.courseId ?? 'UNKNOWN'),
        moduleId: q.moduleId ?? (q.moduleId ?? 'UNKNOWN'),
        duration: q.timeLimitInMinutes ?? q.duration ?? 0,
        isActive: q.isActive ?? true,
        totalMarks: q.totalMarks ?? 100,
        dueDate: q.dueDate ?? new Date().toISOString(),
        description: q.description ?? '',
      } as unknown as Test));
      setTests(mappedTests);

      // assignments
      setAssignments(Array.isArray(assignmentsRes.data) ? assignmentsRes.data : []);

      // test results and assignment submissions
      setTestResults(Array.isArray(testResultsRes.data) ? testResultsRes.data : []);
      setAssignmentSubmissions(Array.isArray(assignmentSubRes.data) ? assignmentSubRes.data : []);
    } catch (err) {
      console.error('Failed to fetch facilitator data', err);
    } finally {
      setLoading(false);
    }
  }, [token, currentUser.id]); // eslint-disable-line

  useEffect(() => {
    // only fetch if token present — prevents unauthenticated crash
    if (!token) {
      setLoading(false);
      // keep arrays empty — UI will render with no data
      return;
    }
    fetchData();
  }, [fetchData, token]);

  // ------------------ API ACTIONS ------------------

  // Upload Study Material -> POST /api/lessons
  const handleUploadMaterial = useCallback(
    async (material: Omit<StudyMaterial, 'id' | 'uploadedAt'>) => {
      const payload: any = {
        title: material.title,
        moduleId: Number(material.moduleId),
        contentType: material.type === 'video' ? 'VIDEO' : material.type === 'pdf' ? 'PDF' : 'DOCUMENT',
        // try include contentUrl if user provided
        contentUrl: material.url || undefined,
        content: material.description || undefined,
        orderIndex: 0,
      };

      try {
        const res = await fetch(`${API_BASE_URL}/lessons`, {
          method: 'POST',
          headers: authHeaders,
          body: JSON.stringify(payload),
        });
        if (res.status === 201 || res.ok) {
          await fetchData();
        } else if (res.status === 403) {
          alert('Unauthorized to upload materials (403). Check your role/token.');
        } else {
          const txt = await res.text().catch(() => '');
          console.error('Failed to upload material', res.status, txt);
          alert('Failed to upload material. See console.');
        }
      } catch (err) {
        console.error('Error uploading material', err);
        alert('Error uploading material. See console.');
      }
    },
    [fetchData, authHeaders]
  );

  // Create Test -> POST /api/quizzes
  const handleCreateTest = useCallback(
    async (test: Omit<Test, 'id' | 'createdAt'>) => {
      // Map frontend Test -> backend QuizDTO
      const payload: any = {
        title: test.title,
        lessonId: (test as any).lessonId ?? undefined,
        timeLimitInMinutes: test.duration ?? 0,
        isTimed: (test.duration ?? 0) > 0,
        totalMarks: test.totalMarks ?? 100,
      };

      try {
        const res = await fetch(`${API_BASE_URL}/quizzes`, {
          method: 'POST',
          headers: authHeaders,
          body: JSON.stringify(payload),
        });

        if (res.ok) {
          await fetchData();
        } else if (res.status === 403) {
          alert('Unauthorized to create tests (403). Check your role/token.');
        } else {
          const txt = await res.text().catch(() => '');
          console.error('Failed to create quiz', res.status, txt);
          alert('Failed to create test. See console.');
        }
      } catch (err) {
        console.error('Error creating test', err);
        alert('Error creating test. See console.');
      }
    },
    [fetchData, authHeaders]
  );

  // Create Assignment -> POST /api/assignments
  const handleCreateAssignment = useCallback(
    async (assignment: Omit<Assignment, 'id' | 'createdAt'>) => {
      const payload = {
        title: assignment.title,
        description: assignment.description,
        courseId: Number(assignment.courseId),
        moduleId: Number(assignment.moduleId),
        facilitatorId: Number(currentUser.id),
        dueDate: assignment.dueDate ?? new Date().toISOString(),
        totalMarks: assignment.totalMarks ?? 100,
        isActive: assignment.isActive ?? true,
      };

      try {
        const res = await fetch(`${API_BASE_URL}/assignments`, {
          method: 'POST',
          headers: authHeaders,
          body: JSON.stringify(payload),
        });

        if (res.ok) {
          await fetchData();
        } else if (res.status === 403) {
          alert('Unauthorized to create assignments (403). Check your role/token.');
        } else {
          const txt = await res.text().catch(() => '');
          console.error('Failed to create assignment', res.status, txt);
          alert('Failed to create assignment. See console.');
        }
      } catch (err) {
        console.error('Error creating assignment', err);
        alert('Error creating assignment. See console.');
      }
    },
    [fetchData, authHeaders, currentUser.id]
  );

  // Grade submission: uses "B" - separate endpoints
  // Tries to determine whether the id belongs to assignment submission or test result
  const handleGradeSubmission = useCallback(
    async (submissionId: string, score: number, feedback: string) => {
      // prefer assignment submissions endpoint if id exists there
      const asSub = assignmentSubmissions.find((s) => String(s.id) === String(submissionId));
      const trSub = testResults.find((t) => String(t.id) === String(submissionId));

      if (asSub) {
        // PUT /api/assignment-submissions/{id}
        try {
          const res = await fetch(`${API_BASE_URL}/assignment-submissions/${submissionId}`, {
            method: 'PUT',
            headers: authHeaders,
            body: JSON.stringify({ score, feedback, graderId: currentUser.id }),
          });

          if (res.ok) {
            await fetchData();
            return;
          } else if (res.status === 403) {
            alert('Unauthorized to grade assignment submissions (403).');
            return;
          }
          console.error('Failed to grade assignment submission', res.status, await res.text());
          alert('Failed to grade assignment. See console.');
          return;
        } catch (err) {
          console.error('Error grading assignment', err);
          alert('Error grading assignment. See console.');
          return;
        }
      }

      if (trSub) {
        // PUT /api/test-results/{id}
        try {
          const res = await fetch(`${API_BASE_URL}/test-results/${submissionId}`, {
            method: 'PUT',
            headers: authHeaders,
            body: JSON.stringify({ score, feedback, graderId: currentUser.id }),
          });

          if (res.ok) {
            await fetchData();
            return;
          } else if (res.status === 403) {
            alert('Unauthorized to grade test results (403).');
            return;
          }
          console.error('Failed to grade test result', res.status, await res.text());
          alert('Failed to grade test. See console.');
          return;
        } catch (err) {
          console.error('Error grading test result', err);
          alert('Error grading test. See console.');
          return;
        }
      }

      // Fallback: try both endpoints (best-effort)
      try {
        const resA = await fetch(`${API_BASE_URL}/assignment-submissions/${submissionId}`, {
          method: 'PUT',
          headers: authHeaders,
          body: JSON.stringify({ score, feedback, graderId: currentUser.id }),
        });
        if (resA.ok) {
          await fetchData();
          return;
        }
      } catch (_) {
        // swallow
      }

      try {
        const resT = await fetch(`${API_BASE_URL}/test-results/${submissionId}`, {
          method: 'PUT',
          headers: authHeaders,
          body: JSON.stringify({ score, feedback, graderId: currentUser.id }),
        });
        if (resT.ok) {
          await fetchData();
          return;
        }
      } catch (_) {
        // swallow
      }

      alert('Could not grade submission — endpoint may not exist.');
    },
    [assignmentSubmissions, testResults, authHeaders, currentUser.id, fetchData]
  );

  // --- optional helpers for viewing a material/test/assignment ---
  const handleViewMaterial = useCallback((m: StudyMaterial) => {
    // open the resource URL if present
    if (m.url) window.open(m.url, '_blank');
    else alert('No URL available for this material yet.');
  }, []);

  const handleStartTest = useCallback((t: Test) => {
    // placeholder; UI remains unchanged
    alert(`Starting test: ${t.title}`);
  }, []);

  const handleSubmitWork = useCallback((a: Assignment) => {
    // placeholder; UI remains unchanged
    alert(`Submit work for: ${a.title}`);
  }, []);

  const handleSendMessage = useCallback(async (receiverId: string, content: string) => {
    // Try to POST to /api/messages/{receiverId} if exists (best-effort)
    try {
      const res = await fetch(`${API_BASE_URL}/messages`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({ senderId: currentUser.id, receiverId, content }),
      });
      if (res.ok) {
        // optional: re-fetch messages
        setMessages((m) => m.concat([{ id: Date.now(), senderId: currentUser.id, receiverId, content } as any]));
      } else {
        console.warn('Failed to send message', res.status);
      }
    } catch (err) {
      console.error('Failed to send message', err);
    }
  }, [authHeaders, currentUser.id]);

  // ---------------- RENDER ----------------
  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading Facilitator Data...</div>;
  }

  return (
    <FacilitatorDashboard
      currentUser={currentUser}
      courses={courses || []}
      modules={modules || []}
      studyMaterials={studyMaterials || []}
      tests={tests || []}
      assignments={assignments || []}
      testResults={testResults || []}
      assignmentSubmissions={assignmentSubmissions || []}
      users={users || []}
      messages={messages}
      discussions={discussions}

      onUploadMaterial={handleUploadMaterial}
      onCreateTest={handleCreateTest}
      onCreateModule={async (m) => {
        // Map Module -> POST /api/modules (kept behavior; UI unchanged)
        try {
          await fetch(`${API_BASE_URL}/modules`, {
            method: 'POST',
            headers: authHeaders,
            body: JSON.stringify({
              title: (m as any).title ?? m.name ?? 'Untitled',
              courseId: Number((m as any).courseId ?? m.courseId ?? 0),
              orderIndex: 0,
            }),
          });
          await fetchData();
        } catch (err) {
          console.error('Error creating module', err);
          alert('Failed to create module. See console.');
        }
      }}
      onCreateAssignment={handleCreateAssignment}
      onGradeSubmission={handleGradeSubmission}

      onUpdateModule={async (moduleId: string | number, updates: Partial<Module>) => {
        try {
          await fetch(`${API_BASE_URL}/modules/${moduleId}`, {
            method: 'PUT',
            headers: authHeaders,
            body: JSON.stringify(updates),
          });
          await fetchData();
        } catch (err) {
          console.error('Failed to update module', err);
          alert('Failed to update module. See console.');
        }
      }}
      onDeleteModule={async (moduleId: string | number) => {
        try {
          await fetch(`${API_BASE_URL}/modules/${moduleId}`, {
            method: 'DELETE',
            headers: authHeaders,
          });
          await fetchData();
        } catch (err) {
          console.error('Failed to delete module', err);
          alert('Failed to delete module. See console.');
        }
      }}
      onCreateCourse={async (c) => {
        try {
          await fetch(`${API_BASE_URL}/courses`, {
            method: 'POST',
            headers: authHeaders,
            body: JSON.stringify(c),
          });
          await fetchData();
        } catch (err) {
          console.error('Failed to create course', err);
          alert('Failed to create course. See console.');
        }
      }}
      onLogout={() => {
        // simple logout: remove token & user then reload
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.reload();
      }}
      onNavigateToLanding={() => {
        window.location.href = '/';
      }}
    />
  );
};

export default FacilitatorPage;
