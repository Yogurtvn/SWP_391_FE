import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { getCatalogProductById } from "@/services/catalogService";
import { createCartItemView } from "@/services/cartService";
import { getLensTypes } from "@/services/lensTypeService";
import {
  calculatePrescriptionPricing,
  getPrescriptionApiErrorMessage,
  getPrescriptionById,
  getPrescriptionEligibility,
  getPrescriptions,
  reviewPrescription,
  uploadPrescriptionImage,
} from "@/services/prescriptionService";
import { addPrescriptionCartItem } from "@/store/cart/cartSlice";

const initialPagedState = {
  items: [],
  page: 1,
  pageSize: 0,
  totalItems: 0,
  totalPages: 0,
  hasPreviousPage: false,
  hasNextPage: false,
  status: "idle",
  error: null,
};

const initialState = {
  productEligibility: {},
  flow: {
    product: null,
    lensTypes: [],
    pricingOptions: {},
    eligibility: null,
    status: "idle",
    error: null,
    pricing: {
      status: "idle",
      error: "",
      framePrice: 0,
      lensBasePrice: 0,
      lensPrice: 0,
      totalPrice: 0,
    },
    imageUpload: {
      status: "idle",
      error: "",
      fileName: "",
      fileUrl: "",
    },
    submitStatus: "idle",
    submitError: null,
  },
  staffList: { ...initialPagedState },
  staffDetail: {
    data: null,
    status: "idle",
    error: null,
  },
  staffAction: {
    status: "idle",
    error: null,
  },
};

function requireToken(getState, rejectWithValue) {
  const { auth } = getState();

  if (!auth?.accessToken) {
    return rejectWithValue("Vui lòng đăng nhập.");
  }

  return auth.accessToken;
}

export const loadPrescriptionFlow = createAsyncThunk(
  "prescription/loadFlow",
  async (productId, { rejectWithValue }) => {
    const numericProductId = Number.parseInt(String(productId ?? ""), 10);

    if (!Number.isFinite(numericProductId) || numericProductId <= 0) {
      return rejectWithValue("Không tìm thấy sản phẩm hợp lệ.");
    }

    try {
      const [product, lensTypes, eligibility] = await Promise.all([
        getCatalogProductById(numericProductId),
        getLensTypes({ page: 1, pageSize: 50, isActive: true }),
        getPrescriptionEligibility(numericProductId),
      ]);

      if (!eligibility?.isEligible || !product?.prescriptionCompatible) {
        throw new Error(eligibility?.reason || "Sản phẩm này hiện không hỗ trợ kính theo toa.");
      }

      if (!Array.isArray(lensTypes) || lensTypes.length === 0) {
        throw new Error("Chưa có gói tròng kính đang hoạt động.");
      }

      return {
        product,
        lensTypes,
        eligibility,
      };
    } catch (error) {
      return rejectWithValue(getPrescriptionApiErrorMessage(error, "Không thể tải luồng kính theo toa."));
    }
  },
);

export const fetchProductPrescriptionEligibility = createAsyncThunk(
  "prescription/fetchProductEligibility",
  async (productId, { rejectWithValue }) => {
    const numericProductId = Number.parseInt(String(productId ?? ""), 10);

    if (!Number.isFinite(numericProductId) || numericProductId <= 0) {
      return rejectWithValue("Không tìm thấy sản phẩm hợp lệ.");
    }

    try {
      return await getPrescriptionEligibility(numericProductId);
    } catch (error) {
      return rejectWithValue(getPrescriptionApiErrorMessage(error, "Không thể kiểm tra hỗ trợ kính theo toa."));
    }
  },
);

export const fetchPrescriptionPricing = createAsyncThunk(
  "prescription/fetchPricing",
  async (payload, { rejectWithValue }) => {
    try {
      return await calculatePrescriptionPricing(payload);
    } catch (error) {
      return rejectWithValue(getPrescriptionApiErrorMessage(error, "Không thể tính giá kính theo toa."));
    }
  },
);

export const uploadPrescriptionImageFile = createAsyncThunk(
  "prescription/uploadImage",
  async (file, { getState, rejectWithValue }) => {
    const token = requireToken(getState, rejectWithValue);
    if (typeof token !== "string") {
      return token;
    }

    try {
      return await uploadPrescriptionImage(file, token);
    } catch (error) {
      return rejectWithValue(getPrescriptionApiErrorMessage(error, "Không thể upload ảnh toa kính."));
    }
  },
);

