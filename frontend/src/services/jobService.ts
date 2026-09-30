import api from './api';
import type { Job, MyJob } from '../types';

export interface JobInput {
  title: string;
  description: string;
  requiredSkills: string;
  location: string;
}

/** Tin dang mo cua moi HR - danh cho ung vien. */
export const getJobs = async (): Promise<Job[]> => (await api.get('/jobs')).data;

export const getJob = async (id: number): Promise<Job> => (await api.get(`/jobs/${id}`)).data;

/** Tin do HR hien tai tao (ca tin da dong) kem so lieu ung vien. */
export const getMyJobs = async (): Promise<MyJob[]> => (await api.get('/jobs/mine')).data;

export const createJob = async (input: JobInput): Promise<Job> =>
  (await api.post('/jobs', input)).data;

export const updateJob = async (id: number, input: JobInput): Promise<Job> =>
  (await api.put(`/jobs/${id}`, input)).data;

export const closeJob = async (id: number): Promise<void> => {
  await api.delete(`/jobs/${id}`);
};

export const reopenJob = async (id: number): Promise<void> => {
  await api.post(`/jobs/${id}/reopen`);
};
