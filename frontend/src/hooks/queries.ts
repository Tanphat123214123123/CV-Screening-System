import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  getCandidatesForJob,
  getMyApplications,
  updateReviewStatus,
  uploadCv,
} from '../services/cvService';
import {
  closeJob,
  createJob,
  getJob,
  getJobs,
  getMyJobs,
  reopenJob,
  updateJob,
  type JobInput,
} from '../services/jobService';
import { getSkillDictionary } from '../services/skillService';
import type { CandidateMatch, CvStatus, ReviewStatus } from '../types';

export const queryKeys = {
  jobs: ['jobs'] as const,
  job: (id: number) => ['jobs', id] as const,
  myJobs: ['my-jobs'] as const,
  myApplications: ['my-applications'] as const,
  candidates: (jobId: number) => ['candidates', jobId] as const,
};

/** Poll moi 4s chi khi con CV dang cho AI xu ly - het PENDING thi tu dung. */
const POLL_MS = 4000;
const pollWhilePending = <T extends { status: CvStatus }>(data: T[] | undefined) =>
  data?.some((item) => item.status === 'PENDING') ? POLL_MS : false;

// ---------- Ung vien ----------

export const useJobs = () => useQuery({ queryKey: queryKeys.jobs, queryFn: getJobs });

export const useJob = (id: number) =>
  useQuery({ queryKey: queryKeys.job(id), queryFn: () => getJob(id), enabled: Number.isFinite(id) });

export const useMyApplications = (enabled = true) =>
  useQuery({
    queryKey: queryKeys.myApplications,
    queryFn: getMyApplications,
    enabled,
    refetchInterval: (query) => pollWhilePending(query.state.data),
  });

export function useUploadCv() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ jobId, file, onProgress }: { jobId: number; file: File; onProgress?: (p: number) => void }) =>
      uploadCv(jobId, file, onProgress),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.myApplications }),
  });
}

// ---------- HR ----------

/** Tu dien ky nang cua AI - doi rat hiem (chi khi deploy worker moi) nen cache lau. */
export const useSkillDictionary = () =>
  useQuery({ queryKey: ['skill-dictionary'], queryFn: getSkillDictionary, staleTime: 30 * 60_000 });

export const useMyJobs = () =>
  useQuery({
    queryKey: queryKeys.myJobs,
    queryFn: getMyJobs,
    refetchInterval: (query) => (query.state.data?.some((j) => j.pendingCount > 0) ? POLL_MS : false),
  });

/**
 * Key theo jobId: doi tin khac thi React Query tra ve dung du lieu cua tin do,
 * response cham cua tin cu khong the ghi de danh sach moi (tranh race condition).
 */
export const useCandidates = (jobId: number | null) =>
  useQuery({
    queryKey: queryKeys.candidates(jobId ?? -1),
    queryFn: () => getCandidatesForJob(jobId!),
    enabled: jobId !== null,
    refetchInterval: (query) => pollWhilePending(query.state.data),
  });

function useInvalidateJobs() {
  const queryClient = useQueryClient();
  return () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: queryKeys.myJobs }),
      queryClient.invalidateQueries({ queryKey: queryKeys.jobs }),
    ]);
}

export function useSaveJob() {
  const invalidate = useInvalidateJobs();
  return useMutation({
    mutationFn: ({ id, input }: { id?: number; input: JobInput }) =>
      id ? updateJob(id, input) : createJob(input),
    onSuccess: invalidate,
  });
}

export function useToggleJob() {
  const invalidate = useInvalidateJobs();
  return useMutation({
    mutationFn: ({ id, active }: { id: number; active: boolean }) =>
      active ? reopenJob(id) : closeJob(id),
    onSuccess: invalidate,
  });
}

/** Cap nhat lac quan (optimistic): UI doi ngay, loi thi hoan tac. */
export function useReviewStatus(jobId: number) {
  const queryClient = useQueryClient();
  const key = queryKeys.candidates(jobId);
  return useMutation({
    mutationFn: ({ cvId, status }: { cvId: number; status: ReviewStatus }) =>
      updateReviewStatus(cvId, status),
    onMutate: async ({ cvId, status }) => {
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<CandidateMatch[]>(key);
      queryClient.setQueryData<CandidateMatch[]>(key, (old) =>
        old?.map((c) => (c.cvId === cvId ? { ...c, reviewStatus: status } : c)),
      );
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(key, context.previous);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: key });
      queryClient.invalidateQueries({ queryKey: queryKeys.myJobs });
    },
  });
}
