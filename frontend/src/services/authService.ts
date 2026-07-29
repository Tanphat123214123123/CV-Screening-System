import api from './api';
import type { AuthUser, Role } from '../types';

export async function login(email: string, password: string): Promise<AuthUser> {
  const { data } = await api.post('/auth/login', { email, password });
  return data;
}

export async function register(
  fullName: string,
  email: string,
  password: string,
  role: Role,
): Promise<AuthUser> {
  const { data } = await api.post('/auth/register', { fullName, email, password, role });
  return data;
}
