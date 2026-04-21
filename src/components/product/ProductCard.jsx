import { Link } from "react-router";
import { Heart, ShoppingCart, Zap } from "lucide-react";
import { toast } from "sonner";
import { useCart } from "@/hooks/cart/useCart";
import { useCartDrawer } from "@/store/cart/CartDrawerContext";
import {
  createCartItemView,
  resolvePreferredVariant,
} from "@/services/cartService";
import { getCatalogProductById } from "@/services/catalogService";

function ProductCard({
  id,
  name,
  price,
  image,
  subtitle,
  color = "Black",
  colors = ["#000000", "#8B4513", "#D4AF37"],
  inStock = true,
  isPreOrderAllowed = false,
  availabilityStatus,
  product,
}) {
  const { addStandardItem } = useCart();
  const { openDrawer } = useCartDrawer();

  const displayPrice = Number(price ?? 0);
  const displaySubtitle = subtitle || color;
  const displayColors = Array.isArray(colors) ? colors.filter(Boolean) : [];
  const resolvedAvailabilityStatus =
    availabilityStatus ||
    (inStock ? "available" : isPreOrderAllowed || product?.allowPreOrder ? "preorder" : "unavailable");
  const canBuyNow = resolvedAvailabilityStatus === "available";
  const canPreOrder = Boolean(
    isPreOrderAllowed ||
      product?.allowPreOrder ||
      product?.canPreOrder ||
      resolvedAvailabilityStatus === "preorder",
  );
  const isPreOrderOnly = resolvedAvailabilityStatus === "preorder" && !canBuyNow;
  const shouldShowOutOfStock = resolvedAvailabilityStatus === "unavailable";

  async function handleQuickBuy(event) {
    event.preventDefault();

    if (!canBuyNow) {
      toast.error("Sản phẩm nay hien chua san sang de mua ngay.");
      return;
    }

    await addToCart(true);
  }

  async function handleAddToCart(event) {
    event.preventDefault();

    if (!canBuyNow) {
      toast.error("Sản phẩm nay hien chua the them vao gio.");
      return;
    }

    await addToCart(false);
  }

  async function addToCart(openCartDrawer) {
    const productId = Number.parseInt(String(product?.productId ?? id ?? ""), 10);

    if (!Number.isFinite(productId) || productId <= 0) {
      toast.error("Sản phẩm mau nay chua được map variant de goi cart API.");
      return;
    }

    try {
      const detailProduct = await getCatalogProductById(productId);
      const variant = resolvePreferredVariant(detailProduct);

      if (!variant?.variantId) {
        toast.error("Không tim thay bien the hop le de them vao giỏ hàng.");
        return;
      }

      await addStandardItem({
        variantId: variant.variantId,
        quantity: 1,
        orderType: "ready",
        view: createCartItemView(detailProduct, variant),
      });

      toast.success("Da them vao giỏ hàng!");

      if (openCartDrawer) {
        openDrawer();
      }
    } catch (error) {
      toast.error(resolveErrorMessage(error, "Không thể thêm sản phẩm vào giỏ hàng."));
    }
  }

  return <div className="group relative">
      <Link to={`/product/${id}`} state={product ? { prefetchedProduct: product } : undefined} className="block">
        <div className="relative aspect-[4/3] overflow-hidden mb-3 rounded-lg">
          <img
            src={image}
            alt={name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />

          <div className="absolute top-3 left-3">
            <div className="flex flex-wrap gap-2">
              {canBuyNow && <span className="px-2 py-1 bg-green-500 text-white text-xs rounded-md">
                  Con hang
                </span>}
              {isPreOrderOnly && <span className="px-2 py-1 bg-orange-500 text-white text-xs rounded-md">
                  Co the dat truoc
                </span>}
              {shouldShowOutOfStock && <span className="px-2 py-1 bg-gray-600 text-white text-xs rounded-md">
                  Het hang
                </span>}
              {canBuyNow && canPreOrder && <span className="px-2 py-1 bg-orange-500 text-white text-xs rounded-md">
                  Co dat truoc
                </span>}
            </div>
          </div>

          <div className="absolute bottom-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={(event) => {
                event.preventDefault();
              }}
              className="w-9 h-9 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white shadow-md hover:scale-110 transition-transform"
              title="Thêm vao yeu thich"
            >
              <Heart className="w-4 h-4 text-foreground" />
            </button>
            {canBuyNow && <button
                onClick={handleAddToCart}
                className="w-9 h-9 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-primary hover:text-white shadow-md hover:scale-110 transition-all"
                title="Thêm vao gio"
              >
                <ShoppingCart className="w-4 h-4" />
              </button>}
          </div>
        </div>

        <h3 className="text-sm mb-1 text-foreground line-clamp-1" style={{ fontWeight: 400 }}>
          {name}
        </h3>
        <p className="text-sm mb-1" style={{ fontWeight: 600 }}>{formatCurrency(displayPrice)}</p>
        <p className="text-xs text-muted-foreground mb-2">{displaySubtitle}</p>
        {isPreOrderOnly && <p className="mb-3 text-xs font-medium text-orange-700">
            Available for Pre-order
          </p>}

        {displayColors.length > 0 && <div className="flex items-center gap-1.5 mb-3">
            {displayColors.map((item, index) => <div
                key={`${item}-${index}`}
                className="w-4 h-4 rounded-full border border-border"
                style={{ backgroundColor: item }}
              />)}
          </div>}
      </Link>

      <div className={canBuyNow && canPreOrder ? "grid grid-cols-2 gap-2" : ""}>
        {canBuyNow && <button
            onClick={handleQuickBuy}
            className="w-full py-2 text-sm bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 group/btn"
            style={{ fontWeight: 500 }}
          >
            <Zap className="w-4 h-4 group-hover/btn:scale-110 transition-transform" />
            Mua Ngay
          </button>}
        {canPreOrder && <Link
            to={`/preorder/${id}`}
            className="block w-full py-2 text-sm text-center bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
            style={{ fontWeight: 500 }}
          >
            Dat Truoc
          </Link>}
      </div>
    </div>;
}

function formatCurrency(value) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(value);
}

function resolveErrorMessage(error, fallbackMessage) {
  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message;
  }

  if (typeof error === "string" && error.trim().length > 0) {
    return error;
  }

  return fallbackMessage;
}

export {
  ProductCard as default
};

