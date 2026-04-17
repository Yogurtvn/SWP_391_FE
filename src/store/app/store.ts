import { configureStore } from "@reduxjs/toolkit";
import authReducer from "@/store/auth/authSlice";
import { persistStoredAuth } from "@/store/auth/authStorage";

export const store = configureStore({
  reducer: {
    auth: authReducer,
  },
});

store.subscribe(() => {
  const authState = store.getState().auth;

  persistStoredAuth({
    accessToken: authState.accessToken,
    refreshToken: authState.refreshToken,
    user: authState.user,
  });
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
