// --- User Types ---
export interface User {
  id: string;
  name?: string;       
  firstname?: string;  
  surname?: string;    
  email: string;
  role: 'student' | 'facilitator' | 'admin';
  isActive: boolean;
  createdAt: string;
  lastLogin?: string;
}

// --- Course & Content Types ---
export interface Course {
  id: string;
  title: string;
  description: string;
  facilitatorId?: string; 
  facilitator?: User; 
  isActive: boolean;
  createdAt: string;
}

export interface Module {
  id: string;
  title: string;
  description: string;
  courseId: string;
  orderIndex: number;
}

export interface StudyMaterial {
  id: string;
  title: string;
  description: string;
  type: 'VIDEO' | 'PDF' | 'LINK' | 'QUIZ' | 'ASSIGNMENT';
  contentType?: string;
  url: string;
  moduleId: string;
  isCompleted?: boolean;
}

// --- Assessment Types ---
export interface Test {
  id: string;
  title: string;
  description: string;
  courseId: string;
  moduleId: string;
  totalMarks: number;
  passingMarks: number;
  duration: number; 
  timed: boolean;
  timeLimitInMinutes?: number;
  questions?: TestQuestion[];
}

export interface TestQuestion {
  id: string;
  text: string;
  type: 'MULTIPLE_CHOICE' | 'TRUE_FALSE' | 'SHORT_ANSWER';
  options?: string[] | { id: string; text: string }[];
  correctAnswer?: string; 
  points: number;
}

export interface Assignment {
  id: string;
  title: string;
  description: string;
  courseId: string;
  moduleId: string;
  facilitatorId: string; // ✅ Added to match Backend
  fileUrl?: string;
  dueDate: string;
  totalMarks: number;    // ✅ FIXED: Was 'totalPoints'
  isActive: boolean;
  createdAt?: string;    
}

// ✅ FIXED: Updated to match nested objects from Java
export interface AssignmentSubmission {
  id: string;
  assignment: Assignment; // Backend sends the full object
  student: User;          // Backend sends the full object
  fileUrl: string;
  submissionDate: string | number[]; // Can be ISO string or Array [2024, 1, 1...]
  grade?: number;
  feedback?: string;
  status: 'SUBMITTED' | 'GRADED' | 'LATE';
}

// --- Chat & Communication ---
export interface ChatMessage {
  id: string;
  senderId: string;
  receiverId: string;
  message: string;
  timestamp: string;
  read: boolean;
}

export interface DiscussionThread {
  id: string;
  courseId: string;
  userId: string;
  user: User;
  title: string;
  content: string;
  createdAt: string;
  replies: DiscussionReply[];
}

export interface DiscussionReply {
  id: string;
  threadId: string;
  userId: string;
  user: User;
  content: string;
  createdAt: string;
}

// --- Enrollment ---
export interface Enrollment {
  id: string;
  studentId: string;
  course: Course;
  courseId: string;
  enrolledAt: string;
  progress: number;
  isActive: boolean;
  status: 'ACTIVE' | 'COMPLETED' | 'DROPPED';
}

export interface ActivityLog {
    id: number;
    userId: number;
    action: string;
    timestamp: string;
}

export interface TestResult {
    id: string;
    quizId: string;
    studentId: string;
    score: number;
    totalMarks: number;
    date: string;
}