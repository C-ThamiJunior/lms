import React, { useState, useEffect } from "react";
import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import axios from "axios";

// Components
import { AuthForm } from "./components/AuthForm";
import { StudentLandingPage } from "./components/StudentLandingPage";
import { StudentDashboard } from "./components/StudentDashboard";
import { FacilitatorLandingPage } from "./components/FacilitatorLandingPage";
import { FacilitatorDashboard } from "./components/FacilitatorDashboard";
import { AdminDashboard } from "./components/AdminDashboard";
import { CourseCatalog } from "./components/CourseCatalog"; 
import { GradingCenter } from "./components/dashboard/GradingCenter"; 

// Types
import {
  User, Course, Module, StudyMaterial, Test, Assignment,
  AssignmentSubmission, Enrollment, ActivityLog
} from "./types/lms";

const API_BASE_URL = "https://b-t-backend-uc9w.onrender.com/api";

function App() {
  // --- Auth State ---
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const navigate = useNavigate();

  // --- Global Data State ---
  const [users, setUsers] = useState<User[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [modules, setModules] = useState<Module[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [tests, setTests] = useState<Test[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [assignmentSubmissions, setAssignmentSubmissions] = useState<AssignmentSubmission[]>([]);
  const [testResults, setTestResults] = useState<any[]>([]);

  // --- 1. Persist Auth on Refresh ---
  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");

    if (storedToken && storedToken !== "undefined" && storedUser) {
      setToken(storedToken);
      setCurrentUser(JSON.parse(storedUser));
    } else {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
    }
    setIsLoading(false);
  }, []);

  // --- 2. Attach Token to Axios ---
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    } else {
      delete axios.defaults.headers.common["Authorization"];
    }
  }, [token]);

  // --- 3. Global Data Fetching ---
  useEffect(() => {
    if (!token || !currentUser) return;
    
    const fetchGlobalData = async () => {
      try {
        console.log("App.tsx: Fetching global data...");
        const [
            usersRes, coursesRes, modulesRes, assignmentsRes, 
            testsRes, enrollmentsRes, submissionsRes, attemptsRes
        ] = await Promise.all([
            axios.get(`${API_BASE_URL}/users`).catch(() => ({ data: [] })),
            axios.get(`${API_BASE_URL}/courses`).catch(() => ({ data: [] })),
            axios.get(`${API_BASE_URL}/modules`).catch(() => ({ data: [] })),
            axios.get(`${API_BASE_URL}/assignments`).catch(() => ({ data: [] })),
            axios.get(`${API_BASE_URL}/quizzes`).catch(() => ({ data: [] })),
            axios.get(`${API_BASE_URL}/enrollments`).catch(() => ({ data: [] })),
            axios.get(`${API_BASE_URL}/submissions/assignment`).catch(() => ({ data: [] })),
            axios.get(`${API_BASE_URL}/attempts/quiz`).catch(() => ({ data: [] })),
        ]);

        setUsers(usersRes.data);
        setCourses(coursesRes.data);
        setModules(modulesRes.data);
        setAssignments(assignmentsRes.data);
        setTests(testsRes.data);
        setEnrollments(enrollmentsRes.data);
        setAssignmentSubmissions(submissionsRes.data);
        setTestResults(attemptsRes.data);
      } catch (error) {
        console.error("Error fetching global data:", error);
      }
    };

    fetchGlobalData();
  }, [token, currentUser]);

  // --- Auth Handlers ---
  const handleLogin = async ({ token, user }: { token: string; user: User }) => {
    if (user.role) user.role = user.role.replace(/^ROLE_/i, "").toLowerCase() as any;
    
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(user));
    
    setToken(token);
    setCurrentUser(user);

    switch (user.role) {
      case "admin": navigate("/dashboard"); break;
      case "student": navigate("/landing"); break;
      case "facilitator": navigate("/landing"); break;
      default: navigate("/dashboard");
    }
  };

  const handleRegister = async ({ user }: { user: User }) => {
    if (user.role) user.role = user.role.replace(/^ROLE_/i, "").toLowerCase() as any;
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

  if (isLoading) return <div className="flex justify-center items-center h-screen">Loading...</div>;

  if (!currentUser) {
    return <AuthForm onLogin={handleLogin} onRegister={handleRegister} />;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <main>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />

          {/* --- ADMIN ROUTES --- */}
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

          {/* --- STUDENT ROUTES --- */}
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
                    onNavigateToLanding={() => navigate("/landing")}
                    onLogout={handleLogout}
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
            </>
          )}

          {/* --- FACILITATOR ROUTES --- */}
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
                    studyMaterials={[]}
                    modules={modules}
                    users={users}
                    onNavigateToDashboard={() => navigate("/dashboard")}
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
                    onLogout={handleLogout}
                    onNavigateToLanding={() => navigate("/landing")}
                  />
                }
              />
              
              {/* Standalone Grading Route */}
              <Route
                path="/grading"
                element={
                  <div className="min-h-screen bg-gray-50">
                    <header className="bg-white border-b shadow-sm sticky top-0 z-30 px-8 py-4 flex justify-between items-center">
                       <h1 className="text-xl font-bold text-gray-800">Grading Center</h1>
                       <div className="flex gap-4">
                           <button onClick={() => navigate('/landing')} className="text-sm text-gray-500 hover:text-red-600">
                             Home
                           </button>
                           <button onClick={() => navigate('/dashboard')} className="text-sm text-blue-600 hover:underline font-medium">
                             &larr; Back to Dashboard
                           </button>
                       </div>
                    </header>
                    <div className="p-6">
                        <GradingCenter
                          courses={courses}
                          modules={modules}
                          tests={tests}
                          assignments={assignments}
                          users={users}
                          testResults={testResults} 
                          assignmentSubmissions={assignmentSubmissions}
                          // ✅ FIXED: Explicitly cast window to 'any' to bypass TS error
                          onDataMutated={() => (window as any).location.reload()} 
                        />
                    </div>
                  </div>
                }
              />
            </>
          )}

          {/* 404 / Unknown Role */}
          <Route
            path="*"
            element={<div className="p-10 text-center text-red-600 font-bold">404 - Page Not Found or Access Denied</div>}
          />
        </Routes>
      </main>
    </div>
  );
}

export default App;