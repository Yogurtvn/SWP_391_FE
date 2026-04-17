import { Link, useNavigate } from "react-router";
import { Trash2, Plus, Minus, ShoppingBag, Tag, Shield, Truck, Heart } from "lucide-react";
import { useCart } from "@/store/cart/CartContext";
import { useState } from "react";
import { toast } from "sonner";
function CartPage() {
  const navigate = useNavigate();
  const { items, removeItem, updateQuantity, getTotal } = useCart();
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [savedItems, setSavedItems] = useState([]);
  const handleUpdateQuantity = (id, change) => {
    const item = items.find((i) => i.id === id);
    if (item) {
      const newQuantity = Math.max(1, item.quantity + change);
      updateQuantity(id, newQuantity);
    }
  };
  const handleApplyCoupon = () => {
    if (couponCode.toUpperCase() === "WELCOME10") {
      setAppliedCoupon({ code: "WELCOME10", discount: 10 });
      toast.success("M\xE3 gi\u1EA3m gi\xE1 \u0111\xE3 \u0111\u01B0\u1EE3c \xE1p d\u1EE5ng!");
    } else if (couponCode.toUpperCase() === "SAVE20") {
      setAppliedCoupon({ code: "SAVE20", discount: 20 });
      toast.success("M\xE3 gi\u1EA3m gi\xE1 \u0111\xE3 \u0111\u01B0\u1EE3c \xE1p d\u1EE5ng!");
    } else {
      toast.error("M\xE3 gi\u1EA3m gi\xE1 kh\xF4ng h\u1EE3p l\u1EC7");
    }
  };
  const handleSaveForLater = (id) => {
    setSavedItems([...savedItems, id]);
    removeItem(id);
    toast.success("\u0110\xE3 l\u01B0u s\u1EA3n ph\u1EA9m \u0111\u1EC3 mua sau");
  };
  const subtotal = getTotal();
  const shipping = subtotal > 100 ? 0 : 10;
  const discount = appliedCoupon ? subtotal * appliedCoupon.discount / 100 : 0;
  const total = subtotal + shipping - discount;
  return <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {
    /* Header */
  }
        <div className="mb-8">
          <h1 className="mb-2">Giỏ Hàng</h1>
          <p className="text-muted-foreground">
            {items.length > 0 ? `${items.length} s\u1EA3n ph\u1EA9m` : "Gi\u1ECF h\xE0ng tr\u1ED1ng"}
          </p>
        </div>

        {items.length === 0 ? (
    // Empty Cart
    <div className="text-center py-16 bg-secondary rounded-2xl">
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
          </div>
  ) : <div className="grid lg:grid-cols-3 gap-8">
            {
    /* Cart Items */
  }
            <div className="lg:col-span-2 space-y-4">
              {
    /* Free Shipping Banner */
  }
              {subtotal < 100 && <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
                  <Truck className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm text-amber-900">
                      Thêm <span className="font-semibold">${(100 - subtotal).toFixed(2)}</span> nữa để được miễn phí vận chuyển!
                    </p>
                    <div className="w-full bg-amber-200 rounded-full h-2 mt-2">
                      <div
    className="bg-amber-600 h-2 rounded-full transition-all"
    style={{ width: `${Math.min(subtotal / 100 * 100, 100)}%` }}
  />
                    </div>
                  </div>
                </div>}

              {
    /* Cart Items List */
  }
              <div className="space-y-4">
                {items.map((item) => {
    const itemPrice = item.framePrice + (item.lensPrice || 0);
    return <div
      key={item.id}
      className="bg-white border border-border rounded-xl p-6 hover:shadow-md transition-shadow"
    >
                      <div className="flex gap-6">
                        {
      /* Product Image */
    }
                        <div className="w-32 h-32 bg-secondary rounded-lg overflow-hidden shrink-0">
                          <img
      src={item.image}
      alt={item.name}
      className="w-full h-full object-cover"
    />
                        </div>

                        {
      /* Product Details */
    }
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start gap-4 mb-3">
                            <div>
                              <h3 className="mb-2 text-lg">{item.name}</h3>
                              <div className="space-y-1 text-sm text-muted-foreground">
                                <p className="flex items-center gap-2">
                                  <span className="w-4 h-4 rounded-full border border-border" style={{ backgroundColor: item.color === "\u0110en" ? "#000" : item.color === "Tortoise" ? "#8B4513" : "#E5E7EB" }} />
                                  Màu: {item.color}
                                </p>
                                {item.hasPrescription ? <>
                                    <p>✓ Tròng: {item.lensType}</p>
                                    <p>✓ Gói: {item.lensPackage}</p>
                                  </> : <p className="text-amber-600">• Chỉ gọng (không tròng kính)</p>}
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-xl text-primary mb-1">${itemPrice.toFixed(2)}</p>
                              <p className="text-sm text-muted-foreground">mỗi sản phẩm</p>
                            </div>
                          </div>

                          {
      /* Actions */
    }
                          <div className="flex items-center justify-between pt-3 border-t border-border">
                            <div className="flex items-center gap-4">
                              {
      /* Quantity Controls */
    }
                              <div className="flex items-center gap-3 bg-secondary rounded-lg px-3 py-2">
                                <button
      onClick={() => handleUpdateQuantity(item.id, -1)}
      className="w-6 h-6 flex items-center justify-center hover:text-primary transition-colors"
      disabled={item.quantity <= 1}
    >
                                  <Minus className="w-4 h-4" />
                                </button>
                                <span className="w-8 text-center font-medium">{item.quantity}</span>
                                <button
      onClick={() => handleUpdateQuantity(item.id, 1)}
      className="w-6 h-6 flex items-center justify-center hover:text-primary transition-colors"
    >
                                  <Plus className="w-4 h-4" />
                                </button>
                              </div>
                              <span className="text-sm text-muted-foreground">
                                Tổng: <span className="text-foreground font-semibold">${(itemPrice * item.quantity).toFixed(2)}</span>
                              </span>
                            </div>

                            <div className="flex items-center gap-2">
                              <button
      onClick={() => handleSaveForLater(item.id)}
      className="p-2 text-muted-foreground hover:text-primary hover:bg-secondary rounded-lg transition-colors"
      title="Lưu để mua sau"
    >
                                <Heart className="w-5 h-5" />
                              </button>
                              <button
      onClick={() => {
        removeItem(item.id);
        toast.success("\u0110\xE3 x\xF3a s\u1EA3n ph\u1EA9m kh\u1ECFi gi\u1ECF h\xE0ng");
      }}
      className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
      title="Xóa"
    >
                                <Trash2 className="w-5 h-5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>;
  })}
              </div>

              {
    /* Continue Shopping */
  }
              <Link
    to="/shop"
    className="inline-flex items-center gap-2 text-primary hover:underline"
  >
                ← Tiếp tục mua sắm
              </Link>
            </div>

            {
    /* Order Summary Sidebar */
  }
            <div className="lg:col-span-1">
              <div className="bg-secondary rounded-xl p-6 sticky top-24 space-y-6">
                <h3>Tóm Tắt Đơn Hàng</h3>

                {
    /* Coupon Code */
  }
                <div>
                  <label className="block text-sm mb-2">Mã giảm giá</label>
                  <div className="flex gap-2">
                    <input
    type="text"
    value={couponCode}
    onChange={(e) => setCouponCode(e.target.value)}
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

                {
    /* Price Breakdown */
  }
                <div className="space-y-3 pt-4 border-t border-border">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Tạm tính</span>
                    <span>${subtotal.toFixed(2)}</span>
                  </div>
                  {appliedCoupon && <div className="flex justify-between text-sm text-green-600">
                      <span>Giảm giá ({appliedCoupon.discount}%)</span>
                      <span>-${discount.toFixed(2)}</span>
                    </div>}
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Vận chuyển</span>
                    {shipping === 0 ? <span className="text-green-600 font-medium">Miễn phí</span> : <span>${shipping.toFixed(2)}</span>}
                  </div>
                  <div className="border-t border-border pt-3">
                    <div className="flex justify-between items-center">
                      <span className="text-lg">Tổng cộng</span>
                      <span className="text-2xl text-primary">${total.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                {
    /* Checkout Button */
  }
                <button
    onClick={() => navigate("/checkout")}
    className="w-full py-4 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-medium"
  >
                  Thanh Toán Ngay
                </button>

                {
    /* Trust Badges */
  }
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
                      <p className="font-medium">Miễn phí vận chuyển</p>
                      <p className="text-muted-foreground text-xs">Đơn hàng từ $100</p>
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
export {
  CartPage as default
};
