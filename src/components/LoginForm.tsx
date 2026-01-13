// Updated LoginForm.tsx
import React, { useState } from 'react';
import { User } from '../types';
import { LOGIN_CREDENTIALS } from '../data/users';
import { LogIn, Users, Eye, EyeOff, AlertCircle, User as UserIcon, BookOpen, Shield } from 'lucide-react';

interface LoginFormProps {
  onLogin: (user: User) => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({ onLogin }) => {
  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [role, setRole] = useState<'student' | 'facilitator' | 'admin' | ''>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Check if the entered username might be an admin
  const isPotentialAdmin = username.toLowerCase().includes('admin');

  // Show role selection only for student/facilitator, not for admin
  const showRoleSelection = !isPotentialAdmin && role !== 'admin';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    // Validation
    if (!username || !password) {
      setError('Please enter both username and password.');
      return;
    }

    // If it's not an admin login, role selection is required
    if (!isPotentialAdmin && !role) {
      setError('Please select your role.');
      return;
    }

    setIsLoading(true);

    setTimeout(() => {
      const credentials = LOGIN_CREDENTIALS.find(
        cred => cred.username === username && cred.password === password
      );

      if (credentials) {
        // For admin, role is determined by the credentials
        // For student/facilitator, check if the selected role matches
        if (credentials.user.role === 'admin' || credentials.user.role === role) {
          onLogin(credentials.user);
        } else {
          setError(`This account is registered as ${credentials.user.role}, not ${role}. Please select the correct role.`);
        }
      } else {
        setError('Invalid username or password. Please try again.');
      }
      setIsLoading(false);
    }, 1000);
  };

  const handleDemoLogin = (demoUsername: string, demoRole: 'student' | 'facilitator' | 'admin' = 'student') => {
    const credentials = LOGIN_CREDENTIALS.find(cred => cred.username === demoUsername);
    if (credentials) {
      setUsername(credentials.username);
      setPassword(credentials.password);
      
      // Auto-detect role from username or use provided role
      if (demoUsername.toLowerCase().includes('admin')) {
        setRole('admin');
      } else {
        setRole(demoRole);
      }
      setError('');
    }
  };

  // Auto-detect role when username changes
  React.useEffect(() => {
    if (username.toLowerCase().includes('admin')) {
      setRole('admin');
    } else if (role === 'admin') {
      // If user changes from admin to non-admin username, clear role
      setRole('');
    }
  }, [username, role]);

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4">
      <div className="bg-white p-8 rounded-lg shadow-2xl w-full max-w-md">
        <div className="text-center mb-8">
          <div className="mx-auto w-16 h-16 bg-red-600 rounded-full flex items-center justify-center mb-4">
            <BookOpen className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-black mb-2">LMS Access</h1>
          <p className="text-gray-600">
            {isPotentialAdmin ? 'Admin Login' : 'Enter your credentials'}
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-2">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Role Selection - Only show for non-admin users */}
        {showRoleSelection && (
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">I am a:</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setRole('student')}
                className={`p-3 rounded-lg border-2 transition-colors flex flex-col items-center ${
                  role === 'student' 
                    ? 'border-red-600 bg-red-50 text-red-700' 
                    : 'border-gray-300 text-gray-700 hover:border-gray-400'
                }`}
              >
                <UserIcon className="w-5 h-5 mb-1" />
                <span className="text-sm font-medium">Student</span>
              </button>
              
              <button
                type="button"
                onClick={() => setRole('facilitator')}
                className={`p-3 rounded-lg border-2 transition-colors flex flex-col items-center ${
                  role === 'facilitator' 
                    ? 'border-red-600 bg-red-50 text-red-700' 
                    : 'border-gray-300 text-gray-700 hover:border-gray-400'
                }`}
              >
                <BookOpen className="w-5 h-5 mb-1" />
                <span className="text-sm font-medium">Facilitator</span>
              </button>
            </div>
          </div>
        )}

        {/* Admin Indicator - Show when admin is detected */}
        {isPotentialAdmin && (
          <div className="mb-6 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center space-x-2">
            <Shield className="w-5 h-5 text-blue-600 flex-shrink-0" />
            <span className="text-sm text-blue-700 font-medium">Admin login detected</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
              Username
            </label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 text-black"
              placeholder="Enter your username"
              required
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 text-black pr-12"
                placeholder="Enter your password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-red-600 text-white py-3 px-4 rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center space-x-2 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <LogIn className="w-5 h-5" />
            <span>
              {isLoading 
                ? 'Signing in...' 
                : isPotentialAdmin 
                  ? 'Sign In as Admin' 
                  : role 
                    ? `Sign In as ${role}` 
                    : 'Sign In'
              }
            </span>
          </button>
        </form>

        <div className="mt-8 border-t pt-6">
          <p className="text-sm text-gray-600 mb-4 text-center">Demo Accounts:</p>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleDemoLogin('john.student', 'student')}
              className="text-xs bg-gray-100 text-gray-700 px-3 py-2 rounded hover:bg-gray-200 transition-colors flex flex-col items-center"
            >
              <UserIcon className="w-3 h-3 mb-1" />
              <span>Student Demo</span>
            </button>
            <button
              type="button"
              onClick={() => handleDemoLogin('sarah.facilitator', 'facilitator')}
              className="text-xs bg-gray-100 text-gray-700 px-3 py-2 rounded hover:bg-gray-200 transition-colors flex flex-col items-center"
            >
              <BookOpen className="w-3 h-3 mb-1" />
              <span>Facilitator Demo</span>
            </button>
            <button
              type="button"
              onClick={() => handleDemoLogin('admin', 'admin')}
              className="text-xs bg-gray-100 text-gray-700 px-3 py-2 rounded hover:bg-gray-200 transition-colors flex flex-col items-center col-span-2"
            >
              <Shield className="w-3 h-3 mb-1" />
              <span>Admin Demo</span>
            </button>
          </div>
          <div className="mt-3 text-xs text-gray-500 text-center">
            <p>Student: john.student / password123</p>
            <p>Facilitator: sarah.facilitator / password123</p>
            <p>Admin: admin / admin123</p>
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-6 text-center text-sm text-gray-500">
          <p>💡 <strong>Tip:</strong> Admin users don't need to select a role</p>
          <p>Just enter your admin credentials</p>
        </div>
      </div>
    </div>
  );
};