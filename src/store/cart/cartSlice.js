import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import {
  clearMyCart as clearMyCartRequest,
  createPrescriptionCartItem,
  createStandardCartItem,
  deleteCartItem as deleteCartItemRequest,
  getCartErrorMessage,
  getMyCart,
  getVariantDetailsByIds,
  mergeCartViewCache,
  normalizeServerCart,
  updatePrescriptionCartItem as updatePrescriptionCartItemRequest,
  updateStandardCartItem as updateStandardCartItemRequest,
} from "@/services/cartService";
import { loadStoredCartViewCache } from "@/store/cart/cartStorage";

const initialState = {
  cartId: null,
  items: [],
  subTotal: 0,
  status: "idle",
  mutationStatus: "idle",
  error: null,
  mutationError: null,
  viewCache: loadStoredCartViewCache(),
};

export const fetchMyCart = createAsyncThunk(
  "cart/fetchMyCart",
  async (_, { getState, rejectWithValue }) => {
    const { auth, cart } = getState();

    if (!canUseCustomerCart(auth)) {
      return createEmptyCartPayload(cart.viewCache);
    }

    try {
      return await loadCartSnapshot(auth.accessToken, cart.viewCache);
    } catch (error) {
      return rejectWithValue(getCartErrorMessage(error, "Không thể tải giỏ hàng."));
    }
  },
);

export const addStandardCartItem = createAsyncThunk(
  "cart/addStandardCartItem",
  async (payload, { getState, rejectWithValue }) => {
    const { auth, cart } = getState();

    if (!canUseCustomerCart(auth)) {
      return rejectWithValue("Vui lòng đăng nhập bằng tài khoản khách hàng để sử dụng giỏ hàng.");
    }

    const nextViewCache = mergeCartViewCache(cart.viewCache, payload?.view);

    try {
      await createStandardCartItem(auth.accessToken, {
        variantId: payload.variantId,
        quantity: payload.quantity ?? 1,
        orderType: payload.orderType ?? "ready",
      });

      return await loadCartSnapshot(auth.accessToken, nextViewCache);
    } catch (error) {
      return rejectWithValue(getCartErrorMessage(error, "Không thể thêm sản phẩm vào giỏ hàng."));
    }
  },
);

export const addPrescriptionCartItem = createAsyncThunk(
  "cart/addPrescriptionCartItem",
  async (payload, { getState, rejectWithValue }) => {
    const { auth, cart } = getState();

    if (!canUseCustomerCart(auth)) {
      return rejectWithValue("Vui lòng đăng nhập bằng tài khoản khách hàng để sử dụng giỏ hàng.");
    }

    const nextViewCache = mergeCartViewCache(cart.viewCache, payload?.view);

    try {
      await createPrescriptionCartItem(auth.accessToken, {
        variantId: payload.variantId,
        quantity: payload.quantity ?? 1,
        lensTypeId: payload.lensTypeId,
        lensMaterial: payload.lensMaterial,
        coatings: payload.coatings,
        rightEye: payload.rightEye,
        leftEye: payload.leftEye,
        pd: payload.pd,
        notes: payload.notes,
        prescriptionImageUrl: payload.prescriptionImageUrl,
      });

      return await loadCartSnapshot(auth.accessToken, nextViewCache);
    } catch (error) {
      return rejectWithValue(getCartErrorMessage(error, "Không thể thêm sản phẩm theo toa vào giỏ hàng."));
    }
  },
);

export const updateCartItemQuantity = createAsyncThunk(
  "cart/updateCartItemQuantity",
  async ({ cartItemId, quantity }, { getState, rejectWithValue }) => {
    const { auth, cart } = getState();

    if (!canUseCustomerCart(auth)) {
      return rejectWithValue("Vui lòng đăng nhập bằng tài khoản khách hàng để sử dụng giỏ hàng.");
    }

    try {
      await updateStandardCartItemRequest(auth.accessToken, cartItemId, { quantity });
      return await loadCartSnapshot(auth.accessToken, cart.viewCache);
    } catch (error) {
      return rejectWithValue(getCartErrorMessage(error, "Không thể cập nhật số lượng sản phẩm."));
    }
  },
);

export const updatePrescriptionCartItem = createAsyncThunk(
  "cart/updatePrescriptionCartItem",
  async (payload, { getState, rejectWithValue }) => {
    const { auth, cart } = getState();

    if (!canUseCustomerCart(auth)) {
      return rejectWithValue("Vui lòng đăng nhập bằng tài khoản khách hàng để sử dụng giỏ hàng.");
    }

    const nextViewCache = mergeCartViewCache(cart.viewCache, payload?.view);

    try {
      await updatePrescriptionCartItemRequest(auth.accessToken, payload.cartItemId, {
        variantId: payload.variantId,
        quantity: 1,
        lensTypeId: payload.lensTypeId,
        lensMaterial: payload.lensMaterial,
        coatings: payload.coatings,
        rightEye: payload.rightEye,
        leftEye: payload.leftEye,
        pd: payload.pd,
        notes: payload.notes,
        prescriptionImageUrl: payload.prescriptionImageUrl,
      });

      return await loadCartSnapshot(auth.accessToken, nextViewCache);
    } catch (error) {
      return rejectWithValue(getCartErrorMessage(error, "Không thể cập nhật sản phẩm theo toa."));
    }
  },
);

