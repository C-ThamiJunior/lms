// Core User Types
export interface User {
  id: string;
  name: string;
  email: string;
  role: 'student' | 'facilitator' | 'admin';
  isActive: boolean;
  createdAt: string;
  lastLogin?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  role: 'student' | 'facilitator';
}

// Course and Module Types
export interface Course {
  id: string;
  title: string;
  description: string;
  facilitatorId?: string; // Optional
  facilitator?: User;     // ✅ Add this (Backend sends this)
  isActive: boolean;
  createdAt: string;
}

export interface Module {
  id: string;
  courseId: string;
  title: string;
  description: string;
  imageUrl?: string;
  order: number;
  isActive: boolean;
  createdAt: string;
  studentIds: string[]; // Students assigned to this module
}

export interface StudyMaterial {
  id: string;
  moduleId: string;
  title: string;
  description?: string;
  type: 'document' | 'video' | 'image' | 'link';
  url: string;
  uploadedAt: string;
  uploadedBy: string;
}

// Assessment Types
export interface Test {
  id: string;
  courseId: string;
  moduleId?: string;
  title: string;
  description: string;
  questions: TestQuestion[];
  duration: number; // in minutes
  totalMarks: number;
  isActive: boolean;
  openDate: string;
  closeDate: string;
  dueDate: string;
  createdAt: string;
  createdBy: string;
}

export interface TestQuestion {
  id: string;
  question: string;
  type: 'multiple-choice' | 'true-false' | 'short-answer' | 'essay';
  options?: string[]; // for multiple choice
  correctAnswer?: string | number;
  marks: number;
  topic: string; // For grading breakdown
}

export interface Assignment {
  id: string;
  courseId: string;
  moduleId?: string;
  title: string;
  description?: string;
  fileUrl: string; // PDF or Word document
  totalMarks: number;
  isActive: boolean;
  dueDate: string;
  createdAt: string;
  createdBy: string;
}

// Results and Submissions
export interface TestResult {
  id: string;
  testId: string;
  studentId: string;
  answers: TestAnswer[];
  score: number;
  totalMarks: number;
  submittedAt: string;
  topicBreakdown: TopicScore[]; // Performance by topic
}

export interface TestAnswer {
  questionId: string;
  answer: string | number;
  isCorrect: boolean;
  marksAwarded: number;
}

export interface TopicScore {
  topic: string;
  score: number;
  totalMarks: number;
  percentage: number;
}

export interface AssignmentSubmission {
  id: string;
  assignmentId: string;
  studentId: string;
  content: string;
  fileUrl?: string;
  submittedAt: string;
  score?: number;
  feedback?: string;
  gradedAt?: string;
  gradedBy?: string;
}

// Enrollment and Progress
export interface Enrollment {
  id: string;
  studentId: string;
  courseId: string;
  enrolledAt: string;
  progress: number; // 0-100
  isActive: boolean;
}

// Communication Types
export interface ChatMessage {
  id: string;
  senderId: string;
  receiverId: string;
  message: string;
  timestamp: string;
  isRead: boolean;
}

export interface Discussion {
  id: string;
  courseId?: string;
  moduleId?: string;
  title: string;
  content: string;
  authorId: string;
  createdAt: string;
  replies: DiscussionReply[];
  isActive: boolean;
}

export interface DiscussionReply {
  id: string;
  discussionId: string;
  content: string;
  authorId: string;
  createdAt: string;
}

// Activity Logging
export interface ActivityLog {
  id: string;
  userId: string;
  action: string;
  details: string;
  timestamp: string;
}

export interface Enrollment {
  id: string;
  studentId: string; // or user: User
  course: Course;    // ✅ Backend returns the full Course object here
  courseId: string;  // Kept for compatibility if needed
  enrolledAt: string;
  progress: number;
  isActive: boolean;
  status: 'ACTIVE' | 'COMPLETED' | 'DROPPED'; // From Backend Enum
}