import api from './api';
import type { CandidateMatch, MyApplication } from '../types';

export async function uploadCv(jobId: number, file: File) {
  const form = new FormData();
  form.append('file', file);
  form.append('jobId', String(jobId));
  const { data } = await api.post('/cv/upload', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
}

export const getMyApplications = async (): Promise<MyApplication[]> =>
  (await api.get('/cv/mine')).data;

export const getCandidatesForJob = async (jobId: number): Promise<CandidateMatch[]> =>
  (await api.get(`/matching/job/${jobId}`)).data;

export const getDownloadUrl = async (cvId: number): Promise<string> =>
  (await api.get(`/cv/${cvId}/download`)).data.url;