export const deleteCartItem = createAsyncThunk(
  "cart/deleteCartItem",
  async ({ cartItemId, itemType = "standard" }, { getState, rejectWithValue }) => {
    const { auth, cart } = getState();

    if (!canUseCustomerCart(auth)) {
      return rejectWithValue("Vui lòng đăng nhập bằng tài khoản khách hàng để sử dụng giỏ hàng.");
    }

    try {
      await deleteCartItemRequest(auth.accessToken, cartItemId, itemType);
      return await loadCartSnapshot(auth.accessToken, cart.viewCache);
    } catch (error) {
      return rejectWithValue(getCartErrorMessage(error, "Không thể xóa sản phẩm khỏi giỏ hàng."));
    }
  },
);

export const clearMyCart = createAsyncThunk(
  "cart/clearMyCart",
  async (_, { getState, rejectWithValue }) => {
    const { auth, cart } = getState();

    if (!canUseCustomerCart(auth)) {
      return createEmptyCartPayload(cart.viewCache);
    }

    try {
      await clearMyCartRequest(auth.accessToken);
      return createEmptyCartPayload(cart.viewCache);
    } catch (error) {
      return rejectWithValue(getCartErrorMessage(error, "Không thể làm trống giỏ hàng."));
    }
  },
);

const cartSlice = createSlice({
  name: "cart",
  initialState,
  reducers: {
    resetCartState(state) {
      state.cartId = null;
      state.items = [];
      state.subTotal = 0;
      state.status = "idle";
      state.mutationStatus = "idle";
      state.error = null;
      state.mutationError = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchMyCart.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchMyCart.fulfilled, (state, action) => {
        applySnapshot(state, action.payload);
        state.status = "succeeded";
        state.error = null;
      })
      .addCase(fetchMyCart.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload ?? "Không thể tải giỏ hàng.";
        state.items = [];
        state.subTotal = 0;
        state.cartId = null;
      })
      .addCase(addStandardCartItem.pending, startMutation)
      .addCase(addStandardCartItem.fulfilled, finishMutation)
      .addCase(addStandardCartItem.rejected, failMutation)
      .addCase(addPrescriptionCartItem.pending, startMutation)
      .addCase(addPrescriptionCartItem.fulfilled, finishMutation)
      .addCase(addPrescriptionCartItem.rejected, failMutation)
      .addCase(updateCartItemQuantity.pending, startMutation)
      .addCase(updateCartItemQuantity.fulfilled, finishMutation)
      .addCase(updateCartItemQuantity.rejected, failMutation)
      .addCase(updatePrescriptionCartItem.pending, startMutation)
      .addCase(updatePrescriptionCartItem.fulfilled, finishMutation)
      .addCase(updatePrescriptionCartItem.rejected, failMutation)
      .addCase(deleteCartItem.pending, startMutation)
      .addCase(deleteCartItem.fulfilled, finishMutation)
      .addCase(deleteCartItem.rejected, failMutation)
      .addCase(clearMyCart.pending, startMutation)
      .addCase(clearMyCart.fulfilled, finishMutation)
      .addCase(clearMyCart.rejected, failMutation);
  },
});

export const { resetCartState } = cartSlice.actions;

export const selectCartState = (state) => state.cart;

export default cartSlice.reducer;

async function loadCartSnapshot(token, viewCache) {
  const cart = await getMyCart(token);
  const variantDetails = await getVariantDetailsByIds(
    Array.isArray(cart?.items) ? cart.items.map((item) => item?.variantId) : [],
  );

  const normalizedCart = normalizeServerCart(cart, viewCache, variantDetails);

  return {
    ...normalizedCart,
    viewCache,
  };
}

function createEmptyCartPayload(viewCache) {
  return {
    cartId: null,
    items: [],
    subTotal: 0,
    viewCache,
  };
}

function canUseCustomerCart(authState) {
  return Boolean(authState?.accessToken) && authState?.user?.role === "customer";
}

function applySnapshot(state, payload) {
  state.cartId = payload?.cartId ?? null;
  state.items = Array.isArray(payload?.items) ? payload.items : [];
  state.subTotal = Number(payload?.subTotal ?? 0);
  state.viewCache = payload?.viewCache ?? state.viewCache;
}

function startMutation(state) {
  state.mutationStatus = "loading";
  state.mutationError = null;
}

function finishMutation(state, action) {
  applySnapshot(state, action.payload);
  state.status = "succeeded";
  state.mutationStatus = "succeeded";
  state.error = null;
  state.mutationError = null;
}

function failMutation(state, action) {
  state.mutationStatus = "failed";
  state.mutationError = action.payload ?? "Không thể cập nhật giỏ hàng.";
}

