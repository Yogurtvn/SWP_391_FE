import { Link } from "react-router";
import { AlertCircle } from "lucide-react";
import FilterSidebar from "@/components/product/FilterSidebar";
import ProductCard from "@/components/product/ProductCard";
import { useProductListingPage } from "@/hooks/shop/useProductListingPage";

function ProductListingPage() {
  const {
    title,
    routeNotice,
    activePromotion,
    products,
    displayPriceOverrides,
    categories,
    filterOptions,
    filters,
    sortOptions,
    pageInfo,
    ui,
    actions,
  } =
    useProductListingPage();
  const normalizedProducts = products.map((product) => normalizeListingProduct(product, displayPriceOverrides));

  return (
    <div className="bg-white">
      <div className="mx-auto max-w-[1400px] px-6 py-8">
        <div className="flex gap-12">
          <FilterSidebar
            filters={filters}
            categories={categories}
            categoriesLoading={ui.categoriesLoading}
            filterOptions={filterOptions}
            filterOptionsLoading={ui.filterOptionsLoading}
            filterOptionsError={ui.filterOptionsError}
            prescriptionFilterLocked={ui.prescriptionFilterLocked}
            onCategoryChange={actions.setCategoryId}
            onColorChange={actions.setColor}
            onSizeChange={actions.setSize}
            onFrameTypeChange={actions.setFrameType}
            onMinPriceChange={actions.setMinPrice}
            onMaxPriceChange={actions.setMaxPrice}
            onPrescriptionChange={actions.setPrescriptionOnly}
            onResetFilters={actions.resetFilters}
          />

          <div className="flex-1">
            <div className="mb-6 flex items-center justify-between gap-4">
              <div>
                <h1 className="mb-1 text-2xl" style={{ fontWeight: 700 }}>
                  {title}
                </h1>
                <p className="text-sm text-muted-foreground">
                  Hiển thị {products.length} / {pageInfo.totalItems} sản phẩm
                </p>
              </div>

              <label className="flex items-center gap-3 text-sm text-foreground">
                <span>Sắp xếp</span>
                <select
                  value={filters.sort}
                  onChange={(event) => actions.setSort(event.target.value)}
                  className="rounded-lg border border-border bg-white px-3 py-2 text-sm focus:border-primary focus:outline-none"
                >
                  {sortOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            {routeNotice ? (
              <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                {routeNotice}
              </div>
            ) : null}

            {filters.search ? (
              <div className="mb-6 rounded-lg border border-border bg-secondary px-4 py-3 text-sm text-foreground">
                Kết quả tìm kiếm cho: <span style={{ fontWeight: 600 }}>{filters.search}</span>
              </div>
            ) : null}

            {activePromotion ? (
              <div className="mb-8 flex items-center justify-between rounded-sm bg-[#F5F1E8] p-8">
                <div className="flex-1">
                  <h2 className="mb-2 text-2xl" style={{ fontWeight: 700 }}>
                    {activePromotion.name || "Ưu đãi đang áp dụng"}
                  </h2>

                  <h3 className="mb-3 text-xl" style={{ fontWeight: 600 }}>
                    Giảm giá thực tế: {formatDiscountPercent(activePromotion.discountPercent)}
                  </h3>

                  {activePromotion.description ? (
                    <p className="mb-3 text-sm text-muted-foreground">{activePromotion.description}</p>
                  ) : null}

                  <p className="mb-4 text-xs text-muted-foreground">
                    Hiệu lực: {formatDateTime(activePromotion.startAt)} - {formatDateTime(activePromotion.endAt)}
                  </p>

                  <Link to="/shop" className="inline-block text-sm text-primary hover:underline" style={{ fontWeight: 600 }}>
                    Mua ngay →
                  </Link>
                </div>

                <div className="flex h-48 w-48 items-center justify-center overflow-hidden rounded-full">
                  <img
                    src="https://images.unsplash.com/photo-1764740113465-dc9e6b28cc9e?crop=center&fit=crop&w=300&h=300"
                    alt="Khuyến mãi"
                    className="h-full w-full object-cover"
                  />
                </div>
              </div>
            ) : null}

            {ui.isError ? (
              <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-red-800">
                <div className="flex items-start gap-3">
                  <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
                  <div>
                    <p className="mb-2" style={{ fontWeight: 600 }}>
                      Không thể tải danh sách sản phẩm
                    </p>
                    <p className="mb-4 text-sm">{ui.error}</p>
                    <button
                      type="button"
                      onClick={actions.retry}
                      className="rounded-lg bg-red-600 px-4 py-2 text-sm text-white transition-colors hover:bg-red-700"
                    >
                      Tải lại
                    </button>
                  </div>
                </div>
              </div>
            ) : null}

            {ui.isLoading ? (
              <div className="grid grid-cols-3 gap-x-6 gap-y-10">
                {Array.from({ length: 6 }).map((_, index) => (
                  <div key={index} className="animate-pulse">
                    <div className="mb-3 aspect-[4/3] rounded-lg bg-secondary" />
                    <div className="mb-2 h-4 rounded bg-secondary" />
                    <div className="mb-2 h-4 w-2/3 rounded bg-secondary" />
                    <div className="h-3 w-1/2 rounded bg-secondary" />
                  </div>
                ))}
              </div>
            ) : null}

            {!ui.isLoading && !ui.isError && ui.isEmpty ? (
              <div className="rounded-xl border border-border bg-secondary/40 p-10 text-center">
                <h3 className="mb-2">Không tìm thấy sản phẩm phù hợp</h3>
                <p className="mb-4 text-sm text-muted-foreground">Hãy thử đổi bộ lọc hoặc xóa tìm kiếm hiện tại.</p>
                <button
                  type="button"
                  onClick={actions.resetFilters}
                  className="rounded-lg bg-primary px-4 py-2 text-sm text-white transition-colors hover:bg-primary/90"
                >
                  Xóa bộ lọc
                </button>
              </div>
            ) : null}

            {!ui.isLoading && !ui.isError && !ui.isEmpty ? (
              <>
                <div className="grid grid-cols-3 gap-x-6 gap-y-10">
                  {normalizedProducts.map((product) => (
                    <ProductCard key={product.id} {...product} />
                  ))}
                </div>

                {pageInfo.totalPages > 1 ? (
                  <div className="mt-12 flex items-center justify-center gap-3">
                    <button
                      type="button"
                      onClick={() => actions.goToPage(pageInfo.page - 1)}
                      disabled={!pageInfo.hasPreviousPage}
                      className="rounded-full border border-border px-4 py-2 text-sm transition-colors hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Trang trước
                    </button>
                    <span className="text-sm text-muted-foreground">
                      Trang {pageInfo.page} / {pageInfo.totalPages}
                    </span>
                    <button
                      type="button"
                      onClick={() => actions.goToPage(pageInfo.page + 1)}
                      disabled={!pageInfo.hasNextPage}
                      className="rounded-full border border-border px-4 py-2 text-sm transition-colors hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Trang sau
                    </button>
                  </div>
                ) : null}
              </>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

function formatDiscountPercent(value) {
  const discountPercent = Number(value ?? 0);
  const formattedValue = Number.isFinite(discountPercent)
    ? Number.isInteger(discountPercent)
      ? String(discountPercent)
      : discountPercent.toFixed(2).replace(/\.?0+$/, "")
    : "0";

  return `${formattedValue}%`;
}

function formatDateTime(value) {
  if (!value) {
    return "N/A";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "N/A";
  }

  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
}

export { ProductListingPage as default };

function normalizeListingProduct(product, displayPriceOverrides = {}) {
  const productId = Number(product?.productId ?? product?.id);
  const syncedBasePrice = displayPriceOverrides?.[productId];
  const basePrice = Number.isFinite(Number(syncedBasePrice))
    ? Number(syncedBasePrice)
    : resolveBasePrice(product);

  return {
    ...product,
    displayPrice: basePrice,
    price: basePrice,
    basePrice,
    product: product?.product
      ? {
          ...product.product,
          displayPrice: basePrice,
          price: basePrice,
          basePrice,
        }
      : product?.product,
  };
}

function resolveBasePrice(product) {
  const candidates = [
    product?.basePrice,
    product?.product?.basePrice,
    product?.price,
    product?.product?.price,
  ];

  for (const candidate of candidates) {
    const normalizedPrice = Number(candidate);
    if (Number.isFinite(normalizedPrice) && normalizedPrice >= 0) {
      return normalizedPrice;
    }
  }

  return 0;
}
