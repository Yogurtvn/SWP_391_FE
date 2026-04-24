import { apiGet, apiPost, apiRequest } from "@/services/apiClient";

// =============================================
// USER MANAGEMENT (Admin only)
// =============================================

/**
 * GET /api/users
 * Lấy danh sách users có phân trang, lọc, tìm kiếm.
 * @param {object} params - { page, pageSize, search, role, status, sortBy, sortOrder }
 * @param {string} token - JWT access token
 */
export async function getUsers(params = {}, token) {
  const query = new URLSearchParams();
  if (params.page) query.set("page", params.page);
  if (params.pageSize) query.set("pageSize", params.pageSize);
  if (params.search) query.set("search", params.search);
  if (params.role && params.role !== "all") query.set("role", params.role);
  if (params.status && params.status !== "all") query.set("status", params.status);
  if (params.sortBy) query.set("sortBy", params.sortBy);
  if (params.sortOrder) query.set("sortOrder", params.sortOrder);

  const queryStr = query.toString();
  return apiGet(`/api/users${queryStr ? `?${queryStr}` : ""}`, { token });
}

/**
 * POST /api/users
 * Admin tạo tài khoản staff hoặc admin mới.
 * @param {object} data - { email, password, fullName, phone, role }
 * @param {string} token - JWT access token
 */
export async function createUser(data, token) {
  return apiPost("/api/users", data, { token });
}

/**
 * PATCH /api/users/{userId}/status
 * Admin khóa hoặc mở khóa tài khoản user.
 * @param {number} userId
 * @param {boolean} isActive
 * @param {string} token
 */
export async function updateUserStatus(userId, isActive, token) {
  return apiRequest(`/api/users/${userId}/status`, {
    method: "PATCH",
    body: { isActive },
    token,
  });
}

// =============================================
// REPORTS / DASHBOARD (Admin only)
// =============================================

/**
 * GET /api/reports/dashboard
 * Lấy dữ liệu tổng quan cho Dashboard admin.
 * @param {object} params - { startDate, endDate } (optional, ISO string)
 * @param {string} token
 */
export async function getDashboard(params = {}, token) {
  const query = new URLSearchParams();
  if (params.startDate) query.set("startDate", params.startDate);
  if (params.endDate) query.set("endDate", params.endDate);
  const queryStr = query.toString();
  return apiGet(`/api/reports/dashboard${queryStr ? `?${queryStr}` : ""}`, { token });
}

/**
 * GET /api/reports/revenues-summary
 * Lấy báo cáo doanh thu theo khoảng thời gian.
 * @param {object} params - { startDate, endDate, groupBy }
 * @param {string} token
 */
export async function getRevenuesSummary(params = {}, token) {
  const query = new URLSearchParams();
  if (params.startDate) query.set("startDate", params.startDate);
  if (params.endDate) query.set("endDate", params.endDate);
  if (params.groupBy) query.set("groupBy", params.groupBy);
  const queryStr = query.toString();
  return apiGet(`/api/reports/revenues-summary${queryStr ? `?${queryStr}` : ""}`, { token });
}

/**
 * GET /api/reports/orders-summary
 * Lấy tóm tắt trạng thái đơn hàng.
 * @param {object} params - { startDate, endDate }
 * @param {string} token
 */
export async function getOrdersSummary(params = {}, token) {
  const query = new URLSearchParams();
  if (params.startDate) query.set("startDate", params.startDate);
  if (params.endDate) query.set("endDate", params.endDate);
  const queryStr = query.toString();
  return apiGet(`/api/reports/orders-summary${queryStr ? `?${queryStr}` : ""}`, { token });
}

/**
 * GET /api/reports/prescriptions-summary
 * Lấy tóm tắt đơn kính cận.
 * @param {object} params - { startDate, endDate }
 * @param {string} token
 */
export async function getPrescriptionsSummary(params = {}, token) {
  const query = new URLSearchParams();
  if (params.startDate) query.set("startDate", params.startDate);
  if (params.endDate) query.set("endDate", params.endDate);
  const queryStr = query.toString();
  return apiGet(`/api/reports/prescriptions-summary${queryStr ? `?${queryStr}` : ""}`, { token });
}

/**
 * GET /api/reports/pre-orders-summary
 * Lấy tóm tắt đơn đặt trước.
 * @param {object} params - { startDate, endDate }
 * @param {string} token
 */
