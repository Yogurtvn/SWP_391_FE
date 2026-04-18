import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { mergeCurrentUserProfile } from "@/store/auth/authSlice";
import {
  createProfileUpdatePayload,
  getMyProfile,
  getProfileErrorMessage,
  updateMyProfile,
} from "@/services/profileService";

const initialState = {
  profile: null,
  status: "idle",
  error: null,
  mutationStatus: "idle",
  mutationError: null,
};

export const fetchMyProfile = createAsyncThunk(
  "profile/fetchMyProfile",
  async (_, { getState, rejectWithValue }) => {
    const { auth } = getState();

    if (!auth?.accessToken) {
      return rejectWithValue("Vui long dang nhap de xem thong tin tai khoan.");
    }

    try {
      return await getMyProfile(auth.accessToken);
    } catch (error) {
      return rejectWithValue(getProfileErrorMessage(error, "Khong the tai thong tin tai khoan."));
    }
  },
);

export const saveMyProfile = createAsyncThunk(
  "profile/saveMyProfile",
  async (profileForm, { dispatch, getState, rejectWithValue }) => {
    const { auth } = getState();

    if (!auth?.accessToken) {
      return rejectWithValue("Vui long dang nhap de cap nhat thong tin tai khoan.");
    }

    try {
      const updatedProfile = await updateMyProfile(auth.accessToken, createProfileUpdatePayload(profileForm));

      dispatch(
        mergeCurrentUserProfile({
          email: updatedProfile.email,
          fullName: updatedProfile.fullName,
          phone: updatedProfile.phone,
        }),
      );

      return updatedProfile;
    } catch (error) {
      return rejectWithValue(getProfileErrorMessage(error, "Khong the luu thong tin tai khoan."));
    }
  },
);

const profileSlice = createSlice({
  name: "profile",
  initialState,
  reducers: {
    clearProfileState(state) {
      state.profile = null;
      state.status = "idle";
      state.error = null;
      state.mutationStatus = "idle";
      state.mutationError = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchMyProfile.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchMyProfile.fulfilled, (state, action) => {
        state.profile = action.payload;
        state.status = "succeeded";
        state.error = null;
      })
      .addCase(fetchMyProfile.rejected, (state, action) => {
        state.profile = null;
        state.status = "failed";
        state.error = action.payload ?? "Khong the tai thong tin tai khoan.";
      })
      .addCase(saveMyProfile.pending, (state) => {
        state.mutationStatus = "loading";
        state.mutationError = null;
      })
      .addCase(saveMyProfile.fulfilled, (state, action) => {
        state.profile = action.payload;
        state.mutationStatus = "succeeded";
        state.mutationError = null;
        state.error = null;
      })
      .addCase(saveMyProfile.rejected, (state, action) => {
        state.mutationStatus = "failed";
        state.mutationError = action.payload ?? "Khong the luu thong tin tai khoan.";
      });
  },
});

export const { clearProfileState } = profileSlice.actions;

export const selectProfileState = (state) => state.profile;

export default profileSlice.reducer;
