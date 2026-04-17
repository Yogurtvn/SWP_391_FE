import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import {
  getAuthErrorMessage,
  getCurrentUser,
  loginUser,
  loginWithGoogleUser,
  logoutUser,
  registerUser,
} from "@/services/authService";
import { loadStoredAuth } from "@/store/auth/authStorage";

const savedAuth = loadStoredAuth();

const initialState = {
  user: savedAuth.user,
  accessToken: savedAuth.accessToken,
  refreshToken: savedAuth.refreshToken,
  isReady: !savedAuth.accessToken,
  status: "idle",
  error: null,
};

export const initializeAuth = createAsyncThunk(
  "auth/initialize",
  async (_, { getState, rejectWithValue }) => {
    const { accessToken, user } = getState().auth;

    if (!accessToken) {
      return null;
    }

    try {
      return await getCurrentUser(accessToken, user);
    } catch (error) {
      return rejectWithValue(getAuthErrorMessage(error, "Authentication required."));
    }
  },
);

export const login = createAsyncThunk(
  "auth/login",
  async (credentials, { rejectWithValue }) => {
    try {
      return await loginUser(credentials);
    } catch (error) {
      return rejectWithValue(getAuthErrorMessage(error, "Email hoac mat khau khong dung."));
    }
  },
);

export const loginWithGoogle = createAsyncThunk(
  "auth/loginWithGoogle",
  async (credential, { rejectWithValue }) => {
    try {
      return await loginWithGoogleUser(credential);
    } catch (error) {
      return rejectWithValue(getAuthErrorMessage(error, "Dang nhap Google that bai. Vui long thu lai."));
    }
  },
);

export const register = createAsyncThunk(
  "auth/register",
  async (payload, { rejectWithValue }) => {
    try {
      return await registerUser(payload);
    } catch (error) {
      return rejectWithValue(getAuthErrorMessage(error, "Dang ky that bai. Vui long thu lai."));
    }
  },
);

export const logout = createAsyncThunk("auth/logout", async (_, { getState }) => {
  const { accessToken, refreshToken } = getState().auth;

  await logoutUser({
    accessToken,
    refreshToken,
  });
});

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    clearAuthError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(initializeAuth.pending, (state) => {
        startLoading(state);
        state.isReady = false;
      })
      .addCase(initializeAuth.fulfilled, (state, action) => {
        state.isReady = true;

        if (!action.payload) {
          state.status = "idle";
          state.error = null;
          return;
        }

        state.user = action.payload;
        state.status = "succeeded";
        state.error = null;
      })
      .addCase(initializeAuth.rejected, (state, action) => {
        clearSession(state);
        state.isReady = true;
        state.status = "failed";
        state.error = action.payload ?? "Authentication required.";
      })
      .addCase(login.pending, startLoading)
      .addCase(login.fulfilled, (state, action) => {
        saveSession(state, action.payload);
      })
      .addCase(login.rejected, (state, action) => {
        state.isReady = true;
        state.status = "failed";
        state.error = action.payload ?? "Dang nhap that bai.";
      })
      .addCase(loginWithGoogle.pending, startLoading)
      .addCase(loginWithGoogle.fulfilled, (state, action) => {
        saveSession(state, action.payload);
      })
      .addCase(loginWithGoogle.rejected, (state, action) => {
        state.isReady = true;
        state.status = "failed";
        state.error = action.payload ?? "Dang nhap Google that bai.";
      })
      .addCase(register.pending, startLoading)
      .addCase(register.fulfilled, (state, action) => {
        saveSession(state, action.payload);
      })
      .addCase(register.rejected, (state, action) => {
        state.isReady = true;
        state.status = "failed";
        state.error = action.payload ?? "Dang ky that bai.";
      })
      .addCase(logout.fulfilled, (state) => {
        clearSession(state);
        state.isReady = true;
        state.status = "idle";
      });
  },
});

export const { clearAuthError } = authSlice.actions;

export const selectAuthState = (state) => state.auth;

export default authSlice.reducer;

function startLoading(state) {
  state.status = "loading";
  state.error = null;
}

function saveSession(state, session) {
  state.user = session.user;
  state.accessToken = session.accessToken;
  state.refreshToken = session.refreshToken;
  state.isReady = true;
  state.status = "succeeded";
  state.error = null;
}

function clearSession(state) {
  state.user = null;
  state.accessToken = null;
  state.refreshToken = null;
  state.error = null;
}
