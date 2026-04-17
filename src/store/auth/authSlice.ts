import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import {
  getCurrentUserRequest,
  loginRequest,
  loginWithGoogleRequest,
  logoutRequest,
  registerRequest,
  type AuthApiResponse,
  type CurrentUserApiResponse,
  type RegisterRequestPayload,
} from "@/services/authService";
import { loadStoredAuth } from "@/store/auth/authStorage";
import type { AuthState, User, UserRole } from "@/store/auth/authTypes";

interface AuthResult {
  user: User;
  accessToken: string | null;
  refreshToken: string | null;
}

interface AuthThunkConfig {
  state: {
    auth: AuthState;
  };
  rejectValue: string;
}

const mockUsers: Array<User & { password: string }> = [
  {
    id: "admin-001",
    email: "admin@eyewear.com",
    password: "admin123",
    fullName: "Nguyen Van Admin",
    phone: "0901234567",
    role: "admin",
  },
  {
    id: "staff-001",
    email: "staff@eyewear.com",
    password: "staff123",
    fullName: "Tran Thi Staff",
    phone: "0902234567",
    role: "staff",
  },
  {
    id: "customer-001",
    email: "customer@example.com",
    password: "customer123",
    fullName: "Le Van Khach",
    phone: "0903234567",
    role: "customer",
  },
];

const storedAuth = loadStoredAuth();

const initialState: AuthState = {
  user: storedAuth.user,
  accessToken: storedAuth.accessToken,
  refreshToken: storedAuth.refreshToken,
  isReady: !storedAuth.accessToken,
  status: "idle",
  error: null,
};

export const hydrateAuthThunk = createAsyncThunk<CurrentUserApiResponse | null, void, AuthThunkConfig>(
  "auth/hydrate",
  async (_, { getState, rejectWithValue }) => {
    const accessToken = getState().auth.accessToken;

    if (!accessToken) {
      return null;
    }

    try {
      return await getCurrentUserRequest(accessToken);
    } catch {
      return rejectWithValue("Authentication required.");
    }
  },
);

export const loginThunk = createAsyncThunk<AuthResult, { email: string; password: string }, AuthThunkConfig>(
  "auth/login",
  async ({ email, password }, { rejectWithValue }) => {
    const normalizedEmail = email.trim().toLowerCase();

    try {
      const authResponse = await loginRequest(normalizedEmail, password);
      const profile = await getCurrentUserRequest(authResponse.accessToken).catch(() => null);
      return mapAuthResponseToResult(authResponse, profile);
    } catch (error) {
      const mockUser = mockUsers.find(
        (candidateUser) => candidateUser.email === normalizedEmail && candidateUser.password === password,
      );

      if (!mockUser) {
        return rejectWithValue(getErrorMessage(error, "Email hoac mat khau khong dung."));
      }

      const { password: _, ...authenticatedUser } = mockUser;
      return {
        user: authenticatedUser,
        accessToken: null,
        refreshToken: null,
      };
    }
  },
);

export const loginWithGoogleThunk = createAsyncThunk<AuthResult, string, AuthThunkConfig>(
  "auth/loginWithGoogle",
  async (credential, { rejectWithValue }) => {
    try {
      const authResponse = await loginWithGoogleRequest(credential);
      const profile = await getCurrentUserRequest(authResponse.accessToken).catch(() => null);
      return mapAuthResponseToResult(authResponse, profile);
    } catch (error) {
      return rejectWithValue(getErrorMessage(error, "Dang nhap Google that bai. Vui long thu lai."));
    }
  },
);

export const registerThunk = createAsyncThunk<AuthResult, RegisterRequestPayload, AuthThunkConfig>(
  "auth/register",
  async (payload, { dispatch, rejectWithValue }) => {
    try {
      await registerRequest(payload);
      return await dispatch(loginThunk({ email: payload.email, password: payload.password })).unwrap();
    } catch (error) {
      return rejectWithValue(getErrorMessage(error, "Dang ky that bai. Vui long thu lai."));
    }
  },
);

