// --- User Types ---
export interface User {
  id: string;
  name?: string;       // Made optional to allow firstname/surname usage
  firstname?: string;  // Added for DB compatibility
  surname?: string;    // Added for DB compatibility
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
  facilitator?: User; // Nested object from backend
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
  contentType?: string; // Backend might send this instead of 'type'
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
  duration: number; // in minutes
  timed: boolean;
  timeLimitInMinutes?: number;
  questions?: TestQuestion[];
}

export interface TestQuestion {
  id: string;
  text: string;
  type: 'MULTIPLE_CHOICE' | 'TRUE_FALSE' | 'SHORT_ANSWER';
  options?: string[] | { id: string; text: string }[];
  correctAnswer?: string; // Only visible to facilitators
  points: number;
}

export interface Assignment {
  id: string;
  title: string;
  description: string;
  courseId: string;
  moduleId: string;
  fileUrl?: string;
  dueDate: string;
  totalPoints: number;
  isActive: boolean;
}

export interface AssignmentSubmission {
  id: string;
  assignmentId: string;
  studentId: string;
  student?: User;
  fileUrl: string;
  submissionDate: string;
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