import React, { useState } from "react";
import axios from "axios";
import {
  LogIn,
  UserPlus,
  Eye,
  EyeOff,
  AlertCircle,
  User as UserIcon,
  Shield,
  Loader
} from "lucide-react";
import logo from "../resources/logo.png"; // Ensure this path is correct
import { User } from "../types/lms";

interface AuthFormProps {
  onLogin: (data: { token: string; user: User }) => void;
  onRegister: (data: { user: User }) => void;
}

const API_BASE_URL = "https://b-t-backend-production-1580.up.railway.app/api/auth";

export const AuthForm: React.FC<AuthFormProps> = ({ onLogin, onRegister }) => {
  const [isLoginMode, setIsLoginMode] = useState(true);
  
  // FIX: Initialize role as uppercase 'STUDENT' to match backend Enum
  const [form, setForm] = useState({
    firstname: "",
    surname: "",
    contactNumber: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "STUDENT", 
  });

  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

// --- Login Handler ---
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const res = await axios.post(`${API_BASE_URL}/login`, {
        email: form.email,
        password: form.password,
      });

      console.log("Login Success:", res.data);

      // ✅ FIX: Look inside 'res.data.user.token' first
      // The server sends: { user: { token: "..." } }
      const token = res.data.user?.token || res.data.token || res.data.accessToken;
      const user = res.data.user;

      if (!token) {
        throw new Error("Login succeeded but no token was found in the response.");
      }

      // Normalizing role
      if (user.role) user.role = user.role.replace(/^ROLE_/i, "").toLowerCase();

      onLogin({ token, user });
    } catch (err: any) {
      console.error("Login Error:", err);
      setError(err.response?.data?.message || err.message || "Invalid credentials.");
    } finally {
      setIsLoading(false);
    }
  };

  // --- Register Handler ---
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (form.password !== form.confirmPassword) {
        setError("Passwords do not match.");
        return;
    }

    setIsLoading(true);

    try {
      // FIX: Ensure payload sends strictly Uppercase Enum string
      const payload = {
        firstname: form.firstname,
        surname: form.surname,
        contactNumber: form.contactNumber,
        email: form.email,
        password: form.password,
        role: form.role, // This is now "STUDENT" or "FACILITATOR"
      };

      console.log("Sending Register Payload:", payload); // Debug log

      const res = await axios.post(`${API_BASE_URL}/register`, payload);
      
      console.log("Register Success:", res.data);
      const { token, user } = res.data;

      if (user.role) user.role = user.role.replace(/^ROLE_/i, "").toLowerCase();

      onRegister({ user });
      onLogin({ token, user });

    } catch (err: any) {
      console.error("Register Error:", err);
      // Detailed error message if available
      setError(err.response?.data?.message || "Registration failed. Email might be in use.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-gray-100 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-md border border-gray-100">
        
        {/* Logo & Header */}
        <div className="text-center mb-8">
          <div className="mb-4 flex justify-center">
             <img src={logo} alt="LMS Logo" className="h-16 object-contain" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">
            {isLoginMode ? "Welcome Back" : "Create Account"}
          </h2>
          <p className="text-gray-500 mt-2 text-sm">
            {isLoginMode ? "Enter your credentials to access your account" : "Sign up to start your learning journey"}
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-md flex items-center gap-2 text-red-700 text-sm">
            <AlertCircle className="w-4 h-4" />
            {error}
          </div>
        )}

        <form onSubmit={isLoginMode ? handleLogin : handleRegister} className="space-y-5">
          
          {/* Registration Fields */}
          {!isLoginMode && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1 uppercase">First Name</label>
                  <input
                    name="firstname"
                    value={form.firstname}
                    onChange={handleChange}
                    className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all outline-none"
                    placeholder="Jane"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1 uppercase">Surname</label>
                  <input
                    name="surname"
                    value={form.surname}
                    onChange={handleChange}
                    className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all outline-none"
                    placeholder="Doe"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1 uppercase">Contact Number</label>
                <input
                  name="contactNumber"
                  value={form.contactNumber}
                  onChange={handleChange}
                  className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all outline-none"
                  placeholder="082 123 4567"
                />
              </div>

              {/* Role Selection Buttons (Ensuring Uppercase Value) */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-2 uppercase">I am a...</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, role: "STUDENT" })} // Uppercase
                    className={`flex items-center justify-center p-3 rounded-lg border-2 transition-all ${
                      form.role === "STUDENT"
                        ? "border-red-600 bg-red-50 text-red-700 font-bold"
                        : "border-gray-200 text-gray-600 hover:border-gray-300"
                    }`}
                  >
                    <UserIcon className="w-4 h-4 mr-2" /> Student
                  </button>
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, role: "FACILITATOR" })} // Uppercase
                    className={`flex items-center justify-center p-3 rounded-lg border-2 transition-all ${
                      form.role === "FACILITATOR"
                        ? "border-red-600 bg-red-50 text-red-700 font-bold"
                        : "border-gray-200 text-gray-600 hover:border-gray-300"
                    }`}
                  >
                    <Shield className="w-4 h-4 mr-2" /> Facilitator
                  </button>
                </div>
              </div>
            </>
          )}

          {/* Common Fields */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1 uppercase">Email Address</label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all outline-none"
              placeholder="name@example.com"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1 uppercase">Password</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                value={form.password}
                onChange={handleChange}
                className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all outline-none pr-10"
                placeholder="••••••••"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {!isLoginMode && (
             <div>
               <label className="block text-xs font-semibold text-gray-700 mb-1 uppercase">Confirm Password</label>
               <input
                 type="password"
                 name="confirmPassword"
                 value={form.confirmPassword}
                 onChange={handleChange}
                 className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all outline-none"
                 placeholder="••••••••"
                 required
               />
             </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-red-600 text-white py-3 rounded-lg font-semibold hover:bg-red-700 focus:ring-4 focus:ring-red-200 transition-all flex justify-center items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isLoading ? <Loader className="w-5 h-5 animate-spin" /> : (
                isLoginMode ? <><LogIn className="w-5 h-5" /> Sign In</> : <><UserPlus className="w-5 h-5" /> Create Account</>
            )}
          </button>
        </form>

        <div className="mt-6 text-center text-sm">
          <p className="text-gray-500">
            {isLoginMode ? "Don't have an account?" : "Already have an account?"}{" "}
            <button
              onClick={() => { setIsLoginMode(!isLoginMode); setError(""); }}
              className="font-bold text-red-600 hover:text-red-700 hover:underline transition-colors"
            >
              {isLoginMode ? "Register here" : "Login here"}
            </button>
          </p>
        </div>

      </div>
    </div>
  );
};