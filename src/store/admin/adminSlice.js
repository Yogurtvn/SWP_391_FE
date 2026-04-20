import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import {
  createCategory,
  createLensType,
  createProduct,
  createProductVariant,
  createStockReceipt,
  deleteVariant,
  deleteLensType,
  deleteProduct,
  deleteProductImage,
  getAllOrders,
  getCategories,
  getInventories,
  getLensTypes,
  getOrderById,
  getOrderItems,
  getOrderStatusHistories,
  getProductById,
  getProductImages,
  getProducts,
  getStockReceipts,
  getVariantById,
  updateInventory,
  updateLensType,
  updateLensTypeStatus,
  updateOrderStatus,
  updatePreOrder,
  updateProduct,
  updateProductImageMetadata,
  updateProductStatus,
  updateVariant,
  updateShippingStatus,
  uploadProductImages,
} from "@/services/adminService";

const initialPagedState = {
  items: [],
  page: 1,
  pageSize: 0,
  totalItems: 0,
  totalPages: 0,
  status: "idle",
  error: null,
};

const initialState = {
  orders: { ...initialPagedState },
  currentOrder: {
    data: null,
    status: "idle",
    error: null,
  },
  lenses: { ...initialPagedState },
  inventory: {
    items: [],
    receipts: [],
    status: "idle",
    error: null,
  },
  products: {
    items: [],
    categories: [],
    status: "idle",
    error: null,
  },
  currentProduct: {
    data: null,
    status: "idle",
    error: null,
  },
};

function getAdminToken(getState, rejectWithValue) {
  const { auth } = getState();

  if (!auth?.accessToken) {
    return rejectWithValue("Khong co access token.");
  }

  return auth.accessToken;
}

function getErrorMessage(error, fallbackMessage) {
  return error?.message || fallbackMessage;
}

function normalizePagedPayload(payload) {
  return {
    items: Array.isArray(payload?.items) ? payload.items : [],
    page: Number(payload?.page ?? 1),
    pageSize: Number(payload?.pageSize ?? 0),
    totalItems: Number(payload?.totalItems ?? 0),
    totalPages: Number(payload?.totalPages ?? 0),
  };
}

export const fetchAdminOrders = createAsyncThunk(
  "admin/fetchOrders",
  async (filters = {}, { getState, rejectWithValue }) => {
    const token = getAdminToken(getState, rejectWithValue);
    if (typeof token !== "string") {
      return token;
    }

    try {
      return await getAllOrders(filters, token);
    } catch (error) {
      return rejectWithValue(getErrorMessage(error, "Khong tai duoc danh sach don hang."));
    }
  },
);

export const fetchAdminOrderDetail = createAsyncThunk(
  "admin/fetchOrderDetail",
  async (orderId, { getState, rejectWithValue }) => {
    const token = getAdminToken(getState, rejectWithValue);
    if (typeof token !== "string") {
      return token;
    }

    try {
      const detail = await getOrderById(orderId, token);
      let normalizedOrder = detail ?? null;

      if (normalizedOrder && (!Array.isArray(normalizedOrder.items) || !Array.isArray(normalizedOrder.statusHistory))) {
        const [itemsResult, historiesResult] = await Promise.all([
          getOrderItems(orderId, token),
          getOrderStatusHistories(orderId, token),
        ]);

        normalizedOrder = {
          ...normalizedOrder,
          items: normalizedOrder.items ?? itemsResult?.items ?? [],
          statusHistory: normalizedOrder.statusHistory ?? historiesResult?.items ?? [],
        };
      }

      return normalizedOrder;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error, "Khong tai duoc chi tiet don hang."));
    }
  },
);

export const patchAdminOrderStatus = createAsyncThunk(
  "admin/patchOrderStatus",
  async ({ orderId, payload }, { getState, rejectWithValue }) => {
    const token = getAdminToken(getState, rejectWithValue);
    if (typeof token !== "string") {
      return token;
    }

    try {
      return await updateOrderStatus(orderId, payload, token);
    } catch (error) {
      return rejectWithValue(getErrorMessage(error, "Khong cap nhat duoc trang thai don."));
    }
  },
);

