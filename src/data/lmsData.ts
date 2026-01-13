import { User, Course, Module, StudyMaterial, Test, Assignment, Enrollment, ActivityLog } from '../types/lms';

// Initial users (admin is pre-created)
export const INITIAL_USERS: User[] = [
  {
    id: '1',
    name: 'System Administrator',
    email: 'admin@lms.com',
    role: 'admin',
    createdAt: new Date().toISOString(),
    isActive: true,
  },
];

// Login credentials for existing users
export const LOGIN_CREDENTIALS = [
  { email: 'admin@lms.com', password: 'admin123' },
];

export const INITIAL_COURSES: Course[] = [];
export const INITIAL_MODULES: Module[] = [];
export const INITIAL_STUDY_MATERIALS: StudyMaterial[] = [];
export const INITIAL_TESTS: Test[] = [];
export const INITIAL_ASSIGNMENTS: Assignment[] = [];
export const INITIAL_ENROLLMENTS: Enrollment[] = [];
export const INITIAL_ACTIVITY_LOGS: ActivityLog[] = [];