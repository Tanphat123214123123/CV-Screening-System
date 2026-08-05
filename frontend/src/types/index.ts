export type Role = 'HR' | 'CANDIDATE';

export interface AuthUser {
  token: string;
  userId: number;
  fullName: string;
  email: string;
  role: Role;
}

export interface Job {
  id: number;
  title: string;
  description: string;
  requiredSkills: string;
  location: string | null;
  active: boolean;
  createdAt: string;
}

export type CvStatus = 'PENDING' | 'PROCESSED' | 'FAILED';

export interface MyApplication {
  cvId: number;
  jobId: number;
  jobTitle: string;
  fileName: string;
  status: CvStatus;
  score: number | null;
  uploadedAt: string;
}

export interface CandidateMatch {
  cvId: number;
  candidateName: string;
  candidateEmail: string;
  fileName: string;
  status: CvStatus;
  score: number | null;
  matchedSkills: string | null;
  missingSkills: string | null;
  summary: string | null;
  yearsExperience: number | null;
  uploadedAt: string;
}