export const patchAdminShippingStatus = createAsyncThunk(
  "admin/patchShippingStatus",
  async ({ orderId, payload }, { getState, rejectWithValue }) => {
    const token = getAdminToken(getState, rejectWithValue);
    if (typeof token !== "string") {
      return token;
    }

    try {
      return await updateShippingStatus(orderId, payload, token);
    } catch (error) {
      return rejectWithValue(getErrorMessage(error, "Khong cap nhat duoc trang thai van chuyen."));
    }
  },
);

export const fetchAdminLensTypes = createAsyncThunk(
  "admin/fetchLensTypes",
  async (params = {}, { getState, rejectWithValue }) => {
    const token = getAdminToken(getState, rejectWithValue);
    if (typeof token !== "string") {
      return token;
    }

    try {
      return await getLensTypes(params, token);
    } catch (error) {
      return rejectWithValue(getErrorMessage(error, "Khong tai duoc goi trong kinh."));
    }
  },
);

export const createAdminLensType = createAsyncThunk(
  "admin/createLensType",
  async (payload, { getState, rejectWithValue }) => {
    const token = getAdminToken(getState, rejectWithValue);
    if (typeof token !== "string") {
      return token;
    }

    try {
      return await createLensType(payload, token);
    } catch (error) {
      return rejectWithValue(getErrorMessage(error, "Khong tao duoc lens type."));
    }
  },
);

export const updateAdminLensType = createAsyncThunk(
  "admin/updateLensType",
  async ({ lensTypeId, payload }, { getState, rejectWithValue }) => {
    const token = getAdminToken(getState, rejectWithValue);
    if (typeof token !== "string") {
      return token;
    }

    try {
      return await updateLensType(lensTypeId, payload, token);
    } catch (error) {
      return rejectWithValue(getErrorMessage(error, "Khong cap nhat duoc lens type."));
    }
  },
);

export const toggleAdminLensTypeStatus = createAsyncThunk(
  "admin/toggleLensTypeStatus",
  async ({ lensTypeId, isActive }, { getState, rejectWithValue }) => {
    const token = getAdminToken(getState, rejectWithValue);
    if (typeof token !== "string") {
      return token;
    }

    try {
      return await updateLensTypeStatus(lensTypeId, isActive, token);
    } catch (error) {
      return rejectWithValue(getErrorMessage(error, "Khong cap nhat duoc trang thai lens type."));
    }
  },
);

export const removeAdminLensType = createAsyncThunk(
  "admin/removeLensType",
  async (lensTypeId, { getState, rejectWithValue }) => {
    const token = getAdminToken(getState, rejectWithValue);
    if (typeof token !== "string") {
      return token;
    }

    try {
      return await deleteLensType(lensTypeId, token);
    } catch (error) {
      return rejectWithValue(getErrorMessage(error, "Khong xoa duoc lens type."));
    }
  },
);

export const fetchAdminInventory = createAsyncThunk(
  "admin/fetchInventory",
  async (_, { getState, rejectWithValue }) => {
    const token = getAdminToken(getState, rejectWithValue);
    if (typeof token !== "string") {
      return token;
    }

    try {
      const [inventoryResult, receiptResult] = await Promise.all([
        getInventories({ page: 1, pageSize: 50, sortBy: "variantId", sortOrder: "asc" }, token),
        getStockReceipts({ page: 1, pageSize: 10 }, token),
      ]);

      const baseItems = inventoryResult?.items ?? [];
      const enrichedItems = await Promise.all(baseItems.map(async (item) => {
        try {
          const variant = await getVariantById(item.variantId, token);
          return { ...item, sku: variant?.sku ?? "-" };
        } catch {
          return { ...item, sku: "-" };
        }
      }));

      return {
        items: enrichedItems,
        receipts: receiptResult?.items ?? [],
      };
    } catch (error) {
      return rejectWithValue(getErrorMessage(error, "Khong tai duoc ton kho."));
    }
  },
);

export const saveAdminInventoryQuantity = createAsyncThunk(
  "admin/saveInventoryQuantity",
  async ({ variantId, payload }, { getState, rejectWithValue }) => {
    const token = getAdminToken(getState, rejectWithValue);
    if (typeof token !== "string") {
      return token;
    }

    try {
      return await updateInventory(variantId, payload, token);
    } catch (error) {
      return rejectWithValue(getErrorMessage(error, "Khong cap nhat duoc ton kho."));
    }
  },
);

