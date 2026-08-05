import api from './api';
import type { Job } from '../types';

export interface JobInput {
  title: string;
  description: string;
  requiredSkills: string;
  location: string;
}

export const getJobs = async (): Promise<Job[]> => (await api.get('/jobs')).data;

export const createJob = async (input: JobInput): Promise<Job> =>
  (await api.post('/jobs', input)).data;

export const deleteJob = async (id: number): Promise<void> => {
  await api.delete(`/jobs/${id}`);
};
