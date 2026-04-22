import { ArrowLeft, Check, ChevronLeft, ChevronRight, ShoppingCart, Zap } from "lucide-react";
import ProductCard from "@/components/product/ProductCard";
import { useProductDetailPage } from "@/hooks/shop/useProductDetailPage";

export default function ProductDetailPage() {
  const { product, relatedProducts, selectedColor, selectedSize, currentImage, ui, actions } = useProductDetailPage();
  const canBuyNow = product?.availabilityStatus === "available";
  const canPreOrder = Boolean(product?.canPreOrder && product?.availabilityStatus === "preorder");
  const shouldShowOutOfStock = !canBuyNow && !canPreOrder;

  if (ui.loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid animate-pulse gap-12 md:grid-cols-2">
          <div>
            <div className="mb-4 aspect-square rounded-2xl bg-secondary" />
            <div className="grid grid-cols-4 gap-3">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="aspect-square rounded-lg bg-secondary" />
              ))}
            </div>
          </div>
          <div className="space-y-4">
            <div className="h-10 rounded bg-secondary" />
            <div className="h-5 w-1/3 rounded bg-secondary" />
            <div className="h-8 w-1/2 rounded bg-secondary" />
            <div className="h-28 rounded bg-secondary" />
            <div className="h-12 rounded bg-secondary" />
            <div className="h-12 rounded bg-secondary" />
          </div>
        </div>
      </div>
    );
  }

  if (ui.error) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center">
          <h1 className="mb-3">Không thể tải chi tiết sản phẩm</h1>
          <p className="mb-6 text-sm text-red-800">{ui.error}</p>
          <button
            type="button"
            onClick={actions.goBackToShop}
            className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-5 py-3 text-white transition-colors hover:bg-red-700"
          >
            <ArrowLeft className="h-4 w-4" />
            Quay lại cửa hàng
          </button>
        </div>
      </div>
    );
  }

  if (ui.isNotFound || !product) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="text-center">
          <h1 className="mb-4">Không tìm thấy sản phẩm</h1>
          <p className="mb-6 text-muted-foreground">
            Sản phẩm bạn đang tìm không tồn tại hoặc đã bị ẩn khỏi catalog.
          </p>
          <button
            type="button"
            onClick={actions.goBackToShop}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-3 text-white transition-colors hover:bg-primary/90"
          >
            <ArrowLeft className="h-4 w-4" />
            Quay lại cửa hàng
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <button
        type="button"
        onClick={actions.goBackToShop}
        className="mb-8 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Quay lại cửa hàng
      </button>

      <div className="mb-20 grid gap-12 md:grid-cols-2">
        <div>
          <div className="relative mb-4 aspect-square overflow-hidden rounded-2xl bg-secondary">
            <img
              src={product.images[currentImage] ?? product.image}
              alt={product.name}
              className="h-full w-full object-cover"
            />
            {product.images.length > 1 ? (
              <>
                <button
                  type="button"
                  onClick={actions.showPreviousImage}
                  className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-white/90 p-2 transition-colors hover:bg-white"
                >
                  <ChevronLeft className="h-6 w-6" />
                </button>
                <button
                  type="button"
                  onClick={actions.showNextImage}
                  className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-white/90 p-2 transition-colors hover:bg-white"
                >
                  <ChevronRight className="h-6 w-6" />
                </button>
              </>
            ) : null}
          </div>

          {product.images.length > 1 ? (
            <div className="flex gap-4">
              {product.images.map((image, index) => (
                <button
                  key={`${image}-${index}`}
                  type="button"
                  onClick={() => actions.setCurrentImage(index)}
                  className={`h-20 w-20 overflow-hidden rounded-lg border-2 transition-colors ${
                    index === currentImage ? "border-primary" : "border-transparent"
                  }`}
                >
                  <img src={image} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          ) : null}
        </div>

        <div>
          <div className="mb-3 flex items-center gap-3">
            <span className="rounded-full bg-secondary px-3 py-1 text-xs text-muted-foreground">
              {product.productTypeLabel}
            </span>
            {canBuyNow ? (
              <span className="rounded-full bg-green-100 px-3 py-1 text-xs text-green-700">Còn hàng</span>
            ) : null}
            {shouldShowOutOfStock ? (
              <span className="rounded-full bg-orange-100 px-3 py-1 text-xs text-orange-700">Hết hàng</span>
            ) : null}
            {canPreOrder ? (
              <span className="rounded-full bg-orange-100 px-3 py-1 text-xs text-orange-700">Đặt trước</span>
            ) : null}
          </div>

          <h1 className="mb-4">{product.name}</h1>
          <p className="mb-6 text-3xl text-primary">{formatCurrency(product.price)}</p>

          <p className="mb-6 leading-7 text-muted-foreground">{product.description}</p>

          {product.colors.length > 0 ? (
            <div className="mb-6">
              <label className="mb-3 block">Màu sắc</label>
              <div className="flex flex-wrap gap-3">
                {product.colors.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => actions.selectColor(color)}
                    className={`rounded-full border px-4 py-2 text-sm transition-colors ${
                      selectedColor === color
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    {color}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          {product.sizes.length > 0 ? (
            <div className="mb-6">
              <label className="mb-3 block">Kích thước</label>
              <div className="flex flex-wrap gap-3">
                {product.sizes.map((size) => (
                  <button
                    key={size}
                    type="button"
                    onClick={() => actions.selectSize(size)}
                    className={`rounded-full border px-4 py-2 text-sm transition-colors ${
                      selectedSize === size
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          {product.prescriptionCompatible ? (
            <div className="mb-6 flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
              <Check className="h-4 w-4 shrink-0" />
              <span>Sản phẩm này hỗ trợ đo kính theo toa.</span>
            </div>
          ) : null}

          {product.selectedVariant ? (
            <div className="mb-6 rounded-xl bg-secondary p-4 text-sm">
              <div className="grid grid-cols-2 gap-3">
                {product.selectedVariant.color ? (
                  <div>
                    <p className="mb-1 text-muted-foreground">Màu đang chọn</p>
                    <p>{selectedColor || product.selectedVariant.color}</p>
                  </div>
                ) : null}
                {product.selectedVariant.size ? (
                  <div>
                    <p className="mb-1 text-muted-foreground">Kích thước</p>
                    <p>{selectedSize || product.selectedVariant.size}</p>
                  </div>
                ) : null}
                <div>
                  <p className="mb-1 text-muted-foreground">Số lượng khả dụng</p>
                  <p>{product.selectedVariant.quantity}</p>
                </div>
                <div>
                  <p className="mb-1 text-muted-foreground">SKU</p>
                  <p>{product.selectedVariant.sku}</p>
                </div>
              </div>
              {canPreOrder && product.selectedVariant.isPreOrderAllowed ? (
                <div className="mt-4 rounded-xl border border-orange-200 bg-orange-50 px-4 py-3 text-orange-900">
                  <p className="font-medium">
                    Sản phẩm đã hết hàng, có thể đặt trước.
                  </p>
                  {product.selectedVariant.expectedRestockDate ? (
                    <p className="mt-1 text-sm">
                      Du kien co hang: {formatDate(product.selectedVariant.expectedRestockDate)}
                    </p>
                  ) : null}
                  {product.selectedVariant.preOrderNote ? (
                    <p className="mt-1 text-sm">{product.selectedVariant.preOrderNote}</p>
                  ) : null}
                </div>
              ) : null}
            </div>
          ) : null}

          <div className="space-y-3">
            {product.prescriptionCompatible ? (
              <button
                type="button"
                onClick={actions.goToPrescriptionFlow}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 py-4 text-white transition-colors hover:bg-emerald-700"
              >
                <Check className="h-5 w-5" />
                <span>Đặt Kính Theo Toa</span>
              </button>
            ) : null}

            {canBuyNow ? (
              <>
                <button
                  type="button"
                  onClick={actions.buyNow}
                  className="group flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-4 text-white transition-colors hover:bg-primary/90"
                >
                  <Zap className="h-5 w-5 transition-transform group-hover:scale-110" />
                  <span>Mua Ngay - {formatCurrency(product.price)}</span>
                </button>
                <button
                  type="button"
                  onClick={actions.addToCart}
                  className="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-primary py-4 text-primary transition-colors hover:bg-primary/5"
                >
                  <ShoppingCart className="h-5 w-5" />
                  <span>Thêm Vào Giỏ</span>
                </button>
              </>
            ) : null}

            {canPreOrder ? (
              <button
                type="button"
                onClick={actions.goToPreOrder}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-orange-600 py-4 text-white transition-colors hover:bg-orange-700"
              >
                <Zap className="h-5 w-5" />
                <span>Đặt Trước</span>
              </button>
            ) : null}
          </div>
        </div>
      </div>

      {relatedProducts.length > 0 ? (
        <section>
          <h2 className="mb-6">Sản phẩm liên quan</h2>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
            {relatedProducts.map((item) => (
              <ProductCard key={item.id} {...item} />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}

function formatCurrency(value) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(Number(value ?? 0));
}

function formatDate(value) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "chua cap nhat";
  }

  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}
