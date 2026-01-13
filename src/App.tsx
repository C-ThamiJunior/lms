// src/App.tsx
import React, { useState, useEffect } from "react";
import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import axios from "axios";

import { AuthForm } from "./components/AuthForm";
import { StudentLandingPage } from "./components/StudentLandingPage";
import { StudentDashboard } from "./components/StudentDashboard";
import { FacilitatorLandingPage } from "./components/FacilitatorLandingPage";
import { FacilitatorDashboard } from "./components/FacilitatorDashboard";
import { AdminDashboard } from "./components/AdminDashboard";
import { CourseCatalog } from "./components/CourseCatalog"; 
import { GradingCenter } from "./components/GradingCenter";

import {
  User, Course, Module, StudyMaterial, Test, Assignment,
  TestResult, AssignmentSubmission, Enrollment, ActivityLog,
  ChatMessage, Discussion
} from "./types/lms";

const API_BASE_URL = "https://b-t-backend-production-1580.up.railway.app/api";

function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true); // New loading state
  const navigate = useNavigate();

  // LMS Data
  const [users, setUsers] = useState<User[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [modules, setModules] = useState<Module[]>([]);
  const [studyMaterials, setStudyMaterials] = useState<StudyMaterial[]>([]);
  const [tests, setTests] = useState<Test[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [assignmentSubmissions, setAssignmentSubmissions] = useState<AssignmentSubmission[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [discussions, setDiscussions] = useState<Discussion[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);

  // --- 1. Persist Auth on Refresh ---
  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");

    if (storedToken && storedUser) {
      setToken(storedToken);
      setCurrentUser(JSON.parse(storedUser));
    }
    setIsLoading(false);
  }, []);

  // --- 2. Attach token to axios ---
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    } else {
      delete axios.defaults.headers.common["Authorization"];
    }
  }, [token]);


  // --- NEW: Facilitator Grading Handler ---
  const handleGradeSubmission = async (submissionId: number, grade: number, feedback: string) => {
    try {
      // 1. Call Backend
      const response = await axios.put(`${API_BASE_URL}/submissions/assignment/${submissionId}/grade`, {
        grade,
        feedback
      });

      // 2. Update Local State (so UI refreshes instantly)
      const updatedSubmission = response.data;
      setAssignmentSubmissions((prev) => 
        prev.map((sub) => sub.id === submissionId ? updatedSubmission : sub)
      );
      
      console.log("Grade saved successfully");
    } catch (error) {
      console.error("Error saving grade:", error);
      throw error; // Re-throw to let the component know it failed
    }
  };

  // --- 3. Fetch initial data ---
  useEffect(() => {
    if (!token) return;
    
    const fetchData = async () => {
      try {
        // Note: Promise.all fails if ONE request fails. 
        // Ensure all these endpoints exist on your Spring Boot backend.
        const [
          usersRes,
          coursesRes,
          modulesRes,
          assignmentsRes,
          testsRes,
          enrollmentsRes,
          lessonsRes, 
          submissionsRes, 
          attemptsRes, 
          // messagesRes // Removed hardcoded specific conversation fetch
        ] = await Promise.all([
            axios.get(`${API_BASE_URL}/users`),
            axios.get(`${API_BASE_URL}/courses`),
            axios.get(`${API_BASE_URL}/modules`),
            axios.get(`${API_BASE_URL}/assignments`),
            axios.get(`${API_BASE_URL}/quizzes`),
            axios.get(`${API_BASE_URL}/enrollments`),
            axios.get(`${API_BASE_URL}/lessons`),
            axios.get(`${API_BASE_URL}/submissions/assignment`),
            axios.get(`${API_BASE_URL}/attempts/quiz`),
            // axios.get(`${API_BASE_URL}/messages`) // Uncomment if you have a generic "get my messages" endpoint
          ]);

        setUsers(usersRes.data);
        setCourses(coursesRes.data);
        setModules(modulesRes.data);
        setAssignments(assignmentsRes.data);
        setTests(testsRes.data);
        setEnrollments(enrollmentsRes.data);
        setStudyMaterials(lessonsRes.data);
        setAssignmentSubmissions(submissionsRes.data);
        setTestResults(attemptsRes.data);
        // setMessages(messagesRes.data);

      } catch (error) {
        console.error("Error fetching data:", error);
        // Optional: specific error handling (e.g., if 401, logout)
      }
    };

    fetchData();
  }, [token]);

  // --- Auth Handlers ---
  const handleLogin = async ({ token, user }: { token: string; user: User }) => {
    // Normalize role
    if (user.role) user.role = user.role.replace(/^ROLE_/i, "").toLowerCase();
    
    // Save to LocalStorage
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(user));
    
    setToken(token);
    setCurrentUser(user);

    switch (user.role) {
      case "admin":
        navigate("/dashboard");
        break;
      case "student":
      case "learner": 
      case "facilitator":
        navigate("/landing"); 
        break;
      default:
        navigate("/dashboard");
    }
  };

  const handleRegister = async ({ user }: { user: User }) => {
    if (user.role) user.role = user.role.replace(/^ROLE_/i, "").toLowerCase();
    
    // Note: Usually registration doesn't auto-login unless you return a token.
    // Assuming backend does not return token on register, we just redirect.
    setCurrentUser(user);
    if (user.role === "admin") navigate("/dashboard");
    else navigate("/landing");
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setToken(null);
    setCurrentUser(null);
    navigate("/");
  };
   
  // --- Student Action Handlers ---
  const handleViewMaterial = (material: StudyMaterial) => {
    if (material.url) {
      window.open(material.url, "_blank");
    } else {
      alert("Material URL not found.");
    }
  };

  const handleStartTest = (test: Test) => {
    navigate(`/quiz/${test.id}`);
  };

  const handleSubmitWork = (assignment: Assignment) => {
    navigate(`/assignment/${assignment.id}`);
  };

  const handleSendMessage = async (receiverId: string, content: string) => {
    if (!currentUser) return;
    try {
      const payload = {
        sender: { id: currentUser.id },
        receiver: { id: receiverId },
        content: content,
      };
      const res = await axios.post(`${API_BASE_URL}/messages`, payload);
      setMessages([...messages, res.data]);
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  // Prevent flicker while checking localStorage
  if (isLoading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  // Guarded route
  if (!currentUser) {
    return <AuthForm onLogin={handleLogin} onRegister={handleRegister} />;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <main>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />

          {/* Admin */}
          {currentUser.role === "admin" && (
            <Route
              path="/dashboard"
              element={
                <AdminDashboard
                  currentUser={currentUser}
                  users={users}
                  activityLogs={activityLogs}
                  courses={courses}
                  tests={tests}
                  assignments={assignments}
                  onResetPassword={(id) => console.log("reset password", id)}
                  onToggleUserStatus={async (id) => { console.log("Toggle status", id); }}
                  onLogout={handleLogout}
                />
              }
            />
          )}

          {/* Student */}
          {currentUser.role === "student" && (
            <>
              <Route
                path="/landing"
                element={
                  <StudentLandingPage
                    currentUser={currentUser}
                    courses={courses}
                    tests={tests}
                    assignments={assignments}
                    enrollments={enrollments}
                    onNavigateToDashboard={() => navigate("/dashboard")}
                    onNavigateToCatalog={() => navigate("/catalog")} 
                    onLogout={handleLogout}
                  />
                }
              />
              <Route
                path="/dashboard"
                element={
                  <StudentDashboard
                    currentUser={currentUser}
                    courses={courses}
                    modules={modules}
                    studyMaterials={studyMaterials}
                    tests={tests}
                    assignments={assignments}
                    testResults={testResults}
                    assignmentSubmissions={assignmentSubmissions}
                    users={users}
                    messages={messages}
                    onNavigateToLanding={() => navigate("/landing")}
                    onLogout={handleLogout}
                    onViewMaterial={handleViewMaterial}
                    onStartTest={handleStartTest}
                    onSubmitWork={handleSubmitWork}
                    onSendMessage={handleSendMessage}
                  />
                }
              />
              <Route 
                path="/catalog" 
                element={
                  <div className="min-h-screen bg-gray-50">
                    <header className="bg-white border-b shadow-sm sticky top-0 z-30 px-8 py-4 flex justify-between items-center">
                      <h1 className="text-xl font-bold text-gray-800">Course Registration</h1>
                      <button onClick={() => navigate('/dashboard')} className="text-sm text-blue-600 hover:underline">
                        &larr; Back to Dashboard
                      </button>
                    </header>
                    <CourseCatalog currentUser={currentUser} />
                  </div>
                } 
              />
              <Route path="/quiz/:id" element={<div>Quiz Taker Page (To Be Built)</div>} />
              <Route path="/assignment/:id" element={<div>Assignment Submission Page (To Be Built)</div>} />
            </>
          )}

          {/* Facilitator */}
          {currentUser.role === "facilitator" && (
            <>
              <Route
                path="/landing"
                element={
                  <FacilitatorLandingPage
                    currentUser={currentUser}
                    courses={courses}
                    tests={tests}
                    assignments={assignments}
                    studyMaterials={studyMaterials}
                    modules={modules}
                    users={users}
                    onNavigateToDashboard={() => navigate("/dashboard")}
                    onLogout={handleLogout}
                  />
                }
              />
              <Route
                path="/dashboard"
                element={
                  <FacilitatorDashboard
                    currentUser={currentUser}
                    courses={courses}
                    modules={modules}
                    studyMaterials={studyMaterials}
                    tests={tests}
                    assignments={assignments}
                    testResults={testResults}
                    assignmentSubmissions={assignmentSubmissions}
                    users={users}
                    messages={messages}
                    discussions={discussions}
                    onLogout={handleLogout}
                    onNavigateToLanding={() => navigate("/landing")}
                    onCreateCourse={() => {}}
                    onCreateModule={() => {}}
                    onUpdateModule={() => {}}
                    onDeleteModule={() => {}}
                    onDataMutated={() => {}}
                  />
                }
              />
            </>
          )}
          {/* Facilitator */}
          {currentUser.role === "facilitator" && (
            <>
              {/* Landing & Dashboard Routes ... */}
              <Route
                path="/landing"
                element={
                  <FacilitatorLandingPage
                    currentUser={currentUser}
                    courses={courses}
                    tests={tests}
                    assignments={assignments}
                    studyMaterials={studyMaterials}
                    modules={modules}
                    users={users}
                    onNavigateToDashboard={() => navigate("/dashboard")}
                    // ✅ Add Navigation to Grading Center
                    onNavigateToGrading={() => navigate("/grading")}
                    onLogout={handleLogout}
                  />
                }
              />
              <Route
                path="/dashboard"
                element={
                  <FacilitatorDashboard
                    currentUser={currentUser}
                    courses={courses}
                    modules={modules}
                    studyMaterials={studyMaterials}
                    tests={tests}
                    assignments={assignments}
                    testResults={testResults}
                    assignmentSubmissions={assignmentSubmissions}
                    users={users}
                    messages={messages}
                    discussions={discussions}
                    onLogout={handleLogout}
                    onNavigateToLanding={() => navigate("/landing")}
                    // ✅ Add Navigation to Grading Center
                    onNavigateToGrading={() => navigate("/grading")} 
                    onCreateCourse={() => {}}
                    onCreateModule={() => {}}
                    onUpdateModule={() => {}}
                    onDeleteModule={() => {}}
                    onDataMutated={() => {}}
                  />
                }
              />

              {/* ✅ NEW: Grading Center Route */}
              <Route
                path="/grading"
                element={
                  <div className="min-h-screen bg-gray-50">
                    <header className="bg-white border-b shadow-sm sticky top-0 z-30 px-8 py-4 flex justify-between items-center">
                       <h1 className="text-xl font-bold text-gray-800">Grading Center</h1>
                       <button onClick={() => navigate('/dashboard')} className="text-sm text-blue-600 hover:underline">
                         &larr; Back to Dashboard
                       </button>
                    </header>
                    <GradingCenter
                      submissions={assignmentSubmissions}
                      assignments={assignments}
                      users={users}
                      courses={courses}
                      onGradeSubmission={handleGradeSubmission}
                    />
                  </div>
                }
              />
            </>
          )}

          {/* 404 / Unknown Role */}
          <Route
            path="*"
            element={<div className="p-4 text-red-600">Role not recognized or 404 - Page Not Found</div>}
          />
        </Routes>
      </main>
    </div>
  );
}

export default App;