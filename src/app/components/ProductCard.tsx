import { Link, useNavigate } from "react-router";
import { Heart, ShoppingCart, Zap } from "lucide-react";
import { useCart } from "../context/CartContext";
import { useCartDrawer } from "../context/CartDrawerContext";
import { toast } from "sonner";
import { Product } from "../types/product";

interface ProductCardProps {
  id: string;
  name: string;
  price: number;
  image: string;
  rating?: number;
  reviews?: number;
  color?: string;
  colors?: string[];
  inStock?: boolean;
  product?: Product; // Add full product data if available
}

export default function ProductCard({ 
  id, 
  name, 
  price, 
  image, 
  rating,
  reviews,
  color = "Black", 
  colors = ["#000000", "#8B4513", "#D4AF37"],
  inStock = true,
  product
}: ProductCardProps) {
  const navigate = useNavigate();
  const { addItem } = useCart();
  const { openDrawer } = useCartDrawer();

  const handleQuickBuy = (e: React.MouseEvent) => {
    e.preventDefault();
    if (inStock && product) {
      addItem({
        id: `cart-${id}-${color}-${Date.now()}`,
        product: product,
        quantity: 1,
        orderType: product.inStock ? 'regular' : 'pre-order',
        selectedColor: color,
        totalPrice: product.price,
      });
      toast.success("Đã thêm vào giỏ hàng!");
      openDrawer();
    } else if (inStock) {
      // Fallback for cards without full product data
      toast.error("Vui lòng xem chi tiết sản phẩm để mua hàng");
    }
  };

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    if (inStock && product) {
      addItem({
        id: `cart-${id}-${color}-${Date.now()}`,
        product: product,
        quantity: 1,
        orderType: product.inStock ? 'regular' : 'pre-order',
        selectedColor: color,
        totalPrice: product.price,
      });
      toast.success("Đã thêm vào giỏ hàng!");
    } else if (inStock) {
      // Fallback for cards without full product data
      toast.error("Vui lòng xem chi tiết sản phẩm để mua hàng");
    }
  };

  return (
    <div className="group relative">
      <Link to={`/product/${id}`} className="block">
        <div className="relative aspect-[4/3] overflow-hidden mb-3 rounded-lg">
          <img
            src={image}
            alt={name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
          
          {/* Stock Badge */}
          <div className="absolute top-3 left-3">
            {inStock ? (
              <span className="px-2 py-1 bg-green-500 text-white text-xs rounded-md">
                Còn hàng
              </span>
            ) : (
              <span className="px-2 py-1 bg-orange-500 text-white text-xs rounded-md">
                Hết hàng
              </span>
            )}
          </div>

          {/* Quick Actions */}
          <div className="absolute bottom-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={(e) => {
                e.preventDefault();
              }}
              className="w-9 h-9 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white shadow-md hover:scale-110 transition-transform"
              title="Thêm vào yêu thích"
            >
              <Heart className="w-4 h-4 text-foreground" />
            </button>
            {inStock && (
              <button
                onClick={handleAddToCart}
                className="w-9 h-9 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-primary hover:text-white shadow-md hover:scale-110 transition-all"
                title="Thêm vào giỏ"
              >
                <ShoppingCart className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
        
        <h3 className="text-sm mb-1 text-foreground line-clamp-1" style={{ fontWeight: 400 }}>
          {name}
        </h3>
        <p className="text-sm mb-1" style={{ fontWeight: 600 }}>${price.toFixed(2)}</p>
        <p className="text-xs text-muted-foreground mb-2">{color}</p>
        
        <div className="flex items-center gap-1.5 mb-3">
          {colors.map((c, i) => (
            <div
              key={i}
              className="w-4 h-4 rounded-full border border-border"
              style={{ backgroundColor: c }}
            />
          ))}
        </div>
      </Link>
      
      {/* Quick Buy Button */}
      {inStock ? (
        <button
          onClick={handleQuickBuy}
          className="w-full py-2 text-sm bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 group/btn"
          style={{ fontWeight: 500 }}
        >
          <Zap className="w-4 h-4 group-hover/btn:scale-110 transition-transform" />
          Mua Ngay
        </button>
      ) : (
        <Link
          to={`/preorder/${id}`}
          className="block w-full py-2 text-sm text-center bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
          style={{ fontWeight: 500 }}
        >
          Đặt Trước
        </Link>
      )}
    </div>
  );
}