export const saveAdminPreOrder = createAsyncThunk(
  "admin/savePreOrder",
  async ({ variantId, payload }, { getState, rejectWithValue }) => {
    const token = getAdminToken(getState, rejectWithValue);
    if (typeof token !== "string") {
      return token;
    }

    try {
      return await updatePreOrder(variantId, payload, token);
    } catch (error) {
      return rejectWithValue(getErrorMessage(error, "Khong cap nhat duoc pre-order."));
    }
  },
);

export const createAdminReceipt = createAsyncThunk(
  "admin/createReceipt",
  async (payload, { getState, rejectWithValue }) => {
    const token = getAdminToken(getState, rejectWithValue);
    if (typeof token !== "string") {
      return token;
    }

    try {
      return await createStockReceipt(payload, token);
    } catch (error) {
      return rejectWithValue(getErrorMessage(error, "Khong tao duoc phieu nhap."));
    }
  },
);

export const fetchAdminProducts = createAsyncThunk(
  "admin/fetchProducts",
  async (_, { getState, rejectWithValue }) => {
    const token = getAdminToken(getState, rejectWithValue);
    if (typeof token !== "string") {
      return token;
    }

    try {
      const [productResult, categoryResult] = await Promise.all([
        getProducts({ page: 1, pageSize: 50, sortBy: "newest", sortOrder: "desc" }, token),
        getCategories({ page: 1, pageSize: 100, sortBy: "categoryName", sortOrder: "asc" }, token),
      ]);

      return {
        products: productResult?.items ?? [],
        categories: categoryResult?.items ?? [],
      };
    } catch (error) {
      return rejectWithValue(getErrorMessage(error, "Khong tai duoc du lieu san pham."));
    }
  },
);

export const fetchAdminProductDetail = createAsyncThunk(
  "admin/fetchProductDetail",
  async (productId, { getState, rejectWithValue }) => {
    const token = getAdminToken(getState, rejectWithValue);
    if (typeof token !== "string") {
      return token;
    }

    try {
      const [detail, imageResult] = await Promise.all([
        getProductById(productId, token),
        getProductImages(productId, token),
      ]);

      return {
        ...detail,
        productId,
        images: Array.isArray(imageResult) ? imageResult : imageResult?.items ?? detail?.images ?? [],
      };
    } catch (error) {
      return rejectWithValue(getErrorMessage(error, "Khong tai duoc chi tiet san pham."));
    }
  },
);

export const createAdminCategory = createAsyncThunk(
  "admin/createCategory",
  async (payload, { getState, rejectWithValue }) => {
    const token = getAdminToken(getState, rejectWithValue);
    if (typeof token !== "string") {
      return token;
    }

    try {
      return await createCategory(payload, token);
    } catch (error) {
      return rejectWithValue(getErrorMessage(error, "Khong tao duoc danh muc."));
    }
  },
);

export const createAdminProduct = createAsyncThunk(
  "admin/createProduct",
  async (payload, { getState, rejectWithValue }) => {
    const token = getAdminToken(getState, rejectWithValue);
    if (typeof token !== "string") {
      return token;
    }

    try {
      return await createProduct(payload, token);
    } catch (error) {
      return rejectWithValue(getErrorMessage(error, "Khong tao duoc san pham."));
    }
  },
);

export const updateAdminProduct = createAsyncThunk(
  "admin/updateProduct",
  async ({ productId, payload }, { getState, rejectWithValue }) => {
    const token = getAdminToken(getState, rejectWithValue);
    if (typeof token !== "string") {
      return token;
    }

    try {
      return await updateProduct(productId, payload, token);
    } catch (error) {
      return rejectWithValue(getErrorMessage(error, "Khong cap nhat duoc san pham."));
    }
  },
);

export const createAdminVariant = createAsyncThunk(
  "admin/createVariant",
  async ({ productId, payload }, { getState, rejectWithValue }) => {
    const token = getAdminToken(getState, rejectWithValue);
    if (typeof token !== "string") {
      return token;
    }

    try {
      return await createProductVariant(productId, payload, token);
    } catch (error) {
      return rejectWithValue(getErrorMessage(error, "Khong tao duoc variant."));
    }
  },
);

