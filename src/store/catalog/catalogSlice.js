import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import {
  getCatalogCategories,
  getCatalogErrorMessage,
  getCatalogProducts,
} from "@/services/catalogService";

const initialState = {
  items: [],
  categories: [],
  listStatus: "idle",
  categoriesStatus: "idle",
  error: null,
  categoriesError: null,
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
      return rejectWithValue(getCatalogErrorMessage(error, "Khong the tai danh sach san pham."));
    }
  },
);

export const fetchCatalogCategories = createAsyncThunk(
  "catalog/fetchCategories",
  async (_, { rejectWithValue }) => {
    try {
      return await getCatalogCategories();
    } catch (error) {
      return rejectWithValue(getCatalogErrorMessage(error, "Khong the tai danh muc san pham."));
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
        state.error = action.payload ?? "Khong the tai danh sach san pham.";
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
        state.categoriesError = action.payload ?? "Khong the tai danh muc san pham.";
        state.categories = [];
      });
  },
});

export const selectCatalogState = (state) => state.catalog;

export default catalogSlice.reducer;
