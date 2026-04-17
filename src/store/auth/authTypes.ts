export type UserRole = "customer" | "staff" | "admin";

export interface User {
  id: string;
  email: string;
  fullName: string;
  phone: string;
  role: UserRole;
}

export interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isReady: boolean;
  status: "idle" | "loading" | "succeeded" | "failed";
  error: string | null;
}
