import { useEffect, useRef } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  initializeAuth,
  login as loginAction,
  loginWithGoogle as loginWithGoogleAction,
  logout as logoutAction,
  register as registerAction,
  selectAuthState,
} from "@/store/auth/authSlice";

export function AuthProvider({ children }) {
  const dispatch = useAppDispatch();
  const hasInitialized = useRef(false);

  useEffect(() => {
    if (hasInitialized.current) {
      return;
    }

    hasInitialized.current = true;
    void dispatch(initializeAuth());
  }, [dispatch]);

  return <>{children}</>;
}

export function useAuth() {
  const dispatch = useAppDispatch();
  const auth = useAppSelector(selectAuthState);

  return {
    ...auth,
    isAuthenticated: Boolean(auth.user),
    login: async (credentials) => {
      const session = await dispatch(loginAction(credentials)).unwrap();
      return session.user;
    },
    register: async (payload) => {
      const session = await dispatch(registerAction(payload)).unwrap();
      return session.user;
    },
    loginWithGoogle: async (credential) => {
      const session = await dispatch(loginWithGoogleAction(credential)).unwrap();
      return session.user;
    },
    logout: () => {
      void dispatch(logoutAction());
    },
  };
}