export const submitPrescriptionCartItem = createAsyncThunk(
  "prescription/submitCartItem",
  async (payload, { dispatch, getState, rejectWithValue }) => {
    const { auth } = getState();

    if (!auth?.accessToken || auth?.user?.role !== "customer") {
      return rejectWithValue("Vui lòng đăng nhập bằng tài khoản khách hàng.");
    }

    try {
      let prescriptionImageUrl = payload.prescriptionImageUrl ?? "";

      if (payload.imageFile && !prescriptionImageUrl) {
        const uploadedImage = await dispatch(uploadPrescriptionImageFile(payload.imageFile)).unwrap();
        prescriptionImageUrl = uploadedImage?.fileUrl ?? "";
      }

      const product = payload.product;
      const variant = payload.variant;

      await dispatch(addPrescriptionCartItem({
        variantId: variant.variantId,
        quantity: 1,
        lensTypeId: payload.lensTypeId,
        rightEye: payload.rightEye,
        leftEye: payload.leftEye,
        pd: payload.pd,
        notes: normalizeOptional(payload.notes),
        prescriptionImageUrl: normalizeOptional(prescriptionImageUrl),
        view: createCartItemView(product, variant),
      })).unwrap();

      return { prescriptionImageUrl };
    } catch (error) {
      return rejectWithValue(getPrescriptionApiErrorMessage(error, "Không thể thêm kính theo toa vào giỏ hàng."));
    }
  },
);

export const fetchStaffPrescriptions = createAsyncThunk(
  "prescription/fetchStaffList",
  async (filters = {}, { getState, rejectWithValue }) => {
    const token = requireToken(getState, rejectWithValue);
    if (typeof token !== "string") {
      return token;
    }

    try {
      return await getPrescriptions(filters, token);
    } catch (error) {
      return rejectWithValue(getPrescriptionApiErrorMessage(error, "Không thể tải danh sách toa kính."));
    }
  },
);

export const fetchStaffPrescriptionDetail = createAsyncThunk(
  "prescription/fetchStaffDetail",
  async (prescriptionId, { getState, rejectWithValue }) => {
    const token = requireToken(getState, rejectWithValue);
    if (typeof token !== "string") {
      return token;
    }

    try {
      return await getPrescriptionById(prescriptionId, token);
    } catch (error) {
      return rejectWithValue(getPrescriptionApiErrorMessage(error, "Không thể tải chi tiết toa kính."));
    }
  },
);

export const patchStaffPrescriptionReview = createAsyncThunk(
  "prescription/patchStaffReview",
  async ({ prescriptionId, payload }, { getState, rejectWithValue }) => {
    const token = requireToken(getState, rejectWithValue);
    if (typeof token !== "string") {
      return token;
    }

    try {
      return await reviewPrescription(prescriptionId, payload, token);
    } catch (error) {
      return rejectWithValue(getPrescriptionApiErrorMessage(error, "Không thể cập nhật trạng thái."));
    }
  },
);


