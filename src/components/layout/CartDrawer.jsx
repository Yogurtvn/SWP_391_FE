import { useNavigate } from "react-router";
import { toast } from "sonner";
import { Minus, Plus, ShoppingBag, Trash2, X } from "lucide-react";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/common/ui/sheet";
import { useCart } from "@/hooks/cart/useCart";

function CartDrawer({ open, onOpenChange }) {
  const navigate = useNavigate();
  const { items, getTotal, isCustomerSession, mutationStatus, removeItem, status, updateQuantity } = useCart();

  const isLoading = status === "loading" && items.length === 0;
  const isMutating = mutationStatus === "loading";
  const subtotal = getTotal();
  const shipping = subtotal > 5e5 ? 0 : 3e4;
  const total = subtotal + shipping;

  async function handleUpdateQuantity(cartItemId, change) {
    const item = items.find((currentItem) => currentItem.cartItemId === cartItemId);

    if (!item) {
      return;
    }

    try {
      await updateQuantity(cartItemId, Math.max(1, item.quantity + change));
    } catch (error) {
      toast.error(resolveErrorMessage(error, "Khong the cap nhat so luong san pham."));
    }
  }

  async function handleRemoveItem(item) {
    try {
      await removeItem(item.cartItemId, item.itemType);
      toast.success("Da xoa san pham khoi gio hang");
    } catch (error) {
      toast.error(resolveErrorMessage(error, "Khong the xoa san pham khoi gio hang."));
    }
  }

  function handleCheckout() {
    onOpenChange(false);
    navigate("/checkout");
  }

  return <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-lg p-0 flex flex-col">
        <SheetHeader className="px-6 py-4 border-b border-border">
          <SheetDescription className="sr-only">
            Xem va quan ly cac san pham trong gio hang cua ban
          </SheetDescription>
          <div className="flex items-center justify-between">
            <SheetTitle className="text-xl">
              Gio Hang ({items.length})
            </SheetTitle>
            <button
              onClick={() => onOpenChange(false)}
              className="rounded-full p-1 hover:bg-secondary transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          {!isCustomerSession ? <GuestCartState onOpenChange={onOpenChange} /> : isLoading ? <LoadingState /> : items.length === 0 ? <EmptyCartState onOpenChange={onOpenChange} /> : <div className="space-y-4">
              {subtotal < 5e5 && <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
                  <p className="text-xs text-amber-900 mb-2">
                    Them{" "}
                    <span className="font-semibold">
                      {formatCurrency(5e5 - subtotal)}
                    </span>{" "}
                    nua de duoc mien phi van chuyen!
                  </p>
                  <div className="w-full bg-amber-200 rounded-full h-1.5">
                    <div
                      className="bg-amber-600 h-1.5 rounded-full transition-all"
                      style={{ width: `${Math.min(subtotal / 5e5 * 100, 100)}%` }}
                    />
                  </div>
                </div>}

              {items.map((item) => <div key={item.cartItemId} className="flex gap-4 p-4 bg-secondary rounded-lg">
                  <div className="w-20 h-20 bg-white rounded-lg overflow-hidden shrink-0">
                    <img
                      src={item.product.images[0]}
                      alt={item.product.name}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start gap-2 mb-2">
                      <h4 className="text-sm font-medium line-clamp-1">
                        {item.product.name}
                      </h4>
                      <button
                        onClick={() => handleRemoveItem(item)}
                        disabled={isMutating}
                        className="text-muted-foreground hover:text-destructive transition-colors shrink-0"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="space-y-1 text-xs text-muted-foreground mb-2">
                      {item.selectedColor && <p>Mau: {item.selectedColor}</p>}
                      {item.size && <p>Size: {item.size}</p>}
                      {item.sku && <p>SKU: {item.sku}</p>}
                      {item.prescriptionDetails ? <>
                          <p>Trong: {item.prescriptionDetails.lensType}</p>
                          <p className="text-amber-600">• Theo don thuoc</p>
                        </> : item.orderType === "preOrder" ? <p className="text-blue-600">• Dat truoc</p> : <p className="text-green-600">• Hang co san</p>}
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 bg-white rounded-lg px-2 py-1">
                        <button
                          onClick={() => handleUpdateQuantity(item.cartItemId, -1)}
                          disabled={item.quantity <= 1 || isMutating}
                          className="w-5 h-5 flex items-center justify-center hover:text-primary transition-colors"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-6 text-center text-sm font-medium">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => handleUpdateQuantity(item.cartItemId, 1)}
                          disabled={isMutating}
                          className="w-5 h-5 flex items-center justify-center hover:text-primary transition-colors"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      <p className="text-sm font-semibold text-primary">
                        {formatCurrency(item.totalPrice)}
                      </p>
                    </div>
                  </div>
                </div>)}
            </div>}
        </div>

        {isCustomerSession && items.length > 0 && <div className="border-t border-border px-6 py-4 space-y-4 bg-secondary">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Tam tinh</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Van chuyen</span>
                {shipping === 0 ? <span className="text-green-600 font-medium">Mien phi</span> : <span>{formatCurrency(shipping)}</span>}
              </div>
              <div className="border-t border-border pt-2 flex justify-between items-center">
                <span className="font-semibold">Tong cong</span>
                <span className="text-xl font-bold text-primary">
                  {formatCurrency(total)}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <button
                onClick={handleCheckout}
                disabled={isMutating}
                className="w-full py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-medium disabled:opacity-60"
              >
                Thanh Toan
              </button>
              <button
                onClick={() => {
                  onOpenChange(false);
                  navigate("/cart");
                }}
                className="w-full py-3 border border-border rounded-lg hover:bg-white transition-colors text-sm"
              >
                Xem Chi Tiet Gio Hang
              </button>
            </div>
          </div>}
      </SheetContent>
    </Sheet>;
}

function GuestCartState({ onOpenChange }) {
  const navigate = useNavigate();

  return <div className="flex flex-col items-center justify-center h-full text-center py-12">
      <ShoppingBag className="w-16 h-16 text-muted-foreground opacity-50 mb-4" />
      <p className="text-muted-foreground mb-6">
        Vui long dang nhap bang tai khoan khach hang de su dung gio hang
      </p>
      <button
        onClick={() => {
          onOpenChange(false);
          navigate("/login");
        }}
        className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
      >
        Dang Nhap
      </button>
    </div>;
}

function LoadingState() {
  return <div className="flex flex-col items-center justify-center h-full text-center py-12">
      <div className="h-10 w-10 rounded-full border-4 border-primary/20 border-t-primary animate-spin mb-4" />
      <p className="text-muted-foreground">Dang tai gio hang...</p>
    </div>;
}

function EmptyCartState({ onOpenChange }) {
  const navigate = useNavigate();

  return <div className="flex flex-col items-center justify-center h-full text-center py-12">
      <ShoppingBag className="w-16 h-16 text-muted-foreground opacity-50 mb-4" />
      <p className="text-muted-foreground mb-6">
        Gio hang cua ban dang trong
      </p>
      <button
        onClick={() => {
          onOpenChange(false);
          navigate("/shop");
        }}
        className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
      >
        Kham Pha San Pham
      </button>
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
  CartDrawer as default
};