export async function getPreOrdersSummary(params = {}, token) {
  const query = new URLSearchParams();
  if (params.startDate) query.set("startDate", params.startDate);
  if (params.endDate) query.set("endDate", params.endDate);
  const queryStr = query.toString();
  return apiGet(`/api/reports/pre-orders-summary${queryStr ? `?${queryStr}` : ""}`, { token });
}

// =============================================
// PROMOTIONS (Admin)
// =============================================

export async function getAdminPromotions(params = {}, token) {
  const query = new URLSearchParams();
  if (params.page) query.set("page", params.page);
  if (params.pageSize) query.set("pageSize", params.pageSize);
  const queryStr = query.toString();
  return apiGet(`/api/admin/promotions${queryStr ? `?${queryStr}` : ""}`, { token });
}

export async function createAdminPromotion(data, token) {
  return apiPost("/api/admin/promotions", data, { token });
}

export async function updateAdminPromotion(promotionId, data, token) {
  return apiRequest(`/api/admin/promotions/${promotionId}`, {
    method: "PATCH",
    body: data,
    token,
  });
}

export async function updateAdminPromotionStatus(promotionId, isActive, token) {
  return apiRequest(`/api/admin/promotions/${promotionId}/status`, {
    method: "PATCH",
    body: { isActive },
    token,
  });
}

export async function deleteAdminPromotion(promotionId, token) {
  return apiRequest(`/api/admin/promotions/${promotionId}`, {
    method: "DELETE",
    token,
  });
}

// =============================================
// ORDERS (Admin + Staff)
// =============================================

/**
 * GET /api/orders
 * Lấy tất cả đơn hàng (Admin/Staff xem toàn bộ).
 * @param {object} params - { page, pageSize, orderType, orderStatus, status, search, sortBy, sortOrder }
 * @param {string} token
 */
export async function getAllOrders(params = {}, token) {
  const query = new URLSearchParams();
  if (params.page) query.set("page", params.page);
  if (params.pageSize) query.set("pageSize", params.pageSize);
  if (params.orderType) query.set("orderType", params.orderType);
  if (params.orderStatus) query.set("orderStatus", params.orderStatus);
  if (params.shippingStatus) query.set("shippingStatus", params.shippingStatus);
  if (params.paymentStatus) query.set("paymentStatus", params.paymentStatus);
  if (params.fromDate) query.set("fromDate", params.fromDate);
  if (params.toDate) query.set("toDate", params.toDate);
  // Backward compatible alias used by current dashboard call-sites.
  if (params.status && !params.orderStatus) query.set("orderStatus", params.status);
  if (params.search) query.set("search", params.search);
  if (params.sortBy) query.set("sortBy", params.sortBy);
  if (params.sortOrder) query.set("sortOrder", params.sortOrder);
  const queryStr = query.toString();
  return apiGet(`/api/orders${queryStr ? `?${queryStr}` : ""}`, { token });
}

/**
 * GET /api/orders/{orderId}
 * Lấy chi tiết một đơn hàng.
 * @param {number} orderId
 * @param {string} token
 */
export async function getOrderById(orderId, token) {
  return apiGet(`/api/orders/${orderId}`, { token });
}

export async function getOrderItems(orderId, token) {
  return apiGet(`/api/orders/${orderId}/items`, { token });
}

export async function getOrderStatusHistories(orderId, token) {
  return apiGet(`/api/orders/${orderId}/status-histories`, { token });
}

/**
 * PATCH /api/orders/{orderId}/statuses
 * Cập nhật trạng thái đơn hàng (Staff/Admin).
 * @param {number} orderId
 * @param {object} data - { status, note }
 * @param {string} token
 */
export async function updateOrderStatus(orderId, data, token) {
  return apiRequest(`/api/orders/${orderId}/statuses`, {
    method: "PATCH",
    body: data,
    token,
  });
}

/**
 * PATCH /api/orders/{orderId}/shipping-statuses
 * Cập nhật trạng thái giao hàng.
 * @param {number} orderId
 * @param {object} data - { shippingStatus, note }
 * @param {string} token
 */
export async function updateShippingStatus(orderId, data, token) {
  return apiRequest(`/api/orders/${orderId}/shipping-statuses`, {
    method: "PATCH",
    body: data,
    token,
  });
}

