import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { fetchMyCart } from "@/store/cart/cartSlice";
import {
  checkoutCartOrder,
  getMyOrders,
  getOrderById,
  getOrderErrorMessage,
  normalizeOrderDetail,
} from "@/services/orderService";

const initialState = {
  items: [],
  page: 1,
  pageSize: 0,
  totalItems: 0,
  totalPages: 0,
  hasPreviousPage: false,
  hasNextPage: false,
  listStatus: "idle",
  listError: null,
  checkoutStatus: "idle",
  checkoutError: null,
  lastCheckoutResult: null,
  currentOrder: null,
  currentOrderStatus: "idle",
  currentOrderError: null,
};

export const checkoutReadyOrder = createAsyncThunk(
  "order/checkoutReadyOrder",
  async (payload, { dispatch, getState, rejectWithValue }) => {
    const { auth } = getState();

    if (!auth?.accessToken) {
      return rejectWithValue("Vui long dang nhap de thanh toan.");
    }

    try {
      const result = await checkoutCartOrder(auth.accessToken, payload);

      try {
        await dispatch(fetchMyCart()).unwrap();
      } catch {
        // Keep the checkout result even if the cart refresh fails.
      }

      return result;
    } catch (error) {
      return rejectWithValue(getOrderErrorMessage(error, "Khong the tao don hang."));
    }
  },
);

export const fetchOrderList = createAsyncThunk(
  "order/fetchOrderList",
  async (filters = {}, { getState, rejectWithValue }) => {
    const { auth } = getState();

    if (!auth?.accessToken) {
      return rejectWithValue("Vui long dang nhap de xem danh sach don hang.");
    }

    try {
      return await getMyOrders(auth.accessToken, filters);
    } catch (error) {
      return rejectWithValue(getOrderErrorMessage(error, "Khong the tai danh sach don hang."));
    }
  },
);

export const fetchOrderDetail = createAsyncThunk(
  "order/fetchOrderDetail",
  async (orderId, { getState, rejectWithValue }) => {
    const { auth } = getState();

    if (!auth?.accessToken) {
      return rejectWithValue("Vui long dang nhap de xem don hang.");
    }

    if (!Number.isFinite(Number(orderId)) || Number(orderId) <= 0) {
      return rejectWithValue("Ma don hang khong hop le.");
    }

    try {
      const result = await getOrderById(auth.accessToken, orderId);
      return normalizeOrderDetail(result);
    } catch (error) {
      return rejectWithValue(getOrderErrorMessage(error, "Khong the tai chi tiet don hang."));
    }
  },
);

const orderSlice = createSlice({
  name: "order",
  initialState,
  reducers: {
    clearCheckoutState(state) {
      state.checkoutStatus = "idle";
      state.checkoutError = null;
      state.lastCheckoutResult = null;
    },
    clearOrderList(state) {
      state.items = [];
      state.page = 1;
      state.pageSize = 0;
      state.totalItems = 0;
      state.totalPages = 0;
      state.hasPreviousPage = false;
      state.hasNextPage = false;
      state.listStatus = "idle";
      state.listError = null;
    },
    clearCurrentOrder(state) {
      state.currentOrder = null;
      state.currentOrderStatus = "idle";
      state.currentOrderError = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchOrderList.pending, (state) => {
        state.listStatus = "loading";
        state.listError = null;
      })
      .addCase(fetchOrderList.fulfilled, (state, action) => {
        state.items = Array.isArray(action.payload?.items) ? action.payload.items : [];
        state.page = Number(action.payload?.page ?? 1);
        state.pageSize = Number(action.payload?.pageSize ?? 0);
        state.totalItems = Number(action.payload?.totalItems ?? 0);
        state.totalPages = Number(action.payload?.totalPages ?? 0);
        state.hasPreviousPage = Boolean(action.payload?.hasPreviousPage);
        state.hasNextPage = Boolean(action.payload?.hasNextPage);
        state.listStatus = "succeeded";
        state.listError = null;
      })
      .addCase(fetchOrderList.rejected, (state, action) => {
        state.items = [];
        state.page = 1;
        state.pageSize = 0;
        state.totalItems = 0;
        state.totalPages = 0;
        state.hasPreviousPage = false;
        state.hasNextPage = false;
        state.listStatus = "failed";
        state.listError = action.payload ?? "Khong the tai danh sach don hang.";
      })
      .addCase(checkoutReadyOrder.pending, (state) => {
        state.checkoutStatus = "loading";
        state.checkoutError = null;
      })
      .addCase(checkoutReadyOrder.fulfilled, (state, action) => {
        state.checkoutStatus = "succeeded";
        state.checkoutError = null;
        state.lastCheckoutResult = action.payload;
      })
      .addCase(checkoutReadyOrder.rejected, (state, action) => {
        state.checkoutStatus = "failed";
        state.checkoutError = action.payload ?? "Khong the tao don hang.";
      })
      .addCase(fetchOrderDetail.pending, (state) => {
        state.currentOrderStatus = "loading";
        state.currentOrderError = null;
      })
      .addCase(fetchOrderDetail.fulfilled, (state, action) => {
        state.currentOrderStatus = "succeeded";
        state.currentOrderError = null;
        state.currentOrder = action.payload;
      })
      .addCase(fetchOrderDetail.rejected, (state, action) => {
        state.currentOrderStatus = "failed";
        state.currentOrderError = action.payload ?? "Khong the tai chi tiet don hang.";
        state.currentOrder = null;
      });
  },
});

export const { clearCheckoutState, clearCurrentOrder, clearOrderList } = orderSlice.actions;

export const selectOrderState = (state) => state.order;

export default orderSlice.reducer;