export const updateAdminVariant = createAsyncThunk(
  "admin/updateVariant",
  async ({ variantId, payload }, { getState, rejectWithValue }) => {
    const token = getAdminToken(getState, rejectWithValue);
    if (typeof token !== "string") {
      return token;
    }

    try {
      return await updateVariant(variantId, payload, token);
    } catch (error) {
      return rejectWithValue(getErrorMessage(error, "Khong cap nhat duoc variant."));
    }
  },
);

export const removeAdminVariant = createAsyncThunk(
  "admin/removeVariant",
  async (variantId, { getState, rejectWithValue }) => {
    const token = getAdminToken(getState, rejectWithValue);
    if (typeof token !== "string") {
      return token;
    }

    try {
      return await deleteVariant(variantId, token);
    } catch (error) {
      return rejectWithValue(getErrorMessage(error, "Khong xoa duoc variant."));
    }
  },
);

export const toggleAdminProductStatus = createAsyncThunk(
  "admin/toggleProductStatus",
  async (product, { getState, rejectWithValue }) => {
    const token = getAdminToken(getState, rejectWithValue);
    if (typeof token !== "string") {
      return token;
    }

    try {
      const inventoryResult = await getInventories(
        { page: 1, pageSize: 200, productId: product.productId, sortBy: "variantId", sortOrder: "asc" },
        token,
      );

      const inventories = inventoryResult?.items ?? [];

      if (inventories.length === 0) {
        throw new Error("San pham chua co variant trong kho.");
      }

      if (!product.isActive) {
        const hasStock = inventories.some((item) => Number(item.quantity ?? 0) > 0);

        if (!hasStock) {
          throw new Error("San pham chua co ton kho de mo ban.");
        }

        return await updateProductStatus(product.productId, true, token);
      }

      await Promise.all(
        inventories.map((item) =>
          updateInventory(item.variantId, {
            quantity: 0,
            isPreOrderAllowed: Boolean(item.isPreOrderAllowed),
            expectedRestockDate: item.expectedRestockDate ?? null,
            preOrderNote: item.preOrderNote ?? null,
          }, token),
        ),
      );

      return await updateProductStatus(product.productId, false, token);
    } catch (error) {
      return rejectWithValue(getErrorMessage(error, "Khong doi duoc trang thai san pham."));
    }
  },
);

export const removeAdminProduct = createAsyncThunk(
  "admin/removeProduct",
  async (productId, { getState, rejectWithValue }) => {
    const token = getAdminToken(getState, rejectWithValue);
    if (typeof token !== "string") {
      return token;
    }

    try {
      return await deleteProduct(productId, token);
    } catch (error) {
      return rejectWithValue(getErrorMessage(error, "Khong xoa duoc san pham."));
    }
  },
);

export const uploadAdminProductImages = createAsyncThunk(
  "admin/uploadProductImages",
  async ({ productId, files }, { getState, rejectWithValue }) => {
    const token = getAdminToken(getState, rejectWithValue);
    if (typeof token !== "string") {
      return token;
    }

    try {
      return await uploadProductImages(productId, files, token);
    } catch (error) {
      return rejectWithValue(getErrorMessage(error, "Khong upload duoc anh san pham."));
    }
  },
);

export const setAdminPrimaryProductImage = createAsyncThunk(
  "admin/setPrimaryProductImage",
  async ({ productId, imageId, payload }, { getState, rejectWithValue }) => {
    const token = getAdminToken(getState, rejectWithValue);
    if (typeof token !== "string") {
      return token;
    }

    try {
      return await updateProductImageMetadata(productId, imageId, payload, token);
    } catch (error) {
      return rejectWithValue(getErrorMessage(error, "Khong cap nhat duoc anh chinh."));
    }
  },
);

export const removeAdminProductImage = createAsyncThunk(
  "admin/removeProductImage",
  async ({ productId, imageId }, { getState, rejectWithValue }) => {
    const token = getAdminToken(getState, rejectWithValue);
    if (typeof token !== "string") {
      return token;
    }

    try {
      return await deleteProductImage(productId, imageId, token);
    } catch (error) {
      return rejectWithValue(getErrorMessage(error, "Khong xoa duoc anh."));
    }
  },
);

