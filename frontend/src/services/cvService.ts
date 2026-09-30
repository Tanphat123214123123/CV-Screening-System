import api from './api';
import type { CandidateMatch, MyApplication, ReviewStatus } from '../types';

export interface UploadCvResponse {
  cvId: number;
  fileName: string;
  status: string;
  message: string;
}

export async function uploadCv(jobId: number, file: File): Promise<UploadCvResponse> {
  const form = new FormData();
  form.append('file', file);
  form.append('jobId', String(jobId));
  const { data } = await api.post('/cv/upload', form);
  return data;
}

export const getMyApplications = async (): Promise<MyApplication[]> =>
  (await api.get('/cv/mine')).data;

export const getCandidatesForJob = async (jobId: number): Promise<CandidateMatch[]> =>
  (await api.get(`/matching/job/${jobId}`)).data;

export const getDownloadUrl = async (cvId: number): Promise<string> =>
  (await api.get(`/cv/${cvId}/download`)).data.url;

export const updateReviewStatus = async (cvId: number, status: ReviewStatus): Promise<void> => {
  await api.patch(`/cv/${cvId}/review-status`, { status });
};
