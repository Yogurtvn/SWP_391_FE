import { Link } from "react-router";
import { AlertCircle } from "lucide-react";
import FilterSidebar from "@/components/product/FilterSidebar";
import ProductCard from "@/components/product/ProductCard";
import { useProductListingPage } from "@/hooks/shop/useProductListingPage";

function ProductListingPage() {
  const { title, routeNotice, products, categories, filters, sortOptions, pageInfo, ui, actions } = useProductListingPage();

  return <div className="bg-white">
      <div className="max-w-[1400px] mx-auto px-6 py-8">
        <div className="flex gap-12">
          <FilterSidebar
            filters={filters}
            categories={categories}
            categoriesLoading={ui.categoriesLoading}
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
            <div className="flex items-center justify-between gap-4 mb-6">
              <div>
                <h1 className="text-2xl mb-1" style={{ fontWeight: 700 }}>{title}</h1>
                <p className="text-sm text-muted-foreground">
                  Hiển thị {products.length} / {pageInfo.totalItems} sản phẩm
                </p>
              </div>
              <label className="flex items-center gap-3 text-sm text-foreground">
                <span>Sắp xếp</span>
                <select
                  value={filters.sort}
                  onChange={(event) => actions.setSort(event.target.value)}
                  className="rounded-lg border border-border bg-white px-3 py-2 text-sm focus:outline-none focus:border-primary"
                >
                  {sortOptions.map((option) => <option key={option.value} value={option.value}>
                      {option.label}
                    </option>)}
                </select>
              </label>
            </div>

            {routeNotice && <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                {routeNotice}
              </div>}

            {filters.search && <div className="mb-6 rounded-lg border border-border bg-secondary px-4 py-3 text-sm text-foreground">
                Kết quả tìm kiếm cho: <span style={{ fontWeight: 600 }}>{filters.search}</span>
              </div>}

            <div className="bg-[#F5F1E8] rounded-sm p-8 mb-8 flex items-center justify-between">
              <div className="flex-1">
                <h2 className="text-2xl mb-2" style={{ fontWeight: 700 }}>
                  Mua 1 Tặng 1 Miễn Phí
                </h2>
                <h3 className="text-xl mb-4" style={{ fontWeight: 600 }}>
                  + GIẢM THÊM 20%
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Nhập mã: <span className="text-foreground" style={{ fontWeight: 600 }}>BOGO20</span>
                </p>
                <Link
                  to="/shop"
                  className="inline-block text-sm text-primary hover:underline"
                  style={{ fontWeight: 600 }}
                >
                  Mua ngay →
                </Link>
              </div>
              <div className="w-48 h-48 rounded-full overflow-hidden flex items-center justify-center">
                <img
                  src="https://images.unsplash.com/photo-1764740113465-dc9e6b28cc9e?crop=center&fit=crop&w=300&h=300"
                  alt="Promotion"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            {ui.isError && <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-red-800">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 mt-0.5 shrink-0" />
                  <div>
                    <p className="mb-2" style={{ fontWeight: 600 }}>Không thể tải danh sách sản phẩm</p>
                    <p className="text-sm mb-4">{ui.error}</p>
                    <button
                      type="button"
                      onClick={actions.retry}
                      className="rounded-lg bg-red-600 px-4 py-2 text-sm text-white hover:bg-red-700 transition-colors"
                    >
                      Tải lại
                    </button>
                  </div>
                </div>
              </div>}

            {ui.isLoading && <div className="grid grid-cols-3 gap-x-6 gap-y-10">
                {Array.from({ length: 6 }).map((_, index) => <div key={index} className="animate-pulse">
                    <div className="aspect-[4/3] rounded-lg bg-secondary mb-3" />
                    <div className="h-4 rounded bg-secondary mb-2" />
                    <div className="h-4 w-2/3 rounded bg-secondary mb-2" />
                    <div className="h-3 w-1/2 rounded bg-secondary" />
                  </div>)}
              </div>}

            {!ui.isLoading && !ui.isError && ui.isEmpty && <div className="rounded-xl border border-border bg-secondary/40 p-10 text-center">
                <h3 className="mb-2">Không tìm thấy sản phẩm phù hợp</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Hãy thử đổi bộ lọc hoặc xóa tìm kiếm hiện tại.
                </p>
                <button
                  type="button"
                  onClick={actions.resetFilters}
                  className="rounded-lg bg-primary px-4 py-2 text-sm text-white hover:bg-primary/90 transition-colors"
                >
                  Xóa bộ lọc
                </button>
              </div>}

            {!ui.isLoading && !ui.isError && !ui.isEmpty && <>
                <div className="grid grid-cols-3 gap-x-6 gap-y-10">
                  {products.map((product) => <ProductCard key={product.id} {...product} />)}
                </div>

                {pageInfo.totalPages > 1 && <div className="mt-12 flex items-center justify-center gap-3">
                    <button
                      type="button"
                      onClick={() => actions.goToPage(pageInfo.page - 1)}
                      disabled={!pageInfo.hasPreviousPage}
                      className="px-4 py-2 text-sm border border-border rounded-full hover:bg-secondary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
                      className="px-4 py-2 text-sm border border-border rounded-full hover:bg-secondary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Trang sau
                    </button>
                  </div>}
              </>}
          </div>
        </div>
      </div>
    </div>;
}

export {
  ProductListingPage as default
};
