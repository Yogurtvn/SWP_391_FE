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
import { uploadPrescriptionImage } from "@/services/prescriptionService";
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
      const requestBody = {
        variantId: payload.variantId,
        quantity: payload.quantity ?? 1,
      };
      const existingItem = findMergeableStandardCartItem(cart.items, payload);

      if (payload.orderType) {
        requestBody.orderType = payload.orderType;
      }

      if (existingItem) {
        await updateStandardCartItemRequest(auth.accessToken, existingItem.cartItemId, {
          quantity: Number(existingItem.quantity ?? 0) + Number(requestBody.quantity ?? 1),
        });
      } else {
        await createStandardCartItem(auth.accessToken, requestBody);
      }

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
      let prescriptionImageUrl = payload.prescriptionImageUrl;

      if (payload?.imageFile) {
        const uploadedImage = await uploadPrescriptionImage(payload.imageFile, auth.accessToken);
        prescriptionImageUrl = uploadedImage?.fileUrl ?? prescriptionImageUrl;
      }

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
        prescriptionImageUrl,
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

async function loadCartSnapshot(token, viewCache, options = {}) {
  const cart = await getMyCart(token);
  const variantDetails = await getVariantDetailsByIds(
    Array.isArray(cart?.items) ? cart.items.map((item) => item?.variantId) : [],
  );

  const normalizedCart = normalizeServerCart(cart, viewCache, variantDetails);

  if (!options.skipDuplicateMerge && (await mergeDuplicateStandardCartItems(token, normalizedCart.items))) {
    return loadCartSnapshot(token, viewCache, { skipDuplicateMerge: true });
  }

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

function findMergeableStandardCartItem(items, payload) {
  const variantId = Number(payload?.variantId ?? 0);

  if (!Number.isFinite(variantId) || variantId <= 0) {
    return null;
  }

  const orderType = normalizeCartOrderType(payload?.orderType);

  return (
    (Array.isArray(items) ? items : []).find((item) => {
      if (Number(item?.variantId ?? 0) !== variantId) {
        return false;
      }

      if (item?.hasPrescription || item?.itemType === "prescriptionConfigured") {
        return false;
      }

      return normalizeCartOrderType(item?.orderType) === orderType;
    }) ?? null
  );
}

function normalizeCartOrderType(orderType) {
  const normalizedOrderType = String(orderType ?? "ready")
    .trim()
    .toLowerCase()
    .replace(/[\s_-]+/g, "");

  return normalizedOrderType === "preorder" ? "preorder" : "ready";
}

async function mergeDuplicateStandardCartItems(token, items) {
  const groups = new Map();

  (Array.isArray(items) ? items : []).forEach((item) => {
    if (item?.hasPrescription || item?.itemType === "prescriptionConfigured") {
      return;
    }

    const variantId = Number(item?.variantId ?? 0);
    const cartItemId = Number(item?.cartItemId ?? 0);

    if (!Number.isFinite(variantId) || variantId <= 0 || !Number.isFinite(cartItemId) || cartItemId <= 0) {
      return;
    }

    const key = `${variantId}:${normalizeCartOrderType(item?.orderType)}`;
    const currentGroup = groups.get(key) ?? [];
    currentGroup.push(item);
    groups.set(key, currentGroup);
  });

  let didMerge = false;

  for (const group of groups.values()) {
    if (group.length <= 1) {
      continue;
    }

    const [primaryItem, ...duplicateItems] = group.sort(
      (firstItem, secondItem) => Number(firstItem.cartItemId ?? 0) - Number(secondItem.cartItemId ?? 0),
    );
    const mergedQuantity = group.reduce((total, item) => total + Number(item?.quantity ?? 0), 0);

    await updateStandardCartItemRequest(token, primaryItem.cartItemId, {
      quantity: Math.max(1, mergedQuantity),
    });

    for (const duplicateItem of duplicateItems) {
      await deleteCartItemRequest(token, duplicateItem.cartItemId, duplicateItem.itemType);
    }

    didMerge = true;
  }

  return didMerge;
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