export const logoutThunk = createAsyncThunk<void, void, AuthThunkConfig>("auth/logout", async (_, { getState }) => {
  const { accessToken, refreshToken } = getState().auth;

  if (accessToken && refreshToken) {
    await logoutRequest(refreshToken, accessToken).catch(() => undefined);
  }
});

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(hydrateAuthThunk.pending, (state) => {
        state.isReady = false;
        state.status = "loading";
        state.error = null;
      })
      .addCase(hydrateAuthThunk.fulfilled, (state, action) => {
        state.isReady = true;
        state.status = "succeeded";
        state.error = null;

        if (!action.payload) {
          return;
        }

        state.user = mapCurrentUserToUser(action.payload, state.user);
      })
      .addCase(hydrateAuthThunk.rejected, (state, action) => {
        state.user = null;
        state.accessToken = null;
        state.refreshToken = null;
        state.isReady = true;
        state.status = "failed";
        state.error = action.payload ?? "Authentication required.";
      })
      .addCase(loginThunk.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(loginThunk.fulfilled, (state, action) => {
        state.user = action.payload.user;
        state.accessToken = action.payload.accessToken;
        state.refreshToken = action.payload.refreshToken;
        state.isReady = true;
        state.status = "succeeded";
        state.error = null;
      })
      .addCase(loginThunk.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload ?? "Dang nhap that bai.";
      })
      .addCase(loginWithGoogleThunk.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(loginWithGoogleThunk.fulfilled, (state, action) => {
        state.user = action.payload.user;
        state.accessToken = action.payload.accessToken;
        state.refreshToken = action.payload.refreshToken;
        state.isReady = true;
        state.status = "succeeded";
        state.error = null;
      })
      .addCase(loginWithGoogleThunk.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload ?? "Dang nhap Google that bai.";
      })
      .addCase(registerThunk.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(registerThunk.fulfilled, (state, action) => {
        state.user = action.payload.user;
        state.accessToken = action.payload.accessToken;
        state.refreshToken = action.payload.refreshToken;
        state.isReady = true;
        state.status = "succeeded";
        state.error = null;
      })
      .addCase(registerThunk.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload ?? "Dang ky that bai.";
      })
      .addCase(logoutThunk.fulfilled, (state) => {
        state.user = null;
        state.accessToken = null;
        state.refreshToken = null;
        state.isReady = true;
        state.status = "idle";
        state.error = null;
      });
  },
});

export default authSlice.reducer;

function mapAuthResponseToResult(authResponse: AuthApiResponse, profile: CurrentUserApiResponse | null): AuthResult {
  const apiUser = profile ?? authResponse.user;
  const resolvedRole = normalizeRole(apiUser.role);

  return {
    user: {
      id: String("userId" in apiUser ? apiUser.userId : authResponse.user.userId),
      email: apiUser.email,
      fullName: "fullName" in apiUser ? apiUser.fullName ?? "" : "",
      phone: "",
      role: resolvedRole,
    },
    accessToken: authResponse.accessToken,
    refreshToken: authResponse.refreshToken,
  };
}

function mapCurrentUserToUser(profile: CurrentUserApiResponse, previousUser: User | null): User {
  return {
    id: String(profile.userId),
    email: profile.email,
    fullName: profile.fullName ?? previousUser?.fullName ?? "",
    phone: previousUser?.phone ?? "",
    role: normalizeRole(profile.role),
  };
}

function normalizeRole(role: string): UserRole {
  const normalizedRole = role.trim().toLowerCase();

  if (normalizedRole === "admin" || normalizedRole === "staff" || normalizedRole === "customer") {
    return normalizedRole;
  }

  return "customer";
}

function getErrorMessage(error: unknown, fallbackMessage: string): string {
  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message;
  }

  return fallbackMessage;
}