const adminSlice = createSlice({
  name: "admin",
  initialState,
  reducers: {
    clearAdminCurrentOrder(state) {
      state.currentOrder.data = null;
      state.currentOrder.status = "idle";
      state.currentOrder.error = null;
    },
    clearAdminCurrentProduct(state) {
      state.currentProduct.data = null;
      state.currentProduct.status = "idle";
      state.currentProduct.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAdminOrders.pending, (state) => {
        state.orders.status = "loading";
        state.orders.error = null;
      })
      .addCase(fetchAdminOrders.fulfilled, (state, action) => {
        Object.assign(state.orders, normalizePagedPayload(action.payload));
        state.orders.status = "succeeded";
        state.orders.error = null;
      })
      .addCase(fetchAdminOrders.rejected, (state, action) => {
        state.orders = {
          ...initialPagedState,
          status: "failed",
          error: action.payload ?? "Khong tai duoc danh sach don hang.",
        };
      })
      .addCase(fetchAdminOrderDetail.pending, (state) => {
        state.currentOrder.status = "loading";
        state.currentOrder.error = null;
      })
      .addCase(fetchAdminOrderDetail.fulfilled, (state, action) => {
        state.currentOrder.status = "succeeded";
        state.currentOrder.error = null;
        state.currentOrder.data = action.payload;
      })
      .addCase(fetchAdminOrderDetail.rejected, (state, action) => {
        state.currentOrder.status = "failed";
        state.currentOrder.error = action.payload ?? "Khong tai duoc chi tiet don hang.";
        state.currentOrder.data = null;
      })
      .addCase(fetchAdminLensTypes.pending, (state) => {
        state.lenses.status = "loading";
        state.lenses.error = null;
      })
      .addCase(fetchAdminLensTypes.fulfilled, (state, action) => {
        Object.assign(state.lenses, normalizePagedPayload(action.payload));
        state.lenses.status = "succeeded";
        state.lenses.error = null;
      })
      .addCase(fetchAdminLensTypes.rejected, (state, action) => {
        state.lenses = {
          ...initialPagedState,
          status: "failed",
          error: action.payload ?? "Khong tai duoc goi trong kinh.",
        };
      })
      .addCase(fetchAdminInventory.pending, (state) => {
        state.inventory.status = "loading";
        state.inventory.error = null;
      })
      .addCase(fetchAdminInventory.fulfilled, (state, action) => {
        state.inventory.items = Array.isArray(action.payload?.items) ? action.payload.items : [];
        state.inventory.receipts = Array.isArray(action.payload?.receipts) ? action.payload.receipts : [];
        state.inventory.status = "succeeded";
        state.inventory.error = null;
      })
      .addCase(fetchAdminInventory.rejected, (state, action) => {
        state.inventory.items = [];
        state.inventory.receipts = [];
        state.inventory.status = "failed";
        state.inventory.error = action.payload ?? "Khong tai duoc ton kho.";
      })
      .addCase(fetchAdminProducts.pending, (state) => {
        state.products.status = "loading";
        state.products.error = null;
      })
      .addCase(fetchAdminProducts.fulfilled, (state, action) => {
        state.products.items = Array.isArray(action.payload?.products) ? action.payload.products : [];
        state.products.categories = Array.isArray(action.payload?.categories) ? action.payload.categories : [];
        state.products.status = "succeeded";
        state.products.error = null;
      })
      .addCase(fetchAdminProducts.rejected, (state, action) => {
        state.products.items = [];
        state.products.categories = [];
        state.products.status = "failed";
        state.products.error = action.payload ?? "Khong tai duoc du lieu san pham.";
      })
      .addCase(fetchAdminProductDetail.pending, (state) => {
        state.currentProduct.status = "loading";
        state.currentProduct.error = null;
      })
      .addCase(fetchAdminProductDetail.fulfilled, (state, action) => {
        state.currentProduct.status = "succeeded";
        state.currentProduct.error = null;
        state.currentProduct.data = action.payload;
      })
      .addCase(fetchAdminProductDetail.rejected, (state, action) => {
        state.currentProduct.status = "failed";
        state.currentProduct.error = action.payload ?? "Khong tai duoc chi tiet san pham.";
        state.currentProduct.data = null;
      });
  },
});

export const { clearAdminCurrentOrder, clearAdminCurrentProduct } = adminSlice.actions;
export const selectAdminState = (state) => state.admin;
export default adminSlice.reducer;
