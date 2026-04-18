import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import {
  clearMyCart as clearMyCartRequest,
  createStandardCartItem,
  deleteCartItem as deleteCartItemRequest,
  getCartErrorMessage,
  getMyCart,
  getVariantDetailsByIds,
  mergeCartViewCache,
  normalizeServerCart,
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
      return rejectWithValue(getCartErrorMessage(error, "Khong the tai gio hang."));
    }
  },
);

export const addStandardCartItem = createAsyncThunk(
  "cart/addStandardCartItem",
  async (payload, { getState, rejectWithValue }) => {
    const { auth, cart } = getState();

    if (!canUseCustomerCart(auth)) {
      return rejectWithValue("Vui long dang nhap bang tai khoan khach hang de su dung gio hang.");
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
      return rejectWithValue(getCartErrorMessage(error, "Khong the them san pham vao gio hang."));
    }
  },
);

export const updateCartItemQuantity = createAsyncThunk(
  "cart/updateCartItemQuantity",
  async ({ cartItemId, quantity }, { getState, rejectWithValue }) => {
    const { auth, cart } = getState();

    if (!canUseCustomerCart(auth)) {
      return rejectWithValue("Vui long dang nhap bang tai khoan khach hang de su dung gio hang.");
    }

    try {
      await updateStandardCartItemRequest(auth.accessToken, cartItemId, { quantity });
      return await loadCartSnapshot(auth.accessToken, cart.viewCache);
    } catch (error) {
      return rejectWithValue(getCartErrorMessage(error, "Khong the cap nhat so luong san pham."));
    }
  },
);

export const deleteCartItem = createAsyncThunk(
  "cart/deleteCartItem",
  async ({ cartItemId, itemType = "standard" }, { getState, rejectWithValue }) => {
    const { auth, cart } = getState();

    if (!canUseCustomerCart(auth)) {
      return rejectWithValue("Vui long dang nhap bang tai khoan khach hang de su dung gio hang.");
    }

    try {
      await deleteCartItemRequest(auth.accessToken, cartItemId, itemType);
      return await loadCartSnapshot(auth.accessToken, cart.viewCache);
    } catch (error) {
      return rejectWithValue(getCartErrorMessage(error, "Khong the xoa san pham khoi gio hang."));
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
      return rejectWithValue(getCartErrorMessage(error, "Khong the lam trong gio hang."));
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
        state.error = action.payload ?? "Khong the tai gio hang.";
        state.items = [];
        state.subTotal = 0;
        state.cartId = null;
      })
      .addCase(addStandardCartItem.pending, startMutation)
      .addCase(addStandardCartItem.fulfilled, finishMutation)
      .addCase(addStandardCartItem.rejected, failMutation)
      .addCase(updateCartItemQuantity.pending, startMutation)
      .addCase(updateCartItemQuantity.fulfilled, finishMutation)
      .addCase(updateCartItemQuantity.rejected, failMutation)
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
  state.mutationError = action.payload ?? "Khong the cap nhat gio hang.";
}
