import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { CartItem as CartItemType, Product, OrderType } from "../types/product";

interface CartContextType {
  items: CartItemType[];
  addItem: (item: CartItemType) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  getTotal: () => number;
  getItemCount: () => number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItemType[]>(() => {
    try {
      const saved = localStorage.getItem("cart");
      if (!saved) return [];
      
      const parsed = JSON.parse(saved);
      
      // Validate that items have the correct structure
      if (!Array.isArray(parsed)) return [];
      
      // Filter out invalid items (old format or corrupted data)
      const validItems = parsed.filter((item: any) => {
        return item && 
               item.product && 
               item.product.id && 
               typeof item.quantity === 'number' &&
               typeof item.totalPrice === 'number' &&
               item.orderType;
      });
      
      return validItems;
    } catch (error) {
      console.error("Error loading cart from localStorage:", error);
      // Clear corrupted data
      localStorage.removeItem("cart");
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem("cart", JSON.stringify(items));
  }, [items]);

  const addItem = (item: CartItemType) => {
    // Validate item structure
    if (!item || !item.product || !item.product.id) {
      console.error("Invalid item structure:", item);
      return;
    }

    setItems((prev) => {
      // Kiểm tra item đã tồn tại chưa
      // Với prescription order, mỗi đơn là unique (không merge)
      if (item.orderType === 'prescription') {
        return [...prev, { ...item, id: `cart-${Date.now()}-${Math.random()}` }];
      }
      
      // Với regular và pre-order, kiểm tra product + color
      const existing = prev.find((i) => 
        i.product?.id === item.product?.id && 
        i.selectedColor === item.selectedColor &&
        i.orderType === item.orderType
      );
      
      if (existing) {
        return prev.map((i) =>
          i.id === existing.id 
            ? { ...i, quantity: i.quantity + item.quantity }
            : i
        );
      }
      
      return [...prev, { ...item, id: `cart-${Date.now()}-${Math.random()}` }];
    });
  };

  const removeItem = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const updateQuantity = (id: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(id);
      return;
    }
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, quantity } : item))
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

  return (
    <CartContext.Provider
      value={{ items, addItem, removeItem, updateQuantity, clearCart, getTotal, getItemCount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within CartProvider");
  }
  return context;
}

// Export type for backward compatibility
export type { CartItemType as CartItem };