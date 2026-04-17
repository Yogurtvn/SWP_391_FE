import { configureStore } from "@reduxjs/toolkit";
import authReducer from "@/store/auth/authSlice";
import { persistStoredAuth } from "@/store/auth/authStorage";

const store = configureStore({
  reducer: {
    auth: authReducer,
  },
});

store.subscribe(() => {
  const { auth } = store.getState();

  persistStoredAuth({
    accessToken: auth.accessToken,
    refreshToken: auth.refreshToken,
    user: auth.user,
  });
});

export {
  store,
};
