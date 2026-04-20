import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { Heart, Minus, Plus, Shield, ShoppingBag, Tag, Trash2, Truck } from "lucide-react";
import { toast } from "sonner";
import { useCart } from "@/hooks/cart/useCart";

function CartPage() {
  const navigate = useNavigate();
  const { getTotal, isCustomerSession, items, mutationStatus, removeItem, status, updateQuantity } = useCart();

  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [savedItems, setSavedItems] = useState([]);

  const isLoading = status === "loading" && items.length === 0;
  const isMutating = mutationStatus === "loading";
  const subtotal = getTotal();
  const discount = appliedCoupon ? subtotal * appliedCoupon.discount / 100 : 0;
  const total = subtotal - discount;

  async function handleUpdateQuantity(cartItemId, change) {
    const item = items.find((currentItem) => currentItem.cartItemId === cartItemId);

    if (!item) {
      return;
    }

    try {
      await updateQuantity(cartItemId, Math.max(1, item.quantity + change));
    } catch (error) {
      toast.error(resolveErrorMessage(error, "Không thể cập nhật số lượng sản phẩm."));
    }
  }

  function handleApplyCoupon() {
    if (couponCode.toUpperCase() === "WELCOME10") {
      setAppliedCoupon({ code: "WELCOME10", discount: 10 });
      toast.success("Mã giảm giá đã được áp dụng!");
      return;
    }

    if (couponCode.toUpperCase() === "SAVE20") {
      setAppliedCoupon({ code: "SAVE20", discount: 20 });
      toast.success("Mã giảm giá đã được áp dụng!");
      return;
    }

    toast.error("Mã giảm giá không hợp lệ");
  }

  async function handleSaveForLater(item) {
    setSavedItems((currentItems) => [...currentItems, item.cartItemId]);

    try {
      await removeItem(item.cartItemId, item.itemType);
      toast.success("Đã lưu sản phẩm để mua sau");
    } catch (error) {
      toast.error(resolveErrorMessage(error, "Không thể lưu sản phẩm để mua sau."));
    }
  }

  async function handleRemoveItem(item) {
    try {
      await removeItem(item.cartItemId, item.itemType);
      toast.success("Đã xóa sản phẩm khỏi giỏ hàng");
    } catch (error) {
      toast.error(resolveErrorMessage(error, "Không thể xóa sản phẩm khỏi giỏ hàng."));
    }
  }

  return <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="mb-2">Giỏ Hàng</h1>
          <p className="text-muted-foreground">
            {items.length > 0 ? `${items.length} sản phẩm` : "Giỏ hàng trống"}
          </p>
        </div>

        {!isCustomerSession ? <div className="text-center py-16 bg-secondary rounded-2xl">
            <ShoppingBag className="w-20 h-20 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h2 className="mb-2">Giỏ hàng cần tài khoản khách hàng</h2>
            <p className="text-muted-foreground mb-6">
              Vui lòng đăng nhập để đồng bộ và thanh toán đơn hàng của bạn
            </p>
            <Link
              to="/login"
              className="inline-block px-8 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
            >
              Đăng Nhập
            </Link>
          </div> : isLoading ? <div className="text-center py-16 bg-secondary rounded-2xl">
            <div className="h-12 w-12 rounded-full border-4 border-primary/20 border-t-primary animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Đang tải giỏ hàng...</p>
          </div> : items.length === 0 ? <div className="text-center py-16 bg-secondary rounded-2xl">
            <ShoppingBag className="w-20 h-20 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h2 className="mb-2">Giỏ hàng của bạn đang trống</h2>
            <p className="text-muted-foreground mb-6">
              Hãy khám phá bộ sưu tập kính mắt đa dạng của chúng tôi
            </p>
            <Link
              to="/shop"
              className="inline-block px-8 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
            >
              Khám Phá Sản Phẩm
            </Link>
          </div> : <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-4">
              <div className="space-y-4">
                {items.map((item) => <div
                    key={item.cartItemId}
                    className="bg-white border border-border rounded-xl p-6 hover:shadow-md transition-shadow"
                  >
                    <div className="flex gap-6">
                      <div className="w-32 h-32 bg-secondary rounded-lg overflow-hidden shrink-0">
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start gap-4 mb-3">
                          <div>
                            <h3 className="mb-2 text-lg">{item.name}</h3>
                            <div className="space-y-1 text-sm text-muted-foreground">
                              <p className="flex items-center gap-2">
                                <span className="w-4 h-4 rounded-full border border-border" style={{ backgroundColor: item.color === "Đen" ? "#000" : item.color === "Tortoise" ? "#8B4513" : "#E5E7EB" }} />
                                Màu: {item.color}
                              </p>
                              {item.size && <p>Kích thước: {item.size}</p>}
                              {item.sku && <p>SKU: {item.sku}</p>}
                              {item.hasPrescription ? <>
                                  <p>✓ Tròng: {item.prescriptionDetails?.lensType}</p>
                                  <p>✓ Theo toa</p>
                                </> : item.orderType === "preOrder" ? <p className="text-blue-600">• Đặt trước</p> : <p className="text-amber-600">• Hàng sẵn</p>}
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-xl text-primary mb-1">{formatCurrency(item.unitPrice)}</p>
                            <p className="text-sm text-muted-foreground">mỗi sản phẩm</p>
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-3 border-t border-border">
                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-3 bg-secondary rounded-lg px-3 py-2">
                              <button
                                onClick={() => handleUpdateQuantity(item.cartItemId, -1)}
                                disabled={item.quantity <= 1 || isMutating}
                                className="w-6 h-6 flex items-center justify-center hover:text-primary transition-colors"
                              >
                                <Minus className="w-4 h-4" />
                              </button>
                              <span className="w-8 text-center font-medium">{item.quantity}</span>
                              <button
                                onClick={() => handleUpdateQuantity(item.cartItemId, 1)}
                                disabled={isMutating}
                                className="w-6 h-6 flex items-center justify-center hover:text-primary transition-colors"
                              >
                                <Plus className="w-4 h-4" />
                              </button>
                            </div>
                            <span className="text-sm text-muted-foreground">
                              Tổng: <span className="text-foreground font-semibold">{formatCurrency(item.totalPrice)}</span>
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleSaveForLater(item)}
                              disabled={isMutating}
                              className="p-2 text-muted-foreground hover:text-primary hover:bg-secondary rounded-lg transition-colors"
                              title="Lưu để mua sau"
                            >
                              <Heart className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() => handleRemoveItem(item)}
                              disabled={isMutating}
                              className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                              title="Xóa"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>)}
              </div>

              <Link
                to="/shop"
                className="inline-flex items-center gap-2 text-primary hover:underline"
              >
                ← Tiếp tục mua sắm
              </Link>
            </div>

            <div className="lg:col-span-1">
              <div className="bg-secondary rounded-xl p-6 sticky top-24 space-y-6">
                <h3>Tóm Tắt Đơn Hàng</h3>

                <div>
                  <label className="block text-sm mb-2">Mã giảm giá</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={couponCode}
                      onChange={(event) => setCouponCode(event.target.value)}
                      placeholder="Nhập mã"
                      className="flex-1 px-3 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                    <button
                      onClick={handleApplyCoupon}
                      className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors whitespace-nowrap"
                    >
                      Áp dụng
                    </button>
                  </div>
                  {appliedCoupon && <div className="mt-2 flex items-center gap-2 text-sm text-green-600">
                      <Tag className="w-4 h-4" />
                      <span>Giảm {appliedCoupon.discount}% với mã {appliedCoupon.code}</span>
                    </div>}
                  <p className="text-xs text-muted-foreground mt-2">
                    Thử: WELCOME10 hoặc SAVE20
                  </p>
                </div>

                <div className="space-y-3 pt-4 border-t border-border">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Tạm tính</span>
                    <span>{formatCurrency(subtotal)}</span>
                  </div>
                  {appliedCoupon && <div className="flex justify-between text-sm text-green-600">
                      <span>Giảm giá ({appliedCoupon.discount}%)</span>
                      <span>-{formatCurrency(discount)}</span>
                    </div>}
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Vận chuyển</span>
                    <span className="text-muted-foreground">Tính ở checkout</span>
                  </div>
                  <div className="border-t border-border pt-3">
                    <div className="flex justify-between items-center">
                      <span className="text-lg">Tổng cộng</span>
                      <span className="text-2xl text-primary">{formatCurrency(total)}</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => navigate("/checkout")}
                  disabled={isMutating}
                  className="w-full py-4 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-medium disabled:opacity-60"
                >
                  Thanh Toán Ngay
                </button>

                <div className="space-y-3 pt-4 border-t border-border">
                  <div className="flex items-start gap-3 text-sm">
                    <Shield className="w-5 h-5 text-green-600 shrink-0" />
                    <div>
                      <p className="font-medium">Thanh toán an toàn</p>
                      <p className="text-muted-foreground text-xs">Bảo mật SSL 256-bit</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 text-sm">
                    <Truck className="w-5 h-5 text-blue-600 shrink-0" />
                    <div>
                      <p className="font-medium">Phí vận chuyển GHN</p>
                      <p className="text-muted-foreground text-xs">Được tính ở checkout theo địa chỉ giao hàng</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 text-sm">
                    <Heart className="w-5 h-5 text-red-600 shrink-0" />
                    <div>
                      <p className="font-medium">Đổi trả dễ dàng</p>
                      <p className="text-muted-foreground text-xs">Trong vòng 30 ngày</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>}
      </div>
    </div>;
}

function formatCurrency(value) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND"
  }).format(Number(value ?? 0));
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
  CartPage as default
};


