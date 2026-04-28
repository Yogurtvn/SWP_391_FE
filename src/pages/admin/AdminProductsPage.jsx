import { useEffect, useMemo, useState } from "react";
import {
  Box,
  ChevronDown,
  Eye,
  Filter,
  Image as ImageIcon,
  Layers3,
  Palette,
  Pencil,
  Plus,
  Power,
  Search,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { AdminPagination } from "@/components/admin/admin-ui";
import { useAdminProductsPage } from "@/hooks/admin/useAdminProductsPage";
import { resolveColorHex } from "@/utils/color";

const COLOR_OPTIONS = [
  { name: "Đen", code: "#000000" },
  { name: "Nâu", code: "#8B4513" },
  { name: "Xanh navy", code: "#1E3A8A" },
  { name: "Xám", code: "#808080" },
  { name: "Vàng gold", code: "#FFD700" },
  { name: "Bạc", code: "#C0C0C0" },
  { name: "Đỏ", code: "#DC2626" },
  { name: "Xanh lá", code: "#16A34A" },
  { name: "Hồng", code: "#EC4899" },
  { name: "Be", code: "#D2B48C" },
];

const PRODUCT_TYPE_OPTIONS = [
  { value: "Frame", label: "Gọng kính" },
  { value: "Lens", label: "Tròng kính" },
  { value: "Sunglasses", label: "Kính râm" },
];

const PAGE_SIZE = 10;

function formatCurrency(value) {
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(Number(value || 0));
}

function normalizeValue(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[\s_-]+/g, "");
}

function getColorCode(colorName) {
  const matched = COLOR_OPTIONS.find((color) => normalizeValue(color.name) === normalizeValue(colorName));
  if (matched?.code) {
    return matched.code;
  }

  return resolveColorHex(colorName) || "#d1d5db";
}

function getProductImage(product) {
  return product?.thumbnailUrl || product?.imageUrl || product?.images?.[0] || "";
}

function getProductBadgeColor(type) {
  const normalized = normalizeValue(type);

  if (normalized === "frame") return "border-blue-200 bg-blue-100 text-blue-800";
  if (normalized === "sunglasses") return "border-purple-200 bg-purple-100 text-purple-800";
  if (normalized === "lens") return "border-emerald-200 bg-emerald-100 text-emerald-800";
  return "border-gray-200 bg-gray-100 text-gray-800";
}

function getProductTypeLabel(type) {
  const matched = PRODUCT_TYPE_OPTIONS.find((item) => normalizeValue(item.value) === normalizeValue(type));
  return matched?.label || type || "Khác";
}

function getStockBadgeColor(stock) {
  if (stock <= 0) {
    return "border-red-300 bg-red-100 text-red-800";
  }

  if (stock < 20) {
    return "border-amber-300 bg-amber-100 text-amber-800";
  }

  return "border-green-300 bg-green-100 text-green-800";
}