const prescriptionSlice = createSlice({
  name: "prescription",
  initialState,
  reducers: {
    clearPrescriptionFlow(state) {
      state.flow = { ...initialState.flow };
    },
    clearPrescriptionFlowSubmit(state) {
      state.flow.submitStatus = "idle";
      state.flow.submitError = null;
    },
    clearPrescriptionImageUpload(state) {
      state.flow.imageUpload = { ...initialState.flow.imageUpload };
    },
    clearStaffPrescriptionDetail(state) {
      state.staffDetail = { ...initialState.staffDetail };
      state.staffAction = { ...initialState.staffAction };
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchProductPrescriptionEligibility.pending, (state, action) => {
        state.productEligibility[String(action.meta.arg)] = {
          status: "loading",
          error: null,
          data: null,
        };
      })
      .addCase(fetchProductPrescriptionEligibility.fulfilled, (state, action) => {
        state.productEligibility[String(action.meta.arg)] = {
          status: "succeeded",
          error: null,
          data: action.payload,
        };
      })
      .addCase(fetchProductPrescriptionEligibility.rejected, (state, action) => {
        state.productEligibility[String(action.meta.arg)] = {
          status: "failed",
          error: action.payload ?? "Không thể kiểm tra hỗ trợ kính theo toa.",
          data: null,
        };
      })
      .addCase(loadPrescriptionFlow.pending, (state) => {
        state.flow.status = "loading";
        state.flow.error = null;
        state.flow.pricing = { ...initialState.flow.pricing };
        state.flow.imageUpload = { ...initialState.flow.imageUpload };
        state.flow.submitStatus = "idle";
        state.flow.submitError = null;
      })
      .addCase(loadPrescriptionFlow.fulfilled, (state, action) => {
        state.flow.product = action.payload.product;
        state.flow.lensTypes = action.payload.lensTypes;
        state.flow.eligibility = action.payload.eligibility;
        state.flow.pricingOptions = {};
        state.flow.status = "succeeded";
        state.flow.error = null;
      })
      .addCase(loadPrescriptionFlow.rejected, (state, action) => {
        state.flow = {
          ...initialState.flow,
          status: "failed",
          error: action.payload ?? "Không thể tải luồng kính theo toa.",
        };
      })
      .addCase(fetchPrescriptionPricing.pending, (state) => {
        state.flow.pricing.status = "loading";
        state.flow.pricing.error = "";
      })
      .addCase(fetchPrescriptionPricing.fulfilled, (state, action) => {
        state.flow.pricing = {
          status: "succeeded",
          error: "",
          framePrice: Number(action.payload?.framePrice ?? 0),
          lensBasePrice: Number(action.payload?.lensBasePrice ?? 0),
          lensPrice: Number(action.payload?.lensPrice ?? 0),
          totalPrice: Number(action.payload?.totalPrice ?? 0),
        };
      })
      .addCase(fetchPrescriptionPricing.rejected, (state, action) => {
        state.flow.pricing = {
          ...initialState.flow.pricing,
          status: "failed",
          error: action.payload ?? "Không thể tính giá kính theo toa.",
        };
      })
      .addCase(uploadPrescriptionImageFile.pending, (state) => {
        state.flow.imageUpload.status = "loading";
        state.flow.imageUpload.error = "";
      })
      .addCase(uploadPrescriptionImageFile.fulfilled, (state, action) => {
        state.flow.imageUpload = {
          status: "succeeded",
          error: "",
          fileName: action.payload?.fileName ?? "",
          fileUrl: action.payload?.fileUrl ?? "",
        };
      })
      .addCase(uploadPrescriptionImageFile.rejected, (state, action) => {
        state.flow.imageUpload.status = "failed";
        state.flow.imageUpload.error = action.payload ?? "Không thể upload ảnh toa kính.";
      })
      .addCase(submitPrescriptionCartItem.pending, (state) => {
        state.flow.submitStatus = "loading";
        state.flow.submitError = null;
      })
      .addCase(submitPrescriptionCartItem.fulfilled, (state) => {
        state.flow.submitStatus = "succeeded";
        state.flow.submitError = null;
      })
      .addCase(submitPrescriptionCartItem.rejected, (state, action) => {
        state.flow.submitStatus = "failed";
        state.flow.submitError = action.payload ?? "Không thể thêm kính theo toa vào giỏ hàng.";
      })
      .addCase(fetchStaffPrescriptions.pending, (state) => {
        state.staffList.status = "loading";
        state.staffList.error = null;
      })
      .addCase(fetchStaffPrescriptions.fulfilled, (state, action) => {
        state.staffList = {
          items: Array.isArray(action.payload?.items) ? action.payload.items : [],
          page: Number(action.payload?.page ?? 1),
          pageSize: Number(action.payload?.pageSize ?? 0),
          totalItems: Number(action.payload?.totalItems ?? 0),
          totalPages: Number(action.payload?.totalPages ?? 0),
          hasPreviousPage: Boolean(action.payload?.hasPreviousPage),
          hasNextPage: Boolean(action.payload?.hasNextPage),
          status: "succeeded",
          error: null,
        };
      })
      .addCase(fetchStaffPrescriptions.rejected, (state, action) => {
        state.staffList = {
          ...initialPagedState,
          status: "failed",
          error: action.payload ?? "Không thể tải danh sách toa kính.",
        };
      })
      .addCase(fetchStaffPrescriptionDetail.pending, (state) => {
        state.staffDetail.status = "loading";
        state.staffDetail.error = null;
      })
      .addCase(fetchStaffPrescriptionDetail.fulfilled, (state, action) => {
        state.staffDetail = {
          data: action.payload,
          status: "succeeded",
          error: null,
        };
      })
      .addCase(fetchStaffPrescriptionDetail.rejected, (state, action) => {
        state.staffDetail = {
          data: null,
          status: "failed",
          error: action.payload ?? "Không thể tải chi tiết toa kính.",
        };
      })
      .addCase(patchStaffPrescriptionReview.pending, startStaffAction)
      .addCase(patchStaffPrescriptionReview.fulfilled, finishStaffAction)
      .addCase(patchStaffPrescriptionReview.rejected, failStaffAction);
  },
});

function startStaffAction(state) {
  state.staffAction.status = "loading";
  state.staffAction.error = null;
}

function finishStaffAction(state) {
  state.staffAction.status = "succeeded";
  state.staffAction.error = null;
}

function failStaffAction(state, action) {
  state.staffAction.status = "failed";
  state.staffAction.error = action.payload ?? "Không thể cập nhật toa kính.";
}

function normalizeOptional(value) {
  const normalizedValue = String(value ?? "").trim();
  return normalizedValue.length > 0 ? normalizedValue : undefined;
}

export const {
  clearPrescriptionFlow,
  clearPrescriptionFlowSubmit,
  clearPrescriptionImageUpload,
  clearStaffPrescriptionDetail,
} = prescriptionSlice.actions;

export const selectPrescriptionState = (state) => state.prescription;
export const selectPrescriptionFlowState = (state) => state.prescription.flow;
export const selectStaffPrescriptionState = (state) => ({
  list: state.prescription.staffList,
  detail: state.prescription.staffDetail,
  action: state.prescription.staffAction,
});

export default prescriptionSlice.reducer;