// =============================================
// PRODUCTS / CATEGORIES (Admin)
// =============================================

export async function getCategories(params = {}, token) {
  const query = new URLSearchParams();
  if (params.page) query.set("page", params.page);
  if (params.pageSize) query.set("pageSize", params.pageSize);
  if (params.search) query.set("search", params.search);
  if (params.sortBy) query.set("sortBy", params.sortBy);
  if (params.sortOrder) query.set("sortOrder", params.sortOrder);
  const queryStr = query.toString();

  return apiGet(`/api/categories${queryStr ? `?${queryStr}` : ""}`, { token });
}

export async function createCategory(data, token) {
  return apiPost("/api/categories", data, { token });
}

export async function updateCategory(categoryId, data, token) {
  return apiRequest(`/api/categories/${categoryId}`, {
    method: "PUT",
    body: data,
    token,
  });
}

export async function deleteCategory(categoryId, token) {
  return apiRequest(`/api/categories/${categoryId}`, {
    method: "DELETE",
    token,
  });
}

export async function getProducts(params = {}, token) {
  const query = new URLSearchParams();
  if (params.page) query.set("page", params.page);
  if (params.pageSize) query.set("pageSize", params.pageSize);
  if (params.search) query.set("search", params.search);
  if (params.categoryId) query.set("categoryId", params.categoryId);
  if (params.productType) query.set("productType", params.productType);
  if (params.minPrice != null) query.set("minPrice", params.minPrice);
  if (params.maxPrice != null) query.set("maxPrice", params.maxPrice);
  if (params.sortBy) query.set("sortBy", params.sortBy);
  if (params.sortOrder) query.set("sortOrder", params.sortOrder);
  const queryStr = query.toString();

  return apiGet(`/api/products${queryStr ? `?${queryStr}` : ""}`, { token });
}

export async function getProductById(productId, token) {
  return apiGet(`/api/products/${productId}`, { token });
}

export async function createProduct(data, token) {
  return apiPost("/api/products", data, { token });
}

export async function updateProduct(productId, data, token) {
  return apiRequest(`/api/products/${productId}`, {
    method: "PUT",
    body: data,
    token,
  });
}

export async function updateProductStatus(productId, isActive, token) {
  return apiRequest(`/api/products/${productId}/status`, {
    method: "PATCH",
    body: { isActive },
    token,
  });
}

export async function deleteProduct(productId, token) {
  return apiRequest(`/api/products/${productId}`, {
    method: "DELETE",
    token,
  });
}

export async function createProductVariant(productId, data, token) {
  return apiPost(`/api/products/${productId}/variants`, data, { token });
}

export async function getVariantById(variantId, token) {
  return apiGet(`/api/variants/${variantId}`, { token });
}

export async function getVariantsByProduct(productId, params = {}, token) {
  const query = new URLSearchParams();
  if (params.page) query.set("page", params.page);
  if (params.pageSize) query.set("pageSize", params.pageSize);
  if (params.search) query.set("search", params.search);
  if (params.sortBy) query.set("sortBy", params.sortBy);
  if (params.sortOrder) query.set("sortOrder", params.sortOrder);
  const queryStr = query.toString();

  return apiGet(`/api/products/${productId}/variants${queryStr ? `?${queryStr}` : ""}`, { token });
}

export async function updateVariant(variantId, data, token) {
  return apiRequest(`/api/variants/${variantId}`, {
    method: "PUT",
    body: data,
    token,
  });
}

export async function updateVariantStatus(variantId, isActive, token) {
  return apiRequest(`/api/variants/${variantId}/status`, {
    method: "PATCH",
    body: { isActive },
    token,
  });
}

export async function deleteVariant(variantId, token) {
  return apiRequest(`/api/variants/${variantId}`, {
    method: "DELETE",
    token,
  });
}

export async function getProductImages(productId, token) {
  return apiGet(`/api/products/${productId}/images`, { token });
}

export async function uploadProductImages(productId, files, token) {
  const formData = new FormData();

  Array.from(files).forEach((file) => {
    formData.append("files", file);
  });

  return apiRequest(`/api/products/${productId}/images`, {
    method: "POST",
    body: formData,
    token,
  });
}

