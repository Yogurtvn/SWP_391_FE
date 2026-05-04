import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import {
  getCatalogCategories,
  getCatalogErrorMessage,
  getCatalogProductFilterOptions,
  getCatalogProducts,
} from "@/services/catalogService";

const initialState = {
  items: [],
  categories: [],
  filterOptions: {
    colors: [],
    sizes: [],
    frameTypes: [],
  },
  listStatus: "idle",
  categoriesStatus: "idle",
  filterOptionsStatus: "idle",
  error: null,
  categoriesError: null,
  filterOptionsError: null,
  page: 1,
  pageSize: 12,
  totalItems: 0,
  totalPages: 0,
  hasPreviousPage: false,
  hasNextPage: false,
};

export const fetchCatalogProducts = createAsyncThunk(
  "catalog/fetchProducts",
  async (filters, { rejectWithValue }) => {
    try {
      return await getCatalogProducts(filters);
    } catch (error) {
      return rejectWithValue(getCatalogErrorMessage(error, "Không thể tải danh sách sản phẩm."));
    }
  },
);

export const fetchCatalogCategories = createAsyncThunk(
  "catalog/fetchCategories",
  async (_, { rejectWithValue }) => {
    try {
      return await getCatalogCategories();
    } catch (error) {
      return rejectWithValue(getCatalogErrorMessage(error, "Không thể tải danh mục sản phẩm."));
    }
  },
);

export const fetchCatalogFilterOptions = createAsyncThunk(
  "catalog/fetchFilterOptions",
  async (productType, { rejectWithValue }) => {
    try {
      return await getCatalogProductFilterOptions(productType);
    } catch (error) {
      return rejectWithValue(getCatalogErrorMessage(error, "Không thể tải bộ lọc sản phẩm."));
    }
  },
);

const catalogSlice = createSlice({
  name: "catalog",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchCatalogProducts.pending, (state) => {
        state.listStatus = "loading";
        state.error = null;
      })
      .addCase(fetchCatalogProducts.fulfilled, (state, action) => {
        state.items = action.payload.items;
        state.page = action.payload.page;
        state.pageSize = action.payload.pageSize;
        state.totalItems = action.payload.totalItems;
        state.totalPages = action.payload.totalPages;
        state.hasPreviousPage = action.payload.hasPreviousPage;
        state.hasNextPage = action.payload.hasNextPage;
        state.listStatus = "succeeded";
        state.error = null;
      })
      .addCase(fetchCatalogProducts.rejected, (state, action) => {
        state.listStatus = "failed";
        state.error = action.payload ?? "Không thể tải danh sách sản phẩm.";
        state.items = [];
        state.totalItems = 0;
        state.totalPages = 0;
        state.hasPreviousPage = false;
        state.hasNextPage = false;
      })
      .addCase(fetchCatalogCategories.pending, (state) => {
        state.categoriesStatus = "loading";
        state.categoriesError = null;
      })
      .addCase(fetchCatalogCategories.fulfilled, (state, action) => {
        state.categories = action.payload;
        state.categoriesStatus = "succeeded";
        state.categoriesError = null;
      })
      .addCase(fetchCatalogCategories.rejected, (state, action) => {
        state.categoriesStatus = "failed";
        state.categoriesError = action.payload ?? "Không thể tải danh mục sản phẩm.";
        state.categories = [];
      })
      .addCase(fetchCatalogFilterOptions.pending, (state) => {
        state.filterOptionsStatus = "loading";
        state.filterOptionsError = null;
      })
      .addCase(fetchCatalogFilterOptions.fulfilled, (state, action) => {
        state.filterOptions = {
          colors: Array.isArray(action.payload?.colors) ? action.payload.colors : [],
          sizes: Array.isArray(action.payload?.sizes) ? action.payload.sizes : [],
          frameTypes: Array.isArray(action.payload?.frameTypes) ? action.payload.frameTypes : [],
        };
        state.filterOptionsStatus = "succeeded";
        state.filterOptionsError = null;
      })
      .addCase(fetchCatalogFilterOptions.rejected, (state, action) => {
        state.filterOptions = {
          colors: [],
          sizes: [],
          frameTypes: [],
        };
        state.filterOptionsStatus = "failed";
        state.filterOptionsError = action.payload ?? "Không thể tải bộ lọc sản phẩm.";
      });
  },
});

export const selectCatalogState = (state) => state.catalog;

export default catalogSlice.reducer;

