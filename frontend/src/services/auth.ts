import { api } from './api';
import type { AuthResponse } from '../types/auth';
import type { LoginPayload, RegisterPayload } from '../types/auth';

type VerifyPayload = {
  email: string;
  code: string;
  password?: string;
  passwordConfirm?: string;
};

type ResendPayload = {
  email: string;
};

export const authService = {
  async login(payload: LoginPayload) {
    const { data } = await api.post<AuthResponse>('/auth/login', payload);
    return data;
  },
  async register(payload: RegisterPayload) {
    const { data } = await api.post<AuthResponse>('/auth/register', payload);
    return data;
  },
  async requestRegistration(payload: { name: string; lastname: string; email: string }) {
    const { data } = await api.post<AuthResponse>('/auth/request-registration', payload);
    return data;
  },
  async verify(payload: VerifyPayload) {
    const { data } = await api.post<AuthResponse>('/auth/verify', payload);
    return data;
  },
  async resendCode(payload: ResendPayload) {
    const { data } = await api.post<AuthResponse>('/auth/resend-code', payload);
    return data;
  },
};