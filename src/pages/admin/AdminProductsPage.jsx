import { useMemo, useState } from "react";
import {
  Box,
  ChevronDown,
  Eye,
  Filter,
  Layers3,
  Plus,
  Power,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { useAdminProductsPage } from "@/hooks/admin/useAdminProductsPage";

function formatCurrency(value) {
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(Number(value || 0));
}

function normalizeValue(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[\s_-]+/g, "");
}

function resolveCategoryName(product, categories) {
  if (product?.categoryName) {
    return product.categoryName;
  }

  const matchedCategory = categories.find(
    (category) => String(category.categoryId) === String(product?.categoryId ?? product?.category?.categoryId),
  );

  return matchedCategory?.categoryName || "Chua ro danh muc";
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

export default function AdminProductsPage() {
  const {
    products,
    categories,
    productDetail,
    form,
    newCategoryName,
    variantForm,
    ui,
    actions,
    popupElement,
  } = useAdminProductsPage();

  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [availabilityFilter, setAvailabilityFilter] = useState("all");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const query = searchQuery.trim().toLowerCase();
      const categoryName = resolveCategoryName(product, categories).toLowerCase();
      const matchesSearch =
        !query ||
        String(product.productName || "").toLowerCase().includes(query) ||
        String(product.productType || "").toLowerCase().includes(query) ||
        categoryName.includes(query);

      const matchesCategory =
        categoryFilter === "all" ||
        String(product.categoryId ?? product.category?.categoryId ?? "") === categoryFilter;

      const matchesType = typeFilter === "all" || normalizeValue(product.productType) === normalizeValue(typeFilter);

      const matchesAvailability =
        availabilityFilter === "all" ||
        (availabilityFilter === "available" && product.isAvailable) ||
        (availabilityFilter === "inactive" && !product.isAvailable);

      return matchesSearch && matchesCategory && matchesType && matchesAvailability;
    });
  }, [availabilityFilter, categories, categoryFilter, products, searchQuery, typeFilter]);

  async function handleCreateProduct(event) {
    await actions.createProduct(event);
  }

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-6 md:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="rounded-2xl border-2 border-gray-300 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <h1 className="mb-2 text-3xl font-bold text-gray-900">Quan Ly San Pham</h1>
              <p className="text-gray-600">
                Tong so: <span className="font-bold text-primary">{filteredProducts.length}</span> san pham
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={actions.retry}
                className="inline-flex items-center justify-center rounded-xl border-2 border-gray-300 bg-white px-4 py-3 font-semibold text-gray-900 transition hover:bg-gray-50"
              >
                Tai lai
              </button>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(true)}
                className="inline-flex items-center gap-2 rounded-xl border-2 border-primary bg-primary px-6 py-3 font-bold text-white shadow-lg shadow-primary/20 transition hover:bg-primary/90"
              >
                <Plus className="h-5 w-5" />
                Them San Pham
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
              placeholder="Tim kiem theo ten, loai, danh muc..."
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
              Bo Loc
              <ChevronDown className={`h-4 w-4 transition-transform ${showFilters ? "rotate-180" : ""}`} />
            </button>

            {(categoryFilter !== "all" || typeFilter !== "all" || availabilityFilter !== "all") && (
              <button
                type="button"
                onClick={() => {
                  setCategoryFilter("all");
                  setTypeFilter("all");
                  setAvailabilityFilter("all");
                }}
                className="text-sm font-medium text-primary hover:underline"
              >
                Xoa bo loc
              </button>
            )}
          </div>

          {showFilters ? (
            <div className="mt-4 grid gap-4 border-t-2 border-gray-200 pt-4 md:grid-cols-3">
              <div>
                <label className="mb-2 block text-sm font-bold text-gray-700">Danh muc</label>
                <select
                  value={categoryFilter}
                  onChange={(event) => setCategoryFilter(event.target.value)}
                  className="w-full rounded-lg border-2 border-gray-300 px-3 py-2 focus:border-primary focus:outline-none"
                >
                  <option value="all">Tat ca</option>
                  {categories.map((category) => (
                    <option key={category.categoryId} value={String(category.categoryId)}>
                      {category.categoryName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold text-gray-700">Loai san pham</label>
                <select
                  value={typeFilter}
                  onChange={(event) => setTypeFilter(event.target.value)}
                  className="w-full rounded-lg border-2 border-gray-300 px-3 py-2 focus:border-primary focus:outline-none"
                >
                  <option value="all">Tat ca</option>
                  <option value="Frame">Frame</option>
                  <option value="Sunglasses">Sunglasses</option>
                  <option value="Lens">Lens</option>
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold text-gray-700">Kha dung</label>
                <select
                  value={availabilityFilter}
                  onChange={(event) => setAvailabilityFilter(event.target.value)}
                  className="w-full rounded-lg border-2 border-gray-300 px-3 py-2 focus:border-primary focus:outline-none"
                >
                  <option value="all">Tat ca</option>
                  <option value="available">Dang ban</option>
                  <option value="inactive">Ngung ban</option>
                </select>
              </div>
            </div>
          ) : null}
        </div>

        <div className="overflow-hidden rounded-2xl border-2 border-gray-300 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px]">
              <thead className="border-b-2 border-gray-300 bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-bold text-gray-900">San pham</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-gray-900">Loai</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-gray-900">Danh muc</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-gray-900">Gia</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-gray-900">Kha dung</th>
                  <th className="px-6 py-4 text-right text-sm font-bold text-gray-900">Thao tac</th>
                </tr>
              </thead>
              <tbody className="divide-y-2 divide-gray-200">
                {ui.isLoading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                      Dang tai san pham...
                    </td>
                  </tr>
                ) : null}

                {!ui.isLoading && filteredProducts.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                      Khong tim thay san pham nao
                    </td>
                  </tr>
                ) : null}

                {filteredProducts.map((product) => {
                  const imageUrl = getProductImage(product);
                  const categoryName = resolveCategoryName(product, categories);

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
                            <p className="mt-1 text-sm text-gray-500">ID: {product.productId}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <span className={`rounded-full border-2 px-3 py-1 text-xs font-bold ${getProductBadgeColor(product.productType)}`}>
                          {product.productType}
                        </span>
                      </td>
                      <td className="px-6 py-5 text-sm font-medium text-gray-700">{categoryName}</td>
                      <td className="px-6 py-5 text-base font-bold text-primary">{formatCurrency(product.basePrice)}</td>
                      <td className="px-6 py-5">
                        <span
                          className={`rounded-full border-2 px-3 py-1 text-xs font-bold ${
                            product.isAvailable
                              ? "border-green-300 bg-green-100 text-green-800"
                              : "border-gray-300 bg-gray-100 text-gray-700"
                          }`}
                        >
                          {product.isAvailable ? "Dang ban" : "Ngung ban"}
                        </span>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => actions.viewDetail(product)}
                            className="rounded-lg border-2 border-transparent p-2 text-primary transition hover:border-primary hover:bg-orange-50"
                            title="Chi tiet"
                          >
                            <Eye className="h-5 w-5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => actions.openVariantModal(product)}
                            className="rounded-lg border-2 border-transparent p-2 text-primary transition hover:border-primary hover:bg-orange-50"
                            title="Tao variant"
                          >
                            <Layers3 className="h-5 w-5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => actions.toggleProductStatus(product)}
                            className={`rounded-lg border-2 border-transparent p-2 transition hover:bg-gray-100 ${
                              product.isAvailable ? "text-amber-600 hover:border-amber-400" : "text-green-600 hover:border-green-400"
                            }`}
                            title={product.isAvailable ? "Ngung ban" : "Nhap kho"}
                          >
                            <Power className="h-5 w-5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => actions.deleteProduct(product)}
                            className="rounded-lg border-2 border-transparent p-2 text-red-500 transition hover:border-red-400 hover:bg-red-50"
                            title="Xoa"
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
        </div>
      </div>

      {isCreateModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="max-h-[92vh] w-full max-w-5xl overflow-y-auto rounded-2xl border-2 border-gray-300 bg-white shadow-2xl">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b-2 border-gray-300 bg-white p-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Them San Pham Moi</h2>
                <p className="mt-1 text-sm text-gray-500">Gom tao danh muc va tao san pham trong cung mot modal.</p>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="rounded-lg border-2 border-transparent p-2 transition hover:border-gray-300 hover:bg-gray-100"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="space-y-6 p-6">
              <section className="rounded-2xl border-2 border-gray-200 p-5">
                <h3 className="mb-4 text-xl font-bold text-gray-900">Tao danh muc moi</h3>
                <form onSubmit={actions.createCategory} className="flex flex-col gap-4 xl:flex-row">
                  <input
                    type="text"
                    value={newCategoryName}
                    onChange={(event) => actions.setNewCategoryName(event.target.value)}
                    placeholder="Ten danh muc"
                    className="flex-1 rounded-xl border-2 border-gray-300 px-4 py-3 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    required
                  />
                  <button
                    type="submit"
                    className="rounded-xl border-2 border-slate-900 bg-slate-900 px-5 py-3 font-bold text-white transition hover:bg-slate-800"
                  >
                    Tao danh muc
                  </button>
                </form>
              </section>

              <section className="rounded-2xl border-2 border-gray-200 p-5">
                <h3 className="mb-4 text-xl font-bold text-gray-900">Tao san pham moi</h3>
                <form onSubmit={handleCreateProduct} className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    <input
                      type="text"
                      value={form.productName}
                      onChange={(event) => actions.setFormField("productName", event.target.value)}
                      placeholder="Ten san pham"
                      className="rounded-xl border-2 border-gray-300 px-4 py-3 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                      required
                    />

                    <select
                      value={form.categoryId}
                      onChange={(event) => actions.setFormField("categoryId", event.target.value)}
                      className="rounded-xl border-2 border-gray-300 px-4 py-3 focus:border-primary focus:outline-none"
                      required
                    >
                      <option value="">Chon danh muc</option>
                      {categories.map((category) => (
                        <option key={category.categoryId} value={category.categoryId}>
                          {category.categoryName}
                        </option>
                      ))}
                    </select>

                    <select
                      value={form.productType}
                      onChange={(event) => actions.setFormField("productType", event.target.value)}
                      className="rounded-xl border-2 border-gray-300 px-4 py-3 focus:border-primary focus:outline-none"
                    >
                      <option value="Frame">Frame</option>
                      <option value="Sunglasses">Sunglasses</option>
                      <option value="Lens">Lens</option>
                    </select>

                    <input
                      type="number"
                      min="0"
                      value={form.basePrice}
                      onChange={(event) => actions.setFormField("basePrice", event.target.value)}
                      placeholder="Gia co ban"
                      className="rounded-xl border-2 border-gray-300 px-4 py-3 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                      required
                    />

                    <label className="flex items-center gap-3 rounded-xl border-2 border-gray-300 px-4 py-3 font-semibold text-gray-900">
                      <input
                        type="checkbox"
                        checked={form.prescriptionCompatible}
                        onChange={(event) => actions.setFormField("prescriptionCompatible", event.target.checked)}
                      />
                      Ho tro kinh thuoc
                    </label>

                    <input
                      type="text"
                      value={form.description}
                      onChange={(event) => actions.setFormField("description", event.target.value)}
                      placeholder="Mo ta"
                      className="rounded-xl border-2 border-gray-300 px-4 py-3 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="submit"
                      className="rounded-xl border-2 border-slate-900 bg-slate-900 px-6 py-3 font-bold text-white transition hover:bg-slate-800"
                    >
                      Tao san pham
                    </button>
                  </div>
                </form>
              </section>
            </div>
          </div>
        </div>
      ) : null}

      {productDetail ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4">
          <div className="max-h-[90vh] w-full max-w-6xl overflow-auto rounded-[1.75rem] bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold text-slate-950">{productDetail.productName}</h2>
                <p className="mt-1 text-base text-slate-500">
                  {productDetail.productType} - {formatCurrency(productDetail.basePrice)}
                </p>
                <p className="mt-2 text-base text-slate-600">{productDetail.description || "Khong co mo ta."}</p>
                <p className="mt-2 text-sm font-medium text-slate-500">
                  Prescription compatible: {productDetail.prescriptionCompatible ? "Yes" : "No"}
                </p>
              </div>
              <button
                type="button"
                onClick={actions.clearDetail}
                className="rounded-xl border-2 border-gray-300 bg-white px-5 py-3 font-semibold text-gray-900 transition hover:bg-gray-50"
              >
                Dong
              </button>
            </div>

            {ui.detailLoading ? <p className="mt-4 text-sm text-slate-500">Dang tai chi tiet...</p> : null}

            <div className="mt-6 grid gap-6 xl:grid-cols-2">
              <section className="rounded-2xl border border-slate-200 p-5">
                <div className="mb-5 flex items-center justify-between gap-3">
                  <h3 className="text-xl font-bold text-gray-900">Anh san pham</h3>
                  <label className="rounded-xl border-2 border-slate-900 bg-slate-900 px-4 py-3 font-bold text-white transition hover:bg-slate-800">
                    Upload anh
                    <input type="file" multiple accept="image/*" className="hidden" onChange={actions.uploadImages} />
                  </label>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  {(productDetail.images ?? []).length === 0 ? (
                    <p className="text-sm text-slate-500">Chua co anh.</p>
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
                            Dat anh chinh
                          </button>
                          <button
                            type="button"
                            onClick={() => actions.deleteImage(image)}
                            className="rounded-xl border border-red-300 bg-white px-4 py-2 text-sm font-semibold text-red-700 shadow-sm transition hover:bg-red-50"
                          >
                            Xoa anh
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
                        <th className="px-4 py-3 text-left text-sm font-bold uppercase tracking-[0.02em] text-slate-700">Gia</th>
                        <th className="px-4 py-3 text-left text-sm font-bold uppercase tracking-[0.02em] text-slate-700">Color</th>
                        <th className="px-4 py-3 text-left text-sm font-bold uppercase tracking-[0.02em] text-slate-700">Size</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {(productDetail.variants ?? []).length === 0 ? (
                        <tr>
                          <td colSpan={5} className="px-4 py-8 text-center text-base text-slate-500">
                            Chua co variant.
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

      {ui.isVariantModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4">
          <form onSubmit={actions.submitVariant} className="w-full max-w-3xl rounded-[1.75rem] bg-white p-6 shadow-2xl">
            <h2 className="text-2xl font-bold text-slate-950">Tao variant</h2>
            <p className="mt-1 text-base text-slate-500">San pham: {variantForm.productName}</p>

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
                placeholder="Gia"
                className="rounded-xl border-2 border-gray-300 px-4 py-3 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                required
              />
              <input
                type="number"
                min="0"
                name="quantity"
                value={variantForm.quantity}
                onChange={(event) => actions.setVariantField("quantity", event.target.value)}
                placeholder="So luong ton kho ban dau"
                className="rounded-xl border-2 border-gray-300 px-4 py-3 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                required
              />
              <input
                name="color"
                value={variantForm.color}
                onChange={(event) => actions.setVariantField("color", event.target.value)}
                placeholder="Mau sac"
                className="rounded-xl border-2 border-gray-300 px-4 py-3 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
              <input
                name="size"
                value={variantForm.size}
                onChange={(event) => actions.setVariantField("size", event.target.value)}
                placeholder="Kich thuoc"
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
                onClick={actions.closeVariantModal}
                className="rounded-xl border-2 border-gray-300 bg-white px-5 py-3 font-semibold text-gray-900 transition hover:bg-gray-50"
                disabled={ui.isCreatingVariant}
              >
                Huy
              </button>
              <button
                type="submit"
                className="rounded-xl border-2 border-slate-900 bg-slate-900 px-5 py-3 font-bold text-white transition hover:bg-slate-800 disabled:opacity-60"
                disabled={ui.isCreatingVariant}
              >
                {ui.isCreatingVariant ? "Dang tao..." : "Tao variant"}
              </button>
            </div>
          </form>
        </div>
      ) : null}
      {popupElement}
    </div>
  );
}
