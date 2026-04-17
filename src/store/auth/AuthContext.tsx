import { useEffect, useRef, type ReactNode } from "react";
import type { RegisterRequestPayload } from "@/services/authService";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  hydrateAuthThunk,
  loginThunk,
  loginWithGoogleThunk,
  logoutThunk,
  registerThunk,
} from "@/store/auth/authSlice";
import type { User, UserRole } from "@/store/auth/authTypes";

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<User>;
  register: (payload: RegisterRequestPayload) => Promise<User>;
  loginWithGoogle: (credential: string) => Promise<User>;
  logout: () => void;
  isAuthenticated: boolean;
  isReady: boolean;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const dispatch = useAppDispatch();
  const hasInitialized = useRef(false);

  useEffect(() => {
    if (hasInitialized.current) {
      return;
    }

    hasInitialized.current = true;
    void dispatch(hydrateAuthThunk());
  }, [dispatch]);

  return <>{children}</>;
}

export function useAuth(): AuthContextType {
  const dispatch = useAppDispatch();
  const { user, isReady } = useAppSelector((state) => state.auth);

  return {
    user,
    isReady,
    isAuthenticated: !!user,
    login: async (email: string, password: string) => {
      const result = await dispatch(loginThunk({ email, password })).unwrap();
      return result.user;
    },
    register: async (payload: RegisterRequestPayload) => {
      const result = await dispatch(registerThunk(payload)).unwrap();
      return result.user;
    },
    loginWithGoogle: async (credential: string) => {
      const result = await dispatch(loginWithGoogleThunk(credential)).unwrap();
      return result.user;
    },
    logout: () => {
      void dispatch(logoutThunk());
    },
  };
}

export type { User, UserRole };
