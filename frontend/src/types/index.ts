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

/** Tin cua HR kem so lieu ung vien (GET /jobs/mine). */
export interface MyJob extends Job {
  applicantCount: number;
  pendingCount: number;
  strongCount: number;
  shortlistedCount: number;
  averageScore: number | null;
}

/** Trang thai AI xu ly CV. */
export type CvStatus = 'PENDING' | 'PROCESSED' | 'FAILED';

/** Trang thai HR xu ly ho so. */
export type ReviewStatus = 'NEW' | 'SHORTLISTED' | 'REJECTED';

export interface MyApplication {
  cvId: number;
  jobId: number;
  jobTitle: string;
  fileName: string;
  status: CvStatus;
  score: number | null;
  matchedSkills: string | null;
  missingSkills: string | null;
  uploadedAt: string;
}

export interface CandidateMatch {
  cvId: number;
  candidateName: string;
  candidateEmail: string;
  fileName: string;
  status: CvStatus;
  reviewStatus: ReviewStatus;
  score: number | null;
  matchedSkills: string | null;
  missingSkills: string | null;
  summary: string | null;
  yearsExperience: number | null;
  uploadedAt: string;
}
