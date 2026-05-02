export type Role = 'patient' | 'therapist' | 'admin';

export interface UserProfile {
  id: string;
  email: string;
  displayName: string;
  role: Role;
  photoUrl?: string;
  specialty?: string;
  bio?: string;
  createdAt: any;
}

export interface Journal {
  id: string;
  userId: string;
  content: string;
  sentiment: string;
  stressLevel: number;
  happinessLevel: number;
  anxietyLevel: number;
  aiAdvice: string;
  isCrisis: boolean;
  moodScore: number;
  createdAt: any;
}

export interface Emotion {
  id: string;
  userId: string;
  score: number;
  stressLevel: number;
  happinessLevel: number;
  anxietyLevel: number;
  createdAt: any;
}

export interface Insight {
  id: string;
  userId: string;
  summary: string;
  trend: 'improving' | 'declining' | 'stable';
  recommendations: string[];
  createdAt: any;
}

export interface CommunityPost {
  id: string;
  userId: string;
  authorName: string;
  content: string;
  likes: number;
  isPublic: boolean;
  createdAt: any;
}

export interface Appointment {
  id: string;
  patientId: string;
  therapistId: string;
  startTime: any;
  endTime: any;
  status: 'scheduled' | 'completed' | 'cancelled';
  type: string;
  notes?: string;
  createdAt: any;
}

export interface Payment {
  id: string;
  userId: string;
  therapistId: string;
  appointmentId?: string;
  amount: number;
  status: 'pending' | 'completed' | 'failed';
  stripeId?: string;
  invoiceUrl?: string;
  createdAt: any;
}

export interface Alert {
  id: string;
  userId?: string;
  type: string;
  message: string;
  isRead: boolean;
  createdAt: any;
}

export interface Recommendation {
  id: string;
  title: string;
  content: string;
  type: string;
  createdAt: any;
}