export async function updateProductImageMetadata(productId, imageId, data, token) {
  return apiRequest(`/api/products/${productId}/images/${imageId}`, {
    method: "PUT",
    body: data,
    token,
  });
}

export async function deleteProductImage(productId, imageId, token) {
  return apiRequest(`/api/products/${productId}/images/${imageId}`, {
    method: "DELETE",
    token,
  });
}

// =============================================
// INVENTORY (Admin + Staff)
// =============================================

export async function getInventories(params = {}, token) {
  const query = new URLSearchParams();
  if (params.page) query.set("page", params.page);
  if (params.pageSize) query.set("pageSize", params.pageSize);
  if (params.variantId) query.set("variantId", params.variantId);
  if (params.productId) query.set("productId", params.productId);
  if (params.isPreOrderAllowed != null) query.set("isPreOrderAllowed", params.isPreOrderAllowed);
  if (params.search) query.set("search", params.search);
  if (params.sortBy) query.set("sortBy", params.sortBy);
  if (params.sortOrder) query.set("sortOrder", params.sortOrder);
  const queryStr = query.toString();

  return apiGet(`/api/inventories${queryStr ? `?${queryStr}` : ""}`, { token });
}

export async function updateInventory(variantId, data, token) {
  return apiRequest(`/api/inventories/${variantId}`, {
    method: "PUT",
    body: data,
    token,
  });
}

export async function updatePreOrder(variantId, data, token) {
  return apiRequest(`/api/inventories/${variantId}/pre-orders`, {
    method: "PATCH",
    body: data,
    token,
  });
}

export async function createStockReceipt(data, token) {
  return apiPost("/api/stock-receipts", data, { token });
}

export async function getStockReceipts(params = {}, token) {
  const query = new URLSearchParams();
  if (params.page) query.set("page", params.page);
  if (params.pageSize) query.set("pageSize", params.pageSize);
  if (params.variantId) query.set("variantId", params.variantId);
  if (params.staffId) query.set("staffId", params.staffId);
  if (params.fromDate) query.set("fromDate", params.fromDate);
  if (params.toDate) query.set("toDate", params.toDate);
  const queryStr = query.toString();

  return apiGet(`/api/stock-receipts${queryStr ? `?${queryStr}` : ""}`, { token });
}

// =============================================
// LENS TYPES (Admin)
// =============================================

export async function getLensTypes(params = {}, token) {
  const query = new URLSearchParams();
  if (params.page) query.set("page", params.page);
  if (params.pageSize) query.set("pageSize", params.pageSize);
  if (params.search) query.set("search", params.search);
  if (params.sortBy) query.set("sortBy", params.sortBy);
  if (params.sortOrder) query.set("sortOrder", params.sortOrder);
  const queryStr = query.toString();

  return apiGet(`/api/lens-types${queryStr ? `?${queryStr}` : ""}`, { token });
}

export async function createLensType(data, token) {
  return apiPost("/api/lens-types", data, { token });
}

export async function updateLensType(lensTypeId, data, token) {
  return apiRequest(`/api/lens-types/${lensTypeId}`, {
    method: "PUT",
    body: data,
    token,
  });
}

export async function updateLensTypeStatus(lensTypeId, isActive, token) {
  return apiRequest(`/api/lens-types/${lensTypeId}/status`, {
    method: "PATCH",
    body: { isActive },
    token,
  });
}

export async function deleteLensType(lensTypeId, token) {
  return apiRequest(`/api/lens-types/${lensTypeId}`, {
    method: "DELETE",
    token,
  });
}

// =============================================
// POLICIES (Admin)
// =============================================

export async function getPolicies(params = {}, token) {
  const query = new URLSearchParams();
  if (params.page) query.set("page", params.page);
  if (params.pageSize) query.set("pageSize", params.pageSize);
  if (params.search) query.set("search", params.search);
  const queryStr = query.toString();

  return apiGet(`/api/policies${queryStr ? `?${queryStr}` : ""}`, { token });
}

export async function createPolicy(data, token) {
  return apiPost("/api/policies", data, { token });
}

export async function updatePolicy(policyId, data, token) {
  return apiRequest(`/api/policies/${policyId}`, {
    method: "PUT",
    body: data,
    token,
  });
}

export async function deletePolicy(policyId, token) {
  return apiRequest(`/api/policies/${policyId}`, {
    method: "DELETE",
    token,
  });
}
