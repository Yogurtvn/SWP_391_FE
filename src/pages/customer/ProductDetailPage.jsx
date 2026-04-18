import { ArrowLeft, Check, ChevronLeft, ChevronRight, ShoppingCart, Zap } from "lucide-react";
import ProductCard from "@/components/product/ProductCard";
import { useProductDetailPage } from "@/hooks/shop/useProductDetailPage";

export default function ProductDetailPage() {
  const { product, relatedProducts, selectedColor, selectedSize, currentImage, ui, actions } = useProductDetailPage();
  const canBuyNow = product?.availabilityStatus === "available";
  const shouldShowPreOrder = product?.availabilityStatus !== "available";

  if (ui.loading) {
    return <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid md:grid-cols-2 gap-12 animate-pulse">
          <div>
            <div className="aspect-square rounded-2xl bg-secondary mb-4" />
            <div className="grid grid-cols-4 gap-3">
              {Array.from({ length: 4 }).map((_, index) => <div key={index} className="aspect-square rounded-lg bg-secondary" />)}
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
      </div>;
  }

  if (ui.error) {
    return <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center">
          <h1 className="mb-3">Không thể tải chi tiết sản phẩm</h1>
          <p className="text-sm text-red-800 mb-6">{ui.error}</p>
          <button
            type="button"
            onClick={actions.goBackToShop}
            className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-5 py-3 text-white hover:bg-red-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Quay lại cửa hàng
          </button>
        </div>
      </div>;
  }

  if (ui.isNotFound || !product) {
    return <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center">
          <h1 className="mb-4">Không tìm thấy sản phẩm</h1>
          <p className="text-muted-foreground mb-6">
            Sản phẩm bạn đang tìm không tồn tại hoặc đã bị ẩn khỏi catalog.
          </p>
          <button
            type="button"
            onClick={actions.goBackToShop}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-3 text-white hover:bg-primary/90 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Quay lại cửa hàng
          </button>
        </div>
      </div>;
  }

  return <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <button
        type="button"
        onClick={actions.goBackToShop}
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-8"
      >
        <ArrowLeft className="w-4 h-4" />
        Quay lại cửa hàng
      </button>

      <div className="grid md:grid-cols-2 gap-12 mb-20">
        <div>
          <div className="relative aspect-square bg-secondary rounded-2xl overflow-hidden mb-4">
            <img
              src={product.images[currentImage] ?? product.image}
              alt={product.name}
              className="w-full h-full object-cover"
            />
            {product.images.length > 1 && <>
                <button
                  type="button"
                  onClick={actions.showPreviousImage}
                  className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/90 p-2 rounded-full hover:bg-white transition-colors"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <button
                  type="button"
                  onClick={actions.showNextImage}
                  className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/90 p-2 rounded-full hover:bg-white transition-colors"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              </>}
          </div>

          {product.images.length > 1 && <div className="flex gap-4">
              {product.images.map((image, index) => <button
                  key={`${image}-${index}`}
                  type="button"
                  onClick={() => actions.setCurrentImage(index)}
                  className={`w-20 h-20 rounded-lg overflow-hidden border-2 transition-colors ${index === currentImage ? "border-primary" : "border-transparent"}`}
                >
                  <img src={image} alt="" className="w-full h-full object-cover" />
                </button>)}
            </div>}
        </div>

        <div>
          <div className="mb-3 flex items-center gap-3">
            <span className="rounded-full bg-secondary px-3 py-1 text-xs text-muted-foreground">
              {product.productTypeLabel}
            </span>
            {canBuyNow && <span className="rounded-full bg-green-100 px-3 py-1 text-xs text-green-700">
                Còn hàng
              </span>}
            {shouldShowPreOrder && <span className="rounded-full bg-orange-100 px-3 py-1 text-xs text-orange-700">
                Hết hàng
              </span>}
          </div>

          <h1 className="mb-4">{product.name}</h1>
          <p className="text-3xl text-primary mb-6">{formatCurrency(product.price)}</p>

          <p className="text-muted-foreground mb-6 leading-7">{product.description}</p>

          {product.colors.length > 0 && <div className="mb-6">
              <label className="block mb-3">Màu sắc</label>
              <div className="flex gap-3 flex-wrap">
                {product.colors.map((color) => <button
                    key={color}
                    type="button"
                    onClick={() => actions.selectColor(color)}
                    className={`rounded-full border px-4 py-2 text-sm transition-colors ${selectedColor === color ? "border-primary bg-primary/10 text-primary" : "border-border hover:border-primary/50"}`}
                  >
                    {color}
                  </button>)}
              </div>
            </div>}

          {product.sizes.length > 0 && <div className="mb-6">
              <label className="block mb-3">Kích thước</label>
              <div className="flex gap-3 flex-wrap">
                {product.sizes.map((size) => <button
                    key={size}
                    type="button"
                    onClick={() => actions.selectSize(size)}
                    className={`rounded-full border px-4 py-2 text-sm transition-colors ${selectedSize === size ? "border-primary bg-primary/10 text-primary" : "border-border hover:border-primary/50"}`}
                  >
                    {size}
                  </button>)}
              </div>
            </div>}

          {product.prescriptionCompatible && <div className="mb-6 flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
              <Check className="w-4 h-4 shrink-0" />
              <span>Sản phẩm này hỗ trợ đo kính theo toa.</span>
            </div>}

          {product.selectedVariant && <div className="mb-6 rounded-xl bg-secondary p-4 text-sm">
              <div className="grid grid-cols-2 gap-3">
                {product.selectedVariant.color && <div>
                    <p className="text-muted-foreground mb-1">Màu đang chọn</p>
                    <p>{selectedColor || product.selectedVariant.color}</p>
                  </div>}
                {product.selectedVariant.size && <div>
                    <p className="text-muted-foreground mb-1">Kích thước</p>
                    <p>{selectedSize || product.selectedVariant.size}</p>
                  </div>}
                <div>
                  <p className="text-muted-foreground mb-1">Số lượng khả dụng</p>
                  <p>{product.selectedVariant.quantity}</p>
                </div>
                <div>
                  <p className="text-muted-foreground mb-1">SKU</p>
                  <p>{product.selectedVariant.sku}</p>
                </div>
              </div>
            </div>}

          <div className="space-y-3">
            {canBuyNow && <>
                <button
                  type="button"
                  onClick={actions.buyNow}
                  className="w-full py-4 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 group"
                >
                  <Zap className="w-5 h-5 group-hover:scale-110 transition-transform" />
                  <span>Mua Ngay - {formatCurrency(product.price)}</span>
                </button>
                <button
                  type="button"
                  onClick={actions.addToCart}
                  className="w-full py-4 border-2 border-primary text-primary rounded-lg hover:bg-primary/5 transition-colors flex items-center justify-center gap-2"
                >
                  <ShoppingCart className="w-5 h-5" />
                  <span>Thêm Vào Giỏ</span>
                </button>
              </>}

            {shouldShowPreOrder && <button
                type="button"
                onClick={actions.goToPreOrder}
                className="w-full py-4 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors flex items-center justify-center gap-2"
              >
                <Zap className="w-5 h-5" />
                <span>Đặt Trước</span>
              </button>}
          </div>
        </div>
      </div>

      {relatedProducts.length > 0 && <section>
          <h2 className="mb-6">Sản phẩm liên quan</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
            {relatedProducts.map((item) => <ProductCard key={item.id} {...item} />)}
          </div>
        </section>}
    </div>;
}

function formatCurrency(value) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(Number(value ?? 0));
}
