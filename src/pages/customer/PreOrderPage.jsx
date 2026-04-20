import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router";
import { AlertCircle, ArrowLeft, CalendarDays, Package, ShoppingCart, Truck } from "lucide-react";
import { toast } from "sonner";
import { useCart } from "@/hooks/cart/useCart";
import { createCartItemView } from "@/services/cartService";
import { getCatalogErrorMessage, getCatalogProductById } from "@/services/catalogService";

const INITIAL_STATE = {
  product: null,
  status: "idle",
  error: "",
};

export default function PreOrderPage() {
  const { productId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { addStandardItem, isCustomerSession, mutationStatus } = useCart();

  const [state, setState] = useState(INITIAL_STATE);
  const [selectedVariantId, setSelectedVariantId] = useState(null);
  const [quantity, setQuantity] = useState(1);

  const numericProductId = parsePositiveInteger(productId);
  const isSubmitting = mutationStatus === "loading";

  useEffect(() => {
    if (!numericProductId) {
      setState(INITIAL_STATE);
      setSelectedVariantId(null);
      return;
    }

    let isMounted = true;

    async function loadProduct() {
      setState({
        product: null,
        status: "loading",
        error: "",
      });

      try {
        const product = await getCatalogProductById(numericProductId);

        if (!isMounted) {
          return;
        }

        const preOrderVariants = getPreOrderVariants(product);
        const preferredVariant =
          preOrderVariants.find((variant) => variant.variantId === Number(location.state?.selectedVariantId)) ||
          preOrderVariants.find((variant) => Number(variant.quantity ?? 0) <= 0) ||
          preOrderVariants[0] ||
          null;

        setState({
          product,
          status: "succeeded",
          error: "",
        });
        setSelectedVariantId(preferredVariant?.variantId ?? null);
      } catch (error) {
        if (!isMounted) {
          return;
        }

        setState({
          product: null,
          status: "failed",
          error: getCatalogErrorMessage(error, "Không thể tải sản phẩm đặt trước."),
        });
        setSelectedVariantId(null);
      }
    }

    void loadProduct();

    return () => {
      isMounted = false;
    };
  }, [location.state?.selectedVariantId, numericProductId]);

  const preOrderVariants = useMemo(() => getPreOrderVariants(state.product), [state.product]);
  const selectedVariant = useMemo(
    () => preOrderVariants.find((variant) => variant.variantId === Number(selectedVariantId)) ?? null,
    [preOrderVariants, selectedVariantId],
  );
  const canCreatePreOrder = selectedVariant ? isPreOrderQuantity(selectedVariant, quantity) : false;

  async function handleAddPreOrder() {
    if (!isCustomerSession) {
      toast.error("Vui lòng đăng nhập bằng tài khoản khách hàng để đặt trước.");
      navigate("/login");
      return;
    }

    if (!state.product || !selectedVariant) {
      toast.error("Vui lòng chọn một biến thể hỗ trợ đặt trước.");
      return;
    }

    if (!isPreOrderQuantity(selectedVariant, quantity)) {
      toast.error("Biến thể này vẫn còn đủ hàng cho số lượng đã chọn. Vui lòng mua ngay hoặc tăng số lượng vượt tồn kho.");
      return;
    }

    try {
      await addStandardItem({
        variantId: selectedVariant.variantId,
        quantity,
        orderType: "preOrder",
        view: createCartItemView(state.product, selectedVariant),
      });

      toast.success("Đã thêm sản phẩm đặt trước vào giỏ hàng.");
      navigate("/checkout", {
        state: {
          orderType: "preOrder",
        },
      });
    } catch (error) {
      toast.error(resolveErrorMessage(error, "Không thể tạo sản phẩm đặt trước."));
    }
  }

  if (!numericProductId) {
    return (
      <StateCard
        icon={Package}
        title="Chọn sản phẩm để đặt trước"
        description="Backend hiện xử lý pre-order theo product variant. Hãy chọn sản phẩm có nút Đặt Trước trong catalog."
        primaryAction={{
          label: "Xem sản phẩm",
          to: "/shop",
        }}
      />
    );
  }

  if (state.status === "loading") {
    return (
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="rounded-[28px] border border-border bg-white p-12 text-center shadow-sm">
          <div className="mx-auto mb-4 h-12 w-12 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
          <p className="text-muted-foreground">Đang tải sản phẩm đặt trước...</p>
        </div>
      </div>
    );
  }

  if (state.status === "failed") {
    return (
      <StateCard
        icon={AlertCircle}
        title="Không thể tải flow đặt trước"
        description={state.error}
        primaryAction={{
          label: "Thử sản phẩm khác",
          to: "/shop",
        }}
      />
    );
  }

  if (!state.product || preOrderVariants.length === 0) {
    return (
      <StateCard
        icon={AlertCircle}
        title="Sản phẩm chưa hỗ trợ đặt trước"
        description="Không có biến thể nào của sản phẩm này đang bật preorder trong inventory."
        primaryAction={{
          label: "Quay lại sản phẩm",
          to: numericProductId ? `/product/${numericProductId}` : "/shop",
        }}
        secondaryAction={{
          label: "Xem sản phẩm khác",
          to: "/shop",
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-secondary/30 py-12">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <Link
          to={`/product/${state.product.productId}`}
          className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Quay lại sản phẩm
        </Link>

        <div className="grid gap-8 lg:grid-cols-[1fr_0.9fr]">
          <section className="overflow-hidden rounded-[30px] border border-border bg-white shadow-sm">
            <div className="relative aspect-[4/3] bg-secondary">
              <img
                src={state.product.image}
                alt={state.product.name}
                className="h-full w-full object-cover"
              />
              <span className="absolute left-5 top-5 rounded-full bg-orange-600 px-4 py-2 text-sm text-white shadow">
                Đặt trước
              </span>
            </div>

            <div className="p-6">
              <p className="mb-2 text-sm text-muted-foreground">{state.product.productTypeLabel}</p>
              <h1 className="mb-3 text-3xl">{state.product.name}</h1>
              <p className="mb-5 leading-7 text-muted-foreground">{state.product.description}</p>

              <div className="rounded-2xl border border-orange-200 bg-orange-50 p-4 text-sm leading-6 text-orange-900">
                Flow này dùng API thật của backend: chỉ tạo preorder khi số lượng đặt lớn hơn tồn kho và variant bật
                `IsPreOrderAllowed`, sau đó checkout bằng `POST /api/orders/checkout`.
              </div>
            </div>
          </section>

          <aside className="h-fit rounded-[30px] border border-border bg-white p-6 shadow-sm">
            <div className="mb-6">
              <h2 className="mb-2 text-2xl">Chọn biến thể đặt trước</h2>
              <p className="text-sm text-muted-foreground">
                Chỉ hiển thị các biến thể được bật preorder trong inventory.
              </p>
            </div>

            <div className="mb-6 space-y-3">
              {preOrderVariants.map((variant) => {
                const isSelected = variant.variantId === selectedVariantId;

                return (
                  <button
                    key={variant.variantId}
                    type="button"
                    onClick={() => setSelectedVariantId(variant.variantId)}
                    className={`w-full rounded-2xl border p-4 text-left transition-colors ${
                      isSelected ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
                    }`}
                  >
                    <div className="mb-3 flex items-start justify-between gap-4">
                      <div>
                        <p className="font-semibold">{variant.sku || `Variant #${variant.variantId}`}</p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {[variant.color, variant.size, variant.frameType].filter(Boolean).join(" / ") || "Mặc định"}
                        </p>
                      </div>
                      <span className="rounded-full bg-orange-100 px-3 py-1 text-xs text-orange-700">
                        {Number(variant.quantity ?? 0) > 0 ? `Preorder nếu > ${Number(variant.quantity ?? 0)}` : "Hết hàng"}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                      <span>{formatCurrency(variant.price)}</span>
                      <span>Tồn kho hiện tại: {Number(variant.quantity ?? 0)}</span>
                      {variant.expectedRestockDate ? (
                        <span className="inline-flex items-center gap-1">
                          <CalendarDays className="h-4 w-4" />
                          Dự kiến: {formatDate(variant.expectedRestockDate)}
                        </span>
                      ) : null}
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="mb-6 rounded-2xl bg-secondary/70 p-4">
              <label className="mb-2 block text-sm text-muted-foreground">Số lượng</label>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setQuantity((current) => Math.max(1, current - 1))}
                  className="h-10 w-10 rounded-xl border border-border bg-white text-lg"
                >
                  -
                </button>
                <input
                  type="number"
                  min="1"
                  max="99"
                  value={quantity}
                  onChange={(event) => setQuantity(clampQuantity(event.target.value))}
                  className="h-10 w-24 rounded-xl border border-border bg-white px-3 text-center outline-none focus:border-primary"
                />
                <button
                  type="button"
                  onClick={() => setQuantity((current) => Math.min(99, current + 1))}
                  className="h-10 w-10 rounded-xl border border-border bg-white text-lg"
                >
                  +
                </button>
              </div>
            </div>

            <div className="mb-6 rounded-2xl border border-border p-4">
              <div className="mb-3 flex items-center gap-2">
                <Truck className="h-5 w-5 text-primary" />
                <p className="font-semibold">Tóm tắt</p>
              </div>
              <div className="space-y-2 text-sm">
                <Row label="Đơn giá" value={formatCurrency(selectedVariant?.price ?? state.product.price)} />
                <Row label="Số lượng" value={quantity} />
                <Row
                  label="Tạm tính"
                  value={formatCurrency(Number(selectedVariant?.price ?? state.product.price) * quantity)}
                  accent
                />
              </div>
            </div>

            {selectedVariant && !canCreatePreOrder ? (
              <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
                Biến thể này còn {Number(selectedVariant.quantity ?? 0)} sản phẩm. Theo requirement, preorder chỉ áp dụng
                khi hết hàng hoặc số lượng đặt lớn hơn tồn kho. Với số lượng hiện tại, hãy dùng luồng mua hàng có sẵn.
              </div>
            ) : null}

            <button
              type="button"
              onClick={handleAddPreOrder}
              disabled={isSubmitting || !selectedVariant || !canCreatePreOrder}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-orange-600 px-5 py-4 text-white transition-colors hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? (
                <>
                  <div className="h-5 w-5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  Đang tạo preorder...
                </>
              ) : (
                <>
                  <ShoppingCart className="h-5 w-5" />
                  Thêm vào giỏ và checkout
                </>
              )}
            </button>
          </aside>
        </div>
      </div>
    </div>
  );
}

function StateCard({ icon: Icon, title, description, primaryAction, secondaryAction }) {
  return (
    <div className="min-h-screen bg-secondary/30 py-12">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-[28px] border border-border bg-white px-8 py-16 text-center shadow-sm">
          <Icon className="mx-auto mb-5 h-16 w-16 text-primary" />
          <h1 className="mb-3 text-3xl">{title}</h1>
          <p className="mx-auto mb-8 max-w-2xl text-muted-foreground leading-7">{description}</p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link
              to={primaryAction.to}
              className="rounded-xl bg-primary px-5 py-3 text-white transition-colors hover:bg-primary/90"
            >
              {primaryAction.label}
            </Link>
            {secondaryAction ? (
              <Link
                to={secondaryAction.to}
                className="rounded-xl border border-border px-5 py-3 transition-colors hover:bg-secondary"
              >
                {secondaryAction.label}
              </Link>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value, accent = false }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-muted-foreground">{label}</span>
      <span className={accent ? "text-lg font-semibold text-primary" : "font-medium"}>{value}</span>
    </div>
  );
}

function getPreOrderVariants(product) {
  return Array.isArray(product?.variants)
    ? product.variants.filter((variant) => Boolean(variant?.isPreOrderAllowed))
    : [];
}

function isPreOrderQuantity(variant, quantity) {
  const availableQuantity = Number(variant?.quantity ?? 0);
  const requestedQuantity = Number(quantity ?? 0);

  return Boolean(variant?.isPreOrderAllowed) && requestedQuantity > Math.max(0, availableQuantity);
}

function clampQuantity(value) {
  const parsedValue = Number.parseInt(String(value ?? ""), 10);

  if (!Number.isFinite(parsedValue) || parsedValue < 1) {
    return 1;
  }

  return Math.min(parsedValue, 99);
}

function parsePositiveInteger(value) {
  const parsedValue = Number.parseInt(String(value ?? ""), 10);
  return Number.isFinite(parsedValue) && parsedValue > 0 ? parsedValue : null;
}

function formatCurrency(value) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(Number(value ?? 0));
}

function formatDate(value) {
  if (!value) {
    return "Chưa cập nhật";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Chưa cập nhật";
  }

  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
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
