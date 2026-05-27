export type AuthUser = {
  id?: number;
  name: string;
  lastname?: string;
  email: string;
  verified?: boolean;
};

export type AuthResponse = {
  token?: string;
  message?: string;
  verified?: boolean;
  email?: string;
  verificationCode?: string;
};

export type RegisterPayload = {
  name: string;
  lastname: string;
  email: string;
  password: string;
  // salaryDate removed per UX request
};

export type LoginPayload = {
  email: string;
  password: string;
};