import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/common/ui/sheet";
import { useCart } from "@/store/cart/CartContext";
import { Trash2, Plus, Minus, ShoppingBag, X } from "lucide-react";
import { useNavigate } from "react-router";
import { toast } from "sonner";

interface CartDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function CartDrawer({ open, onOpenChange }: CartDrawerProps) {
  const navigate = useNavigate();
  const { items, removeItem, updateQuantity, getTotal } = useCart();

  const handleUpdateQuantity = (id: string, change: number) => {
    const item = items.find((i) => i.id === id);
    if (item) {
      const newQuantity = Math.max(1, item.quantity + change);
      updateQuantity(id, newQuantity);
    }
  };

  const handleRemoveItem = (id: string) => {
    removeItem(id);
    toast.success("Đã xóa sản phẩm khỏi giỏ hàng");
  };

  const handleCheckout = () => {
    onOpenChange(false);
    navigate("/checkout");
  };

  const subtotal = getTotal();
  const shipping = subtotal > 100 ? 0 : 10;
  const total = subtotal + shipping;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-lg p-0 flex flex-col">
        {/* Header */}
        <SheetHeader className="px-6 py-4 border-b border-border">
          <SheetDescription className="sr-only">
            Xem và quản lý các sản phẩm trong giỏ hàng của bạn
          </SheetDescription>
          <div className="flex items-center justify-between">
            <SheetTitle className="text-xl">
              Giỏ Hàng ({items.length})
            </SheetTitle>
            <button
              onClick={() => onOpenChange(false)}
              className="rounded-full p-1 hover:bg-secondary transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </SheetHeader>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-12">
              <ShoppingBag className="w-16 h-16 text-muted-foreground opacity-50 mb-4" />
              <p className="text-muted-foreground mb-6">
                Giỏ hàng của bạn đang trống
              </p>
              <button
                onClick={() => {
                  onOpenChange(false);
                  navigate("/shop");
                }}
                className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
              >
                Khám Phá Sản Phẩm
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Free Shipping Progress */}
              {subtotal < 100 && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
                  <p className="text-xs text-amber-900 mb-2">
                    Thêm{" "}
                    <span className="font-semibold">
                      ${(100 - subtotal).toFixed(2)}
                    </span>{" "}
                    nữa để được miễn phí vận chuyển!
                  </p>
                  <div className="w-full bg-amber-200 rounded-full h-1.5">
                    <div
                      className="bg-amber-600 h-1.5 rounded-full transition-all"
                      style={{
                        width: `${Math.min((subtotal / 100) * 100, 100)}%`,
                      }}
                    />
                  </div>
                </div>
              )}

              {/* Cart Items */}
              {items.map((item) => {
                return (
                  <div
                    key={item.id}
                    className="flex gap-4 p-4 bg-secondary rounded-lg"
                  >
                    {/* Product Image */}
                    <div className="w-20 h-20 bg-white rounded-lg overflow-hidden shrink-0">
                      <img
                        src={item.product.images[0]}
                        alt={item.product.name}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    {/* Product Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start gap-2 mb-2">
                        <h4 className="text-sm font-medium line-clamp-1">
                          {item.product.name}
                        </h4>
                        <button
                          onClick={() => handleRemoveItem(item.id)}
                          className="text-muted-foreground hover:text-destructive transition-colors shrink-0"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="space-y-1 text-xs text-muted-foreground mb-2">
                        {item.selectedColor && <p>Màu: {item.selectedColor}</p>}
                        {item.prescriptionDetails ? (
                          <>
                            <p>Tròng: {item.prescriptionDetails.lensType}</p>
                            <p className="text-amber-600">• Theo đơn thuốc</p>
                          </>
                        ) : item.orderType === 'pre-order' ? (
                          <p className="text-blue-600">• Pre-order</p>
                        ) : (
                          <p className="text-green-600">• Hàng có sẵn</p>
                        )}
                      </div>

                      <div className="flex items-center justify-between">
                        {/* Quantity Controls */}
                        <div className="flex items-center gap-2 bg-white rounded-lg px-2 py-1">
                          <button
                            onClick={() => handleUpdateQuantity(item.id, -1)}
                            className="w-5 h-5 flex items-center justify-center hover:text-primary transition-colors"
                            disabled={item.quantity <= 1}
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="w-6 text-center text-sm font-medium">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => handleUpdateQuantity(item.id, 1)}
                            className="w-5 h-5 flex items-center justify-center hover:text-primary transition-colors"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>

                        {/* Price */}
                        <p className="text-sm font-semibold text-primary">
                          {new Intl.NumberFormat('vi-VN', {
                            style: 'currency',
                            currency: 'VND',
                          }).format(item.totalPrice * item.quantity)}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="border-t border-border px-6 py-4 space-y-4 bg-secondary">
            {/* Price Summary */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Tạm tính</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Vận chuyển</span>
                {shipping === 0 ? (
                  <span className="text-green-600 font-medium">Miễn phí</span>
                ) : (
                  <span>${shipping.toFixed(2)}</span>
                )}
              </div>
              <div className="border-t border-border pt-2 flex justify-between items-center">
                <span className="font-semibold">Tổng cộng</span>
                <span className="text-xl font-bold text-primary">
                  ${total.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Checkout Buttons */}
            <div className="space-y-2">
              <button
                onClick={handleCheckout}
                className="w-full py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-medium"
              >
                Thanh Toán
              </button>
              <button
                onClick={() => {
                  onOpenChange(false);
                  navigate("/cart");
                }}
                className="w-full py-3 border border-border rounded-lg hover:bg-white transition-colors text-sm"
              >
                Xem Chi Tiết Giỏ Hàng
              </button>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}