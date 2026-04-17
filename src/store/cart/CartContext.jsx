import { createContext, useContext, useState, useEffect } from "react";
const CartContext = createContext(void 0);
function CartProvider({ children }) {
  const [items, setItems] = useState(() => {
    try {
      const saved = localStorage.getItem("cart");
      if (!saved) return [];
      const parsed = JSON.parse(saved);
      if (!Array.isArray(parsed)) return [];
      const validItems = parsed.filter((item) => {
        return item && item.product && item.product.id && typeof item.quantity === "number" && typeof item.totalPrice === "number" && item.orderType;
      });
      return validItems;
    } catch (error) {
      console.error("Error loading cart from localStorage:", error);
      localStorage.removeItem("cart");
      return [];
    }
  });
  useEffect(() => {
    localStorage.setItem("cart", JSON.stringify(items));
  }, [items]);
  const addItem = (item) => {
    if (!item || !item.product || !item.product.id) {
      console.error("Invalid item structure:", item);
      return;
    }
    setItems((prev) => {
      if (item.orderType === "prescription") {
        return [...prev, { ...item, id: `cart-${Date.now()}-${Math.random()}` }];
      }
      const existing = prev.find(
        (i) => i.product?.id === item.product?.id && i.selectedColor === item.selectedColor && i.orderType === item.orderType
      );
      if (existing) {
        return prev.map(
          (i) => i.id === existing.id ? { ...i, quantity: i.quantity + item.quantity } : i
        );
      }
      return [...prev, { ...item, id: `cart-${Date.now()}-${Math.random()}` }];
    });
  };
  const removeItem = (id) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };
  const updateQuantity = (id, quantity) => {
    if (quantity <= 0) {
      removeItem(id);
      return;
    }
    setItems(
      (prev) => prev.map((item) => item.id === id ? { ...item, quantity } : item)
    );
  };
  const clearCart = () => {
    setItems([]);
  };
  const getTotal = () => {
    return items.reduce((sum, item) => {
      return sum + item.totalPrice * item.quantity;
    }, 0);
  };
  const getItemCount = () => {
    return items.reduce((sum, item) => sum + item.quantity, 0);
  };
  return <CartContext.Provider
    value={{ items, addItem, removeItem, updateQuantity, clearCart, getTotal, getItemCount }}
  >
      {children}
    </CartContext.Provider>;
}
function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within CartProvider");
  }
  return context;
}
export {
  CartProvider,
  useCart
};