export default function AdminProductsPage() {
  const {
    products,
    categories,
    productDetail,
    form,
    editForm,
    editVariants,
    currentVariantPickerForm,
    createImageForm,
    draftVariants,
    availableDbVariants,
    productSummaries,
    variantForm,
    ui,
    actions,
    popupElement,
  } = useAdminProductsPage();

  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [typeFilter, setTypeFilter] = useState("all");
  const [stockFilter, setStockFilter] = useState("all");
  const [availabilityFilter, setAvailabilityFilter] = useState("all");
  const [isCreateMởdalOpen, setIsCreateMởdalOpen] = useState(false);
  const [variantSearchQuery, setVariantSearchQuery] = useState("");
  const [variantStockFilter, setVariantStockFilter] = useState("all");
  const [page, setPage] = useState(1);

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const query = searchQuery.trim().toLowerCase();
      const summary = productSummaries[String(product.productId)] ?? {
        primarySku: "",
        colors: [],
        totalStock: 0,
      };

      const matchesSearch =
        !query ||
        String(product.productName || "").toLowerCase().includes(query) ||
        String(product.productType || "").toLowerCase().includes(query) ||
        String(getProductTypeLabel(product.productType) || "").toLowerCase().includes(query) ||
        String(summary.primarySku || "").toLowerCase().includes(query) ||
        summary.colors.some((color) => String(color).toLowerCase().includes(query));

      const matchesType = typeFilter === "all" || normalizeValue(product.productType) === normalizeValue(typeFilter);

      const matchesAvailability =
        availabilityFilter === "all" ||
        (availabilityFilter === "available" && product.isActive !== false) ||
        (availabilityFilter === "inactive" && product.isActive === false);

      const matchesStock =
        stockFilter === "all" ||
        (stockFilter === "low" && summary.totalStock > 0 && summary.totalStock < 20) ||
        (stockFilter === "out" && summary.totalStock <= 0) ||
        (stockFilter === "good" && summary.totalStock >= 20);

      return matchesSearch && matchesType && matchesAvailability && matchesStock;
    });
  }, [availabilityFilter, productSummaries, products, searchQuery, stockFilter, typeFilter]);

  const activeFilterCount = [typeFilter, stockFilter, availabilityFilter].filter((value) => value !== "all").length;
  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / PAGE_SIZE));
  const paginatedProducts = useMemo(
    () => filteredProducts.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [filteredProducts, page],
  );
  const selectedVariantId = Number(currentVariantPickerForm.selectedVariantId || 0);
  const selectedDraftVariantIds = useMemo(
    () => new Set(draftVariants.map((draft) => Number(draft.sourceVariantId ?? 0))),
    [draftVariants],
  );
  const selectedVariant = useMemo(
    () => availableDbVariants.find((variant) => variant.variantId === selectedVariantId) ?? null,
    [availableDbVariants, selectedVariantId],
  );
  const filteredAvailableDbVariants = useMemo(() => {
    const normalizedQuery = variantSearchQuery.trim().toLowerCase();

    return availableDbVariants.filter((variant) => {
      const matchesStock =
        variantStockFilter === "all" ||
        (variantStockFilter === "inStock" && Number(variant.quantity ?? 0) > 0) ||
        (variantStockFilter === "outStock" && Number(variant.quantity ?? 0) <= 0);

      if (!matchesStock) {
        return false;
      }

      if (!normalizedQuery) {
        return true;
      }

      const searchable = [
        variant.variantId,
        variant.sourceSku,
        variant.sourceProductName,
        variant.colorName,
        variant.size,
        variant.frameType,
      ]
        .map((value) => String(value ?? "").toLowerCase())
        .join(" ");

      return searchable.includes(normalizedQuery);
    });
  }, [availableDbVariants, variantSearchQuery, variantStockFilter]);

  useEffect(() => {
    setPage(1);
  }, [availabilityFilter, searchQuery, stockFilter, typeFilter]);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  function openCreateMởdal() {
    actions.resetCreateProductBuilder();
    setVariantSearchQuery("");
    setVariantStockFilter("all");
    setIsCreateMởdalOpen(true);
  }

  function closeCreateMởdal() {
    actions.resetCreateProductBuilder();
    setVariantSearchQuery("");
    setVariantStockFilter("all");
    setIsCreateMởdalOpen(false);
  }

  async function handleCreateProduct(event) {
    const created = await actions.createProduct(event);

    if (created?.productId) {
      setIsCreateMởdalOpen(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#fffaf2] px-4 py-6 md:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="rounded-2xl border-2 border-gray-300 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <h1 className="mb-2 text-3xl font-bold text-gray-900">Quản Lý Sản Phẩm</h1>
              <p className="text-gray-600">
                Tổng số: <span className="font-bold text-primary">{filteredProducts.length}</span> sản phẩm
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={actions.retry}
                className="inline-flex items-center justify-center rounded-xl border-2 border-gray-300 bg-white px-4 py-3 font-semibold text-gray-900 transition hover:bg-gray-50"
              >
                Tải lại
              </button>
              <button
                type="button"
                onClick={openCreateMởdal}
                className="inline-flex items-center gap-2 rounded-xl border-2 border-primary bg-primary px-6 py-3 font-bold text-white shadow-lg shadow-primary/20 transition hover:bg-primary/90"
              >
                <Plus className="h-5 w-5" />
                Thêm Sản Phẩm
              </button>
            </div>
          </div>
        </div>

        {ui.error ? (
          <div className="rounded-2xl border-2 border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {ui.error}
          </div>
        ) : null}

        <div className="rounded-2xl border-2 border-gray-300 bg-white p-6 shadow-sm">
          <div className="relative mb-4">
            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Tìm kiếm theo tên, SKU, màu sắc..."
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              className="w-full rounded-xl border-2 border-gray-300 py-3 pl-12 pr-4 text-base text-gray-900 transition-all placeholder:text-gray-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => setShowFilters((current) => !current)}
              className="inline-flex items-center gap-2 rounded-lg border-2 border-gray-300 px-4 py-2 font-medium text-gray-900 transition hover:bg-gray-50"
            >
              <Filter className="h-4 w-4" />
              Bộ Lọc
              {activeFilterCount > 0 ? (
                <span className="rounded-full bg-primary px-2 py-0.5 text-xs font-bold text-white">{activeFilterCount}</span>
              ) : null}
              <ChevronDown className={`h-4 w-4 transition-transform ${showFilters ? "rotate-180" : ""}`} />
            </button>

            {activeFilterCount > 0 ? (
              <button
                type="button"
                onClick={() => {
                  setTypeFilter("all");
                  setStockFilter("all");
                  setAvailabilityFilter("all");
                }}
                className="text-sm font-medium text-primary hover:underline"
              >
                Xóa bộ lọc
              </button>
            ) : null}
          </div>

          {showFilters ? (
            <div className="mt-4 grid gap-4 border-t-2 border-gray-200 pt-4 md:grid-cols-3">
              <div>
                <label className="mb-2 block text-sm font-bold text-gray-700">Loại sản phẩm</label>
                <select
                  value={typeFilter}
                  onChange={(event) => setTypeFilter(event.target.value)}
                  className="w-full rounded-lg border-2 border-gray-300 px-3 py-2 focus:border-primary focus:outline-none"
                >
                  <option value="all">Tất cả</option>
                  {PRODUCT_TYPE_OPTIONS.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold text-gray-700">Tồn kho</label>
                <select
                  value={stockFilter}
                  onChange={(event) => setStockFilter(event.target.value)}
                  className="w-full rounded-lg border-2 border-gray-300 px-3 py-2 focus:border-primary focus:outline-none"
                >
                  <option value="all">Tất cả</option>
                  <option value="good">Từ 20 trở lên</option>
                  <option value="low">Dưới 20</option>
                  <option value="out">Hết hàng</option>
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold text-gray-700">Khả dụng</label>
                <select
                  value={availabilityFilter}
                  onChange={(event) => setAvailabilityFilter(event.target.value)}
                  className="w-full rounded-lg border-2 border-gray-300 px-3 py-2 focus:border-primary focus:outline-none"
                >
                  <option value="all">Tất cả</option>
                  <option value="available">Đang bán</option>
                  <option value="inactive">Ngừng bán</option>
                </select>
              </div>
            </div>
          ) : null}
        </div>

        <div className="overflow-hidden rounded-2xl border-2 border-gray-300 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1080px]">
              <thead className="border-b-2 border-gray-300 bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-bold text-gray-900">Sản phẩm</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-gray-900">SKU</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-gray-900">Loại</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-gray-900">Giá</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-gray-900">Màu sắc</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-gray-900">Tồn kho</th>
                  <th className="px-6 py-4 text-right text-sm font-bold text-gray-900">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y-2 divide-gray-200">
                {ui.isLoading ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                      Đang tải sản phẩm...
                    </td>
                  </tr>
                ) : null}

                {!ui.isLoading && filteredProducts.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                      Không tìm thấy sản phẩm nào
                    </td>
                  </tr>
                ) : null}

                {paginatedProducts.map((product) => {
                  const imageUrl = getProductImage(product);
                  const summary = productSummaries[String(product.productId)] ?? {
                    primarySku: "-",
                    colors: [],
                    totalStock: 0,
                  };

                  return (
                    <tr key={product.productId} className="transition-colors hover:bg-gray-50">
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-4">
                          {imageUrl ? (
                            <img
                              src={imageUrl}
                              alt={product.productName}
                              className="h-16 w-16 rounded-xl border-2 border-gray-200 object-cover"
                            />
                          ) : (
                            <div className="flex h-16 w-16 items-center justify-center rounded-xl border-2 border-gray-200 bg-orange-100 text-primary">
                              <Box className="h-7 w-7" />
                            </div>
                          )}

                          <div>
                            <p className="text-xl font-bold text-gray-900">{product.productName}</p>
                            <div className="mt-1 flex items-center gap-2">
                              <p className="text-sm text-gray-500">ID: {product.productId}</p>
                              <span
                                className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                                  product.isActive === false
                                    ? "bg-gray-200 text-gray-700"
                                    : "bg-emerald-100 text-emerald-700"
                                }`}
                              >
                                {product.isActive === false ? "Ngừng bán" : "Đang bán"}
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5 text-sm font-semibold text-gray-700">
                        {ui.isLoadingSummaries ? "Đang tải..." : summary.primarySku}
                      </td>
                      <td className="px-6 py-5">
                        <span className={`rounded-full border-2 px-3 py-1 text-xs font-bold ${getProductBadgeColor(product.productType)}`}>
                          {getProductTypeLabel(product.productType)}
                        </span>
                      </td>
                      <td className="px-6 py-5 text-base font-bold text-primary">{formatCurrency(product.basePrice)}</td>
                      <td className="px-6 py-5">
                        <div className="flex flex-wrap gap-1.5">
                          {summary.colors.length === 0 ? (
                            <span className="text-sm text-gray-400">-</span>
                          ) : (
                            summary.colors.map((color) => (
                              <div
                                key={color}
                                className="h-6 w-6 rounded-full border-2 border-gray-300"
                                style={{ backgroundColor: getColorCode(color) }}
                                title={color}
                              />
                            ))
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <span className={`rounded-full border-2 px-3 py-1 text-xs font-bold ${getStockBadgeColor(summary.totalStock)}`}>
                          {summary.totalStock}
                        </span>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => actions.viewDetail(product)}
                            className="rounded-lg border-2 border-transparent p-2 text-primary transition hover:border-primary hover:bg-orange-50"
                            title="Chi tiết"
                          >
                            <Eye className="h-5 w-5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => actions.openEditMởdal(product)}
                            className="rounded-lg border-2 border-transparent p-2 text-sky-600 transition hover:border-sky-400 hover:bg-sky-50"
                            title="Chỉnh sửa"
                            disabled={ui.isLoadingEditProduct}
                          >
                            <Pencil className="h-5 w-5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => actions.openVariantMởdal(product)}
                            className="rounded-lg border-2 border-transparent p-2 text-primary transition hover:border-primary hover:bg-orange-50"
                            title="Thêm variant"
                          >
                            <Layers3 className="h-5 w-5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => actions.toggleProductStatus(product)}
                            className={`rounded-lg border-2 border-transparent p-2 transition hover:bg-gray-100 ${
                              product.isActive === false
                                ? "text-green-600 hover:border-green-400"
                                : "text-amber-600 hover:border-amber-400"
                            }`}
                            title={product.isActive === false ? "Mở bán" : "Ngừng bán"}
                          >
                            <Power className="h-5 w-5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => actions.deleteProduct(product)}
                            className="rounded-lg border-2 border-transparent p-2 text-red-500 transition hover:border-red-400 hover:bg-red-50"
                            title="Xóa"
                          >
                            <Trash2 className="h-5 w-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <AdminPagination
            page={page}
            totalPages={totalPages}
            onPageChange={setPage}
            summary={`Trang ${page} / ${totalPages} - hiển thị ${paginatedProducts.length} / ${filteredProducts.length} sản phẩm`}
            className="border-t-2 border-gray-200 px-6 py-4"
          />
        </div>
      </div>

      {ui.isEditMởdalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="max-h-[92vh] w-full max-w-6xl overflow-y-auto rounded-2xl border-2 border-gray-300 bg-white shadow-2xl">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b-2 border-gray-300 bg-white p-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Chỉnh Sửa Sản Phẩm</h2>
                <p className="mt-1 text-sm text-gray-500">
                  Chỉnh sửa thông tin, hình ảnh và variant trong cùng một modal.
                </p>
              </div>
              <button
                type="button"
                onClick={() => actions.closeEditMởdal()}
                className="rounded-lg border-2 border-transparent p-2 transition hover:border-gray-300 hover:bg-gray-100"
                disabled={ui.isUpdatingProduct}
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={actions.submitEditProduct} className="p-6">
              {ui.detailLoading && !productDetail ? (
                <p className="text-sm text-gray-500">Đang tải dữ liệu sản phẩm...</p>
              ) : (
                <>
                  <div className="mb-6">
                    <h3 className="mb-4 flex items-center gap-2 text-lg font-bold text-gray-900">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                        <ImageIcon className="h-4 w-4 text-primary" />
                      </div>
                      Thông Tin Cơ Bản
                    </h3>

                    <div className="space-y-4">
                      <div className="grid gap-4 md:grid-cols-2">
                        <div>
                          <label className="mb-2 block text-sm font-bold text-gray-700">
                            Tên sản phẩm <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            value={editForm.productName}
                            onChange={(event) => actions.setEditFormField("productName", event.target.value)}
                            className="w-full rounded-xl border-2 border-gray-300 px-4 py-3 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                            required
                          />
                        </div>

                        <div>
                          <label className="mb-2 block text-sm font-bold text-gray-700">
                            Danh mục <span className="text-red-500">*</span>
                          </label>
                          <select
                            value={editForm.categoryId}
                            onChange={(event) => actions.setEditFormField("categoryId", event.target.value)}
                            className="w-full rounded-xl border-2 border-gray-300 px-4 py-3 focus:border-primary focus:outline-none"
                            required
                          >
                            <option value="">Chọn danh mục</option>
                            {categories.map((category) => (
                              <option key={category.categoryId} value={category.categoryId}>
                                {category.categoryName}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className="grid gap-4 md:grid-cols-3">
                        <div>
                          <label className="mb-2 block text-sm font-bold text-gray-700">
                            Loại sản phẩm <span className="text-red-500">*</span>
                          </label>
                          <select
                            value={editForm.productType}
                            onChange={(event) => actions.setEditFormField("productType", event.target.value)}
                            className="w-full rounded-xl border-2 border-gray-300 px-4 py-3 focus:border-primary focus:outline-none"
                          >
                            {PRODUCT_TYPE_OPTIONS.map((type) => (
                              <option key={type.value} value={type.value}>
                                {type.label}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="mb-2 block text-sm font-bold text-gray-700">
                            Giá (VND) <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="number"
                            min="0"
                            value={editForm.basePrice}
                            onChange={(event) => actions.setEditFormField("basePrice", event.target.value)}
                            className="w-full rounded-xl border-2 border-gray-300 px-4 py-3 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                            required
                          />
                        </div>

                        <label className="flex items-center gap-3 rounded-xl border-2 border-gray-300 px-4 py-3 font-semibold text-gray-900">
                          <input
                            type="checkbox"
                            checked={editForm.prescriptionCompatible}
                            onChange={(event) => actions.setEditFormField("prescriptionCompatible", event.target.checked)}
                          />
                          Hỗ trợ kính thuốc
                        </label>
                      </div>

                      <div>
                        <label className="mb-2 block text-sm font-bold text-gray-700">Mô tả</label>
                        <textarea
                          value={editForm.description}
                          onChange={(event) => actions.setEditFormField("description", event.target.value)}
                          rows={4}
                          className="w-full rounded-xl border-2 border-gray-300 px-4 py-3 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="border-t-2 border-gray-200 pt-6">
                    <div className="mb-4 flex items-center justify-between gap-3">
                      <h3 className="flex items-center gap-2 text-lg font-bold text-gray-900">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                          <ImageIcon className="h-4 w-4 text-primary" />
                        </div>
                        Hình Ảnh Sản Phẩm
                      </h3>

                      <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-400 px-5 py-3 font-medium text-gray-700 transition hover:bg-gray-50">
                        <Upload className="h-5 w-5" />
                        Tải lên hình ảnh
                        <input type="file" multiple accept="image/*" className="hidden" onChange={actions.uploadImages} />
                      </label>
                    </div>

                    {(productDetail?.images ?? []).length === 0 ? (
                      <div className="rounded-xl border-2 border-dashed border-gray-300 px-4 py-8 text-center text-sm text-gray-500">
                        Sản phẩm chưa có hình ảnh.
                      </div>
                    ) : (
                      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                        {(productDetail?.images ?? []).map((image) => (
                          <div key={image.imageId} className="rounded-2xl border-2 border-gray-200 bg-gray-50 p-4">
                            <img
                              src={image.imageUrl}
                              alt={`Product ${image.imageId}`}
                              className="h-52 w-full rounded-xl object-cover"
                            />
                            <div className="mt-3 flex items-center justify-between gap-3 text-sm text-gray-500">
                              <span>#{image.imageId} - order {image.displayOrder}</span>
                              <span className={image.isPrimary ? "font-bold text-primary" : ""}>
                                {image.isPrimary ? "Ảnh chinh" : "Ảnh phu"}
                              </span>
                            </div>
                            <div className="mt-4 flex flex-wrap gap-2">
                              <button
                                type="button"
                                onClick={() => actions.setPrimaryImage(image)}
                                className="rounded-xl border-2 border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-900 transition hover:bg-gray-50"
                              >
                                Đặt ảnh chính
                              </button>
                              <button
                                type="button"
                                onClick={() => actions.deleteImage(image)}
                                className="rounded-xl border-2 border-red-300 bg-white px-4 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-50"
                              >
                                Xóa ảnh
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="border-t-2 border-gray-200 pt-6">
                    <div className="mb-4 flex items-center justify-between gap-3">
                      <h3 className="flex items-center gap-2 text-lg font-bold text-gray-900">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                          <Palette className="h-4 w-4 text-primary" />
                        </div>
                        Variant Và Tồn Kho
                      </h3>

                      <button
                        type="button"
                        onClick={() =>
                          actions.openVariantMởdal({
                            productId: editForm.productId,
                            productName: editForm.productName,
                            basePrice: editForm.basePrice,
                          })
                        }
                        className="inline-flex items-center gap-2 rounded-xl border-2 border-primary bg-primary px-5 py-3 font-bold text-white transition hover:bg-primary/90"
                      >
                        <Plus className="h-4 w-4" />
                        Thêm variant
                      </button>
                    </div>

                    {editVariants.length === 0 ? (
                      <div className="rounded-xl border-2 border-dashed border-gray-300 px-4 py-8 text-center text-sm text-gray-500">
                        Sản phẩm chưa có variant.
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {editVariants.map((variant) => {
                          const isSaving = ui.savingVariantIds.includes(variant.variantId);
                          const isDeleting = ui.deletingVariantIds.includes(variant.variantId);

                          return (
                            <div key={variant.variantId} className="rounded-2xl border-2 border-gray-200 bg-gray-50 p-4">
                              <div className="mb-4 flex items-center justify-between gap-3">
                                <div>
                                  <p className="text-base font-bold text-gray-900">Variant #{variant.variantId}</p>
                                  <p className="text-sm text-gray-500">Cập nhật SKU, màu, kích thước và giá.</p>
                                </div>
                                <div className="flex items-center gap-2">
                                  <button
                                    type="button"
                                    onClick={() => actions.saveEditVariant(variant.variantId)}
                                    className="rounded-xl border-2 border-primary bg-primary px-4 py-2 text-sm font-bold text-white transition hover:bg-primary/90 disabled:opacity-60"
                                    disabled={isSaving || isDeleting}
                                  >
                                    {isSaving ? "Đang lưu..." : "Lưu variant"}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => actions.deleteEditVariant(variant.variantId)}
                                    className="rounded-xl border-2 border-red-300 bg-white px-4 py-2 text-sm font-bold text-red-700 transition hover:bg-red-50 disabled:opacity-60"
                                    disabled={isSaving || isDeleting}
                                  >
                                    {isDeleting ? "Đang xóa..." : "Xóa variant"}
                                  </button>
                                </div>
                              </div>

                              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                                <div>
                                  <label className="mb-2 block text-sm font-bold text-gray-700">SKU</label>
                                  <input
                                    type="text"
                                    value={variant.sku}
                                    onChange={(event) => actions.setEditVariantField(variant.variantId, "sku", event.target.value)}
                                    className="w-full rounded-xl border-2 border-gray-300 px-4 py-3 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                                  />
                                </div>

                                <div>
                                  <label className="mb-2 block text-sm font-bold text-gray-700">Màu sắc</label>
                                  <input
                                    type="text"
                                    value={variant.color}
                                    onChange={(event) => actions.setEditVariantField(variant.variantId, "color", event.target.value)}
                                    className="w-full rounded-xl border-2 border-gray-300 px-4 py-3 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                                  />
                                </div>

                                <div>
                                  <label className="mb-2 block text-sm font-bold text-gray-700">Kich thuoc</label>
                                  <input
                                    type="text"
                                    value={variant.size}
                                    onChange={(event) => actions.setEditVariantField(variant.variantId, "size", event.target.value)}
                                    className="w-full rounded-xl border-2 border-gray-300 px-4 py-3 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                                  />
                                </div>

                                <div>
                                  <label className="mb-2 block text-sm font-bold text-gray-700">Frame type</label>
                                  <input
                                    type="text"
                                    value={variant.frameType}
                                    onChange={(event) => actions.setEditVariantField(variant.variantId, "frameType", event.target.value)}
                                    className="w-full rounded-xl border-2 border-gray-300 px-4 py-3 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                                  />
                                </div>

                                <div>
                                  <label className="mb-2 block text-sm font-bold text-gray-700">Giá</label>
                                  <input
                                    type="number"
                                    min="0"
                                    value={variant.price}
                                    onChange={(event) => actions.setEditVariantField(variant.variantId, "price", event.target.value)}
                                    className="w-full rounded-xl border-2 border-gray-300 px-4 py-3 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                                  />
                                </div>

                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  <div className="mt-6 flex items-center gap-3 border-t-2 border-gray-200 pt-6">
                    <button
                      type="submit"
                      className="flex-1 rounded-xl border-2 border-primary bg-primary py-3 text-lg font-bold text-white transition hover:bg-primary/90 disabled:opacity-60"
                      disabled={ui.isUpdatingProduct}
                    >
                      {ui.isUpdatingProduct ? "Đang cập nhật..." : "Lưu thông tin sản phẩm"}
                    </button>
                    <button
                      type="button"
                      onClick={() => actions.closeEditMởdal()}
                      className="flex-1 rounded-xl border-2 border-gray-300 py-3 text-lg font-bold transition hover:bg-gray-50"
                      disabled={ui.isUpdatingProduct}
                    >
                      Đóng
                    </button>
                  </div>
                </>
              )}
            </form>
          </div>
        </div>
      ) : null}

      {isCreateMởdalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="max-h-[92vh] w-full max-w-6xl overflow-y-auto rounded-2xl border-2 border-gray-300 bg-white shadow-2xl">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b-2 border-gray-300 bg-white p-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Thêm Sản Phẩm Mới</h2>
                <p className="mt-1 text-sm text-gray-500">
                  Tạo thông tin sản phẩm cơ bản, chọn variant và tải ảnh sản phẩm.
                </p>  
              </div>
              <button
                type="button"
                onClick={closeCreateMởdal}
                className="rounded-lg border-2 border-transparent p-2 transition hover:border-gray-300 hover:bg-gray-100"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleCreateProduct} className="p-6">
              <div className="mb-6">
                <h3 className="mb-4 flex items-center gap-2 text-lg font-bold text-gray-900">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                    <ImageIcon className="h-4 w-4 text-primary" />
                  </div>
                  Thông Tin Cơ Bản
                </h3>

                <div className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-sm font-bold text-gray-700">Tên sản phẩm <span className="text-red-500">*</span></label>
                      <input
                        type="text"
                        value={form.productName}
                        onChange={(event) => actions.setFormField("productName", event.target.value)}
                        placeholder="VD: Gọng kính chữ nhật cổ điển"
                        className="w-full rounded-xl border-2 border-gray-300 px-4 py-3 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                        required
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-bold text-gray-700">SKU gốc <span className="text-red-500">*</span></label>
                      <input
                        type="text"
                        value={form.sku}
                        onChange={(event) => actions.setFormField("sku", event.target.value)}
                        placeholder="VD: GK-001"
                        className="w-full rounded-xl border-2 border-gray-300 px-4 py-3 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                        required
                      />
                      <p className="mt-1 text-xs text-gray-500">Mỗi variant được chọn sẽ tự sinh SKU mới từ SKU gốc này.</p>
                    </div>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-bold text-gray-700">Mô tả <span className="text-red-500">*</span></label>
                    <textarea
                      value={form.description}
                      onChange={(event) => actions.setFormField("description", event.target.value)}
                      placeholder="Mô tả chi tiết về sản phẩm..."
                      rows={4}
                      className="w-full rounded-xl border-2 border-gray-300 px-4 py-3 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                      required
                    />
                  </div>

                  <div className="grid gap-4 md:grid-cols-3">
                    <div>
                      <label className="mb-2 block text-sm font-bold text-gray-700">Danh mục <span className="text-red-500">*</span></label>
                      <select
                        value={form.categoryId}
                        onChange={(event) => actions.setFormField("categoryId", event.target.value)}
                        className="w-full rounded-xl border-2 border-gray-300 px-4 py-3 focus:border-primary focus:outline-none"
                        required
                      >
                        <option value="">Chọn danh mục</option>
                        {categories.map((category) => (
                          <option key={category.categoryId} value={category.categoryId}>
                            {category.categoryName}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-bold text-gray-700">Loại sản phẩm <span className="text-red-500">*</span></label>
                      <select
                        value={form.productType}
                        onChange={(event) => actions.setFormField("productType", event.target.value)}
                        className="w-full rounded-xl border-2 border-gray-300 px-4 py-3 focus:border-primary focus:outline-none"
                      >
                        {PRODUCT_TYPE_OPTIONS.map((type) => (
                          <option key={type.value} value={type.value}>
                            {type.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-bold text-gray-700">Giá (VND) <span className="text-red-500">*</span></label>
                      <input
                        type="number"
                        min="0"
                        value={form.basePrice}
                        onChange={(event) => actions.setFormField("basePrice", event.target.value)}
                        placeholder="1890000"
                        className="w-full rounded-xl border-2 border-gray-300 px-4 py-3 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                        required
                      />
                    </div>
                  </div>

                  <label className="flex items-center gap-3 rounded-xl border-2 border-gray-300 px-4 py-3 font-semibold text-gray-900">
                    <input
                      type="checkbox"
                      checked={form.prescriptionCompatible}
                      onChange={(event) => actions.setFormField("prescriptionCompatible", event.target.checked)}
                    />
                    Hỗ trợ kính thuốc
                  </label>
                </div>
              </div>

              <div className="border-t-2 border-gray-200 pt-6">
                <h3 className="mb-4 flex items-center gap-2 text-lg font-bold text-gray-900">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                    <Palette className="h-4 w-4 text-primary" />
                  </div>
                  Variant và Tồn Kho
                </h3>

                {draftVariants.length > 0 ? (
                  <div className="mb-4 space-y-2">
                    {draftVariants.map((draft, index) => (
                      <div
                        key={`${draft.sourceVariantId}-${index}`}
                        className="flex items-center gap-3 rounded-xl border-2 border-gray-200 bg-gray-50 p-3"
                      >
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg border-2 border-gray-300 bg-white">
                          <Layers3 className="h-5 w-5 text-primary" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-bold text-gray-900">
                            Variant #{draft.sourceVariantId} - {draft.sourceSku}
                          </p>
                          <p className="text-sm text-gray-600">
                            Nguồn: {draft.sourceProductName} | Màu: {draft.colorName || "-"} | Tồn kho: {draft.quantity}
                          </p>
                          {draft.size || draft.frameType ? (
                            <p className="text-xs text-gray-500">
                              {draft.size ? `Kích thước: ${draft.size}` : ""}{draft.size && draft.frameType ? " | " : ""}
                              {draft.frameType ? `Frame type: ${draft.frameType}` : ""}
                            </p>
                          ) : null}
                        </div>
                        <button
                          type="button"
                          onClick={() => actions.removeDraftVariant(index)}
                          className="rounded-lg border-2 border-transparent p-2 transition hover:border-red-300 hover:bg-white"
                        >
                          <X className="h-4 w-4 text-red-600" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : null}

                <div className="rounded-xl border-2 border-blue-200 bg-blue-50 p-4">
                  <div className="grid gap-3 lg:grid-cols-[1fr_auto] lg:items-center">
                    <div className="relative">
                      <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        value={variantSearchQuery}
                        onChange={(event) => setVariantSearchQuery(event.target.value)}
                        placeholder="Tìm theo mã variant, SKU, tên sản phẩm, màu..."
                        className="w-full rounded-xl border-2 border-gray-300 bg-white py-3 pl-11 pr-4 text-sm focus:border-primary focus:outline-none"
                      />
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setVariantStockFilter("all")}
                        className={`rounded-lg border px-3 py-2 text-xs font-bold transition ${
                          variantStockFilter === "all"
                            ? "border-primary bg-primary text-white"
                            : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                        }`}
                      >
                        Tất cả
                      </button>
                      <button
                        type="button"
                        onClick={() => setVariantStockFilter("inStock")}
                        className={`rounded-lg border px-3 py-2 text-xs font-bold transition ${
                          variantStockFilter === "inStock"
                            ? "border-emerald-600 bg-emerald-600 text-white"
                            : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                        }`}
                      >
                        Còn hàng
                      </button>
                      <button
                        type="button"
                        onClick={() => setVariantStockFilter("outStock")}
                        className={`rounded-lg border px-3 py-2 text-xs font-bold transition ${
                          variantStockFilter === "outStock"
                            ? "border-red-600 bg-red-600 text-white"
                            : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                        }`}
                      >
                        Hết hàng
                      </button>
                    </div>
                  </div>

                  <div className="mt-3 rounded-lg border border-blue-200 bg-white px-3 py-2 text-xs text-gray-600">
                    Hiển thị {filteredAvailableDbVariants.length}/{availableDbVariants.length} variant.
                  </div>

                  {selectedVariant ? (
                    <div className="mt-3 rounded-xl border-2 border-primary/25 bg-white p-3">
                      <p className="text-xs font-bold uppercase tracking-wide text-primary">Variant đang chọn</p>
                      <p className="mt-1 text-sm font-bold text-gray-900">
                        #{selectedVariant.variantId} - {selectedVariant.sourceSku}
                      </p>
                      <p className="mt-1 text-sm text-gray-600">
                        {selectedVariant.sourceProductName} | Màu: {selectedVariant.colorName || "-"} | Tồn: {selectedVariant.quantity}
                      </p>
                    </div>
                  ) : null}

                  <div className="mt-3 max-h-64 overflow-y-auto rounded-xl border-2 border-gray-200 bg-white">
                    {filteredAvailableDbVariants.length === 0 ? (
                      <div className="px-4 py-8 text-center text-sm text-gray-500">
                        Không tìm thấy variant phù hợp.
                      </div>
                    ) : (
                      <div className="divide-y divide-gray-100">
                        {filteredAvailableDbVariants.map((variant) => {
                          const isSelected = selectedVariantId === variant.variantId;
                          const isAdded = selectedDraftVariantIds.has(variant.variantId);

                          return (
                            <button
                              key={variant.variantId}
                              type="button"
                              onClick={() => actions.setCurrentVariantPickerField("selectedVariantId", String(variant.variantId))}
                              disabled={isAdded}
                              className={`w-full px-4 py-3 text-left transition ${
                                isAdded
                                  ? "cursor-not-allowed bg-gray-50 text-gray-400"
                                  : isSelected
                                    ? "bg-primary/10"
                                    : "hover:bg-orange-50"
                              }`}
                            >
                              <div className="flex items-center justify-between gap-3">
                                <p className="text-sm font-bold">
                                  #{variant.variantId} - {variant.sourceSku}
                                </p>
                                <div className="flex items-center gap-2">
                                  <span
                                    className={`rounded-full px-2 py-1 text-[11px] font-bold ${
                                      Number(variant.quantity ?? 0) > 0
                                        ? "bg-emerald-100 text-emerald-700"
                                        : "bg-red-100 text-red-700"
                                    }`}
                                  >
                                    Tồn: {variant.quantity}
                                  </span>
                                  {isAdded ? (
                                    <span className="rounded-full bg-gray-200 px-2 py-1 text-[11px] font-bold text-gray-600">
                                      Đã thêm
                                    </span>
                                  ) : null}
                                </div>
                              </div>
                              <p className="mt-1 text-sm text-gray-600">{variant.sourceProductName}</p>
                              <p className="mt-1 text-xs text-gray-500">
                                Màu: {variant.colorName || "-"} | Size: {variant.size || "-"} | Frame: {variant.frameType || "-"}
                              </p>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={actions.addDraftVariant}
                    disabled={!selectedVariant || selectedDraftVariantIds.has(selectedVariant.variantId)}
                    className="mt-4 w-full rounded-xl border-2 border-primary bg-primary px-4 py-3 text-base font-bold text-white transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {!selectedVariant
                      ? "Chọn variant để thêm"
                      : selectedDraftVariantIds.has(selectedVariant.variantId)
                        ? "Variant này đã được thêm"
                        : "+ Thêm variant này"}
                  </button>
                </div>
              </div>

              <div className="border-t-2 border-gray-200 pt-6">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <h3 className="flex items-center gap-2 text-lg font-bold text-gray-900">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                      <ImageIcon className="h-4 w-4 text-primary" />
                    </div>
                    Hình Ảnh Sản Phẩm
                  </h3>
                  <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-400 px-5 py-3 font-medium text-gray-700 transition hover:bg-white">
                    <Upload className="h-5 w-5" />
                    Tải lên hình ảnh
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={(event) => {
                        actions.attachCreateProductImages(event.target.files);
                        event.target.value = "";
                      }}
                    />
                  </label>
                </div>

                {createImageForm.imagePreviews.length > 0 ? (
                  <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                    {createImageForm.imagePreviews.map((preview, index) => (
                      <div key={`${preview}-${index}`} className="group relative">
                        <img
                          src={preview}
                          alt={`Preview ${index + 1}`}
                          className="h-24 w-full rounded-lg border-2 border-gray-300 object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => actions.removeCreateProductImage(index)}
                          className="absolute -right-2 -top-2 rounded-full bg-red-500 p-1 text-white opacity-0 transition group-hover:opacity-100"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-xl border-2 border-dashed border-gray-300 px-4 py-8 text-center text-sm text-gray-500">
                    Chưa có hình ảnh sản phẩm.
                  </div>
                )}
              </div>

              <div className="mt-6 flex items-center gap-3 border-t-2 border-gray-200 pt-6">
                <button
                  type="submit"
                  className="flex-1 rounded-xl border-2 border-primary bg-primary py-3 text-lg font-bold text-white transition hover:bg-primary/90 disabled:opacity-60"
                  disabled={ui.isCreatingProduct}
                >
                  {ui.isCreatingProduct ? "Đang tạo..." : "Thêm Sản Phẩm"}
                </button>
                <button
                  type="button"
                  onClick={closeCreateMởdal}
                  className="flex-1 rounded-xl border-2 border-gray-300 py-3 text-lg font-bold transition hover:bg-gray-50"
                  disabled={ui.isCreatingProduct}
                >
                  Hủy
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {ui.isDetailMởdalOpen && productDetail ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4">
          <div className="max-h-[90vh] w-full max-w-6xl overflow-auto rounded-[1.75rem] bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold text-slate-950">{productDetail.productName}</h2>
                <p className="mt-1 text-base text-slate-500">
                  {getProductTypeLabel(productDetail.productType)} - {formatCurrency(productDetail.basePrice)}
                </p>
                <p className="mt-2 text-base text-slate-600">{productDetail.description || "Không có mô tả."}</p>
                <p className="mt-2 text-sm font-medium text-slate-500">
                  Hỗ trợ kính thuốc: {productDetail.prescriptionCompatible ? "Có" : "Không"}
                </p>
              </div>
              <button
                type="button"
                onClick={actions.clearDetail}
                className="rounded-xl border-2 border-gray-300 bg-white px-5 py-3 font-semibold text-gray-900 transition hover:bg-gray-50"
              >
                Đóng
              </button>
            </div>

            {ui.detailLoading ? <p className="mt-4 text-sm text-slate-500">Đang tải chi tiết...</p> : null}

            <div className="mt-6 grid gap-6 xl:grid-cols-2">
              <section className="rounded-2xl border border-slate-200 p-5">
                <div className="mb-5 flex items-center justify-between gap-3">
                  <h3 className="text-xl font-bold text-gray-900">Ảnh sản phẩm</h3>
                  <label className="rounded-xl border-2 border-slate-900 bg-slate-900 px-4 py-3 font-bold text-white transition hover:bg-slate-800">
                    Upload ảnh
                    <input type="file" multiple accept="image/*" className="hidden" onChange={actions.uploadImages} />
                  </label>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  {(productDetail.images ?? []).length === 0 ? (
                    <p className="text-sm text-slate-500">Chưa có ảnh.</p>
                  ) : (
                    (productDetail.images ?? []).map((image) => (
                      <div key={image.imageId} className="rounded-2xl border border-slate-200 p-4">
                        <img
                          src={image.imageUrl}
                          alt={`Product ${image.imageId}`}
                          className="h-44 w-full rounded-xl object-cover"
                        />
                        <div className="mt-3 flex items-center justify-between gap-2 text-sm text-slate-500">
                          <span>#{image.imageId} - order {image.displayOrder}</span>
                          <span>{image.isPrimary ? "Primary" : "Secondary"}</span>
                        </div>
                        <div className="mt-4 flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => actions.setPrimaryImage(image)}
                            className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-900 shadow-sm transition hover:bg-slate-50"
                          >
                            Đặt ảnh chính
                          </button>
                          <button
                            type="button"
                            onClick={() => actions.deleteImage(image)}
                            className="rounded-xl border border-red-300 bg-white px-4 py-2 text-sm font-semibold text-red-700 shadow-sm transition hover:bg-red-50"
                          >
                            Xóa ảnh
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </section>

              <section className="rounded-2xl border border-slate-200 p-5">
                <h3 className="mb-4 text-xl font-bold text-gray-900">Variants</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-slate-200">
                    <thead>
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-bold uppercase tracking-[0.02em] text-slate-700">Variant ID</th>
                        <th className="px-4 py-3 text-left text-sm font-bold uppercase tracking-[0.02em] text-slate-700">SKU</th>
                        <th className="px-4 py-3 text-left text-sm font-bold uppercase tracking-[0.02em] text-slate-700">Giá</th>
                        <th className="px-4 py-3 text-left text-sm font-bold uppercase tracking-[0.02em] text-slate-700">Color</th>
                        <th className="px-4 py-3 text-left text-sm font-bold uppercase tracking-[0.02em] text-slate-700">Size</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {(productDetail.variants ?? []).length === 0 ? (
                        <tr>
                          <td colSpan={5} className="px-4 py-8 text-center text-base text-slate-500">
                            Chưa có variant.
                          </td>
                        </tr>
                      ) : (
                        (productDetail.variants ?? []).map((variant) => (
                          <tr key={variant.variantId}>
                            <td className="px-4 py-4 text-base text-slate-700">{variant.variantId}</td>
                            <td className="px-4 py-4 text-base font-semibold text-slate-950">{variant.sku || "-"}</td>
                            <td className="px-4 py-4 text-base text-slate-700">{formatCurrency(variant.price)}</td>
                            <td className="px-4 py-4 text-base text-slate-700">{variant.color || "-"}</td>
                            <td className="px-4 py-4 text-base text-slate-700">{variant.size || "-"}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </section>
            </div>
          </div>
        </div>
      ) : null}

      {ui.isVariantMởdalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4">
          <form onSubmit={actions.submitVariant} className="w-full max-w-3xl rounded-[1.75rem] bg-white p-6 shadow-2xl">
            <h2 className="text-2xl font-bold text-slate-950">Tạo variant</h2>
            <p className="mt-1 text-base text-slate-500">Sản phẩm: {variantForm.productName}</p>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <input
                name="sku"
                value={variantForm.sku}
                onChange={(event) => actions.setVariantField("sku", event.target.value)}
                placeholder="SKU"
                className="rounded-xl border-2 border-gray-300 px-4 py-3 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                required
              />
              <input
                type="number"
                min="0"
                name="price"
                value={variantForm.price}
                onChange={(event) => actions.setVariantField("price", event.target.value)}
                placeholder="Giá"
                className="rounded-xl border-2 border-gray-300 px-4 py-3 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                required
              />
              <input
                type="number"
                min="0"
                name="quantity"
                value={variantForm.quantity}
                onChange={(event) => actions.setVariantField("quantity", event.target.value)}
                placeholder="Số lượng tồn kho ban đầu"
                className="rounded-xl border-2 border-gray-300 px-4 py-3 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                required
              />
              <input
                name="color"
                value={variantForm.color}
                onChange={(event) => actions.setVariantField("color", event.target.value)}
                placeholder="Màu sắc"
                className="rounded-xl border-2 border-gray-300 px-4 py-3 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
              <input
                name="size"
                value={variantForm.size}
                onChange={(event) => actions.setVariantField("size", event.target.value)}
                placeholder="Kích thước"
                className="rounded-xl border-2 border-gray-300 px-4 py-3 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
              <input
                name="frameType"
                value={variantForm.frameType}
                onChange={(event) => actions.setVariantField("frameType", event.target.value)}
                placeholder="Frame type"
                className="rounded-xl border-2 border-gray-300 px-4 py-3 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={actions.closeVariantMởdal}
                className="rounded-xl border-2 border-gray-300 bg-white px-5 py-3 font-semibold text-gray-900 transition hover:bg-gray-50"
                disabled={ui.isCreatingVariant}
              >
                Hủy
              </button>
              <button
                type="submit"
                className="rounded-xl border-2 border-slate-900 bg-slate-900 px-5 py-3 font-bold text-white transition hover:bg-slate-800 disabled:opacity-60"
                disabled={ui.isCreatingVariant}
              >
                {ui.isCreatingVariant ? "Đang tạo..." : "Tạo variant"}
              </button>
            </div>
          </form>
        </div>
      ) : null}

      {popupElement}
    </div>
  );
}
