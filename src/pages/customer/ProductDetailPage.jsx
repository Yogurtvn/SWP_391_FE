import { useState } from "react";
import { useParams, Link, useNavigate } from "react-router";
import { Star, Check, ChevronLeft, ChevronRight, ShoppingCart, Zap } from "lucide-react";
import ProductCard from "@/components/product/ProductCard";
import { useCart } from "@/store/cart/CartContext";
import { useCartDrawer } from "@/store/cart/CartDrawerContext";
import { toast } from "sonner";
import { products } from "@/constants/products";
const productImages = [
  "https://images.unsplash.com/photo-1626104853817-343b24b5613f?w=800",
  "https://images.unsplash.com/photo-1654274285614-37cad6007665?w=800",
  "https://images.unsplash.com/photo-1662230177619-e190429b87fd?w=800"
];
function ProductDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addItem } = useCart();
  const { openDrawer } = useCartDrawer();
  const [currentImage, setCurrentImage] = useState(0);
  const [activeTab, setActiveTab] = useState("description");
  const product = products.find((p) => p.id === id);
  if (!product) {
    return <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center">
          <h1 className="mb-4">Không tìm thấy sản phẩm</h1>
          <p className="text-muted-foreground mb-6">
            Sản phẩm bạn đang tìm không tồn tại hoặc đã bị xóa.
          </p>
          <button
      onClick={() => navigate("/shop")}
      className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
    >
            Quay lại cửa hàng
          </button>
        </div>
      </div>;
  }
  const inStock = product.inStock;
  const displayImages = product.images.length > 0 ? product.images : productImages;
  const colors = product.frameSpecs?.colors.map((c) => ({
    name: c.name,
    value: c.name.toLowerCase().replace(/\s+/g, "-"),
    hex: c.hex
  })) || [
    { name: "\u0110en", value: "black", hex: "#000000" },
    { name: "N\xE2u", value: "tortoise", hex: "#8B4513" },
    { name: "Trong Su\u1ED1t", value: "clear", hex: "#E5E7EB" }
  ];
  const [selectedColorValue, setSelectedColorValue] = useState(colors[0]?.value || "black");
  const formatPrice = (price) => {
    return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(price);
  };
  const frameSpecs = product.frameSpecs;
  const nextImage = () => {
    setCurrentImage((prev) => (prev + 1) % displayImages.length);
  };
  const prevImage = () => {
    setCurrentImage((prev) => (prev - 1 + displayImages.length) % displayImages.length);
  };
  const handleAddFrameOnly = () => {
    const colorName = colors.find((c) => c.value === selectedColorValue)?.name || "\u0110en";
    addItem({
      id: `cart-${id}-${selectedColorValue}-${Date.now()}`,
      product,
      quantity: 1,
      orderType: product.inStock ? "regular" : "pre-order",
      selectedColor: colorName,
      totalPrice: product.price
    });
    toast.success("\u0110\xE3 th\xEAm v\xE0o gi\u1ECF h\xE0ng!");
    openDrawer();
  };
  const handleBuyNow = () => {
    const colorName = colors.find((c) => c.value === selectedColorValue)?.name || "\u0110en";
    addItem({
      id: `cart-${id}-${selectedColorValue}-${Date.now()}`,
      product,
      quantity: 1,
      orderType: product.inStock ? "regular" : "pre-order",
      selectedColor: colorName,
      totalPrice: product.price
    });
    toast.success("\u0110\xE3 th\xEAm v\xE0o gi\u1ECF h\xE0ng!");
    navigate("/cart");
  };
  const recommendedProducts = products.filter((p) => p.id !== id && (p.category === product.category || p.type === product.type)).slice(0, 4).map((p) => ({
    id: p.id,
    name: p.name,
    price: p.price,
    image: p.images[0],
    rating: p.rating,
    reviews: p.reviewCount,
    color: p.frameSpecs?.colors[0]?.name || "\u0110en",
    colors: p.frameSpecs?.colors.map((c) => c.hex) || ["#000000"],
    inStock: p.inStock,
    product: p
  }));
  return <div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid md:grid-cols-2 gap-12 mb-20">
          <div>
            <div className="relative aspect-square bg-secondary rounded-2xl overflow-hidden mb-4">
              <img
    src={displayImages[currentImage]}
    alt="Product"
    className="w-full h-full object-cover"
  />
              <button
    onClick={prevImage}
    className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/90 p-2 rounded-full hover:bg-white transition-colors"
  >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <button
    onClick={nextImage}
    className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/90 p-2 rounded-full hover:bg-white transition-colors"
  >
                <ChevronRight className="w-6 h-6" />
              </button>
            </div>
            <div className="flex gap-4">
              {displayImages.map((img, i) => <button
    key={i}
    onClick={() => setCurrentImage(i)}
    className={`w-20 h-20 rounded-lg overflow-hidden border-2 transition-colors ${i === currentImage ? "border-primary" : "border-transparent"}`}
  >
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>)}
            </div>
          </div>

          <div>
            <h1 className="mb-4">{product.name}</h1>
            <div className="flex items-center gap-3 mb-6">
              <div className="flex">
                {[...Array(5)].map((_, i) => <Star
    key={i}
    className={`w-5 h-5 ${i < Math.floor(product.rating || 0) ? "fill-primary text-primary" : "text-gray-300"}`}
  />)}
              </div>
              <span className="text-sm text-muted-foreground">
                ({product.reviewCount || 0} đánh giá)
              </span>
            </div>

            <div className="flex items-center gap-3 mb-6">
              <p className="text-3xl">{formatPrice(product.price)}</p>
              {product.originalPrice && <p className="text-xl text-muted-foreground line-through">
                  {formatPrice(product.originalPrice)}
                </p>}
            </div>

            <div className="mb-6">
              <label className="block mb-3">Màu sắc</label>
              <div className="flex gap-3 flex-wrap">
                {colors.map((color) => <button
    key={color.value}
    onClick={() => setSelectedColorValue(color.value)}
    title={color.name}
    className={`relative w-12 h-12 rounded-lg border-2 transition-colors ${selectedColorValue === color.value ? "border-primary" : "border-border"}`}
    style={{ backgroundColor: color.hex }}
  >
                    {selectedColorValue === color.value && <Check className="absolute inset-0 m-auto w-5 h-5 text-white drop-shadow-md" />}
                  </button>)}
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                {colors.find((c) => c.value === selectedColorValue)?.name}
              </p>
            </div>

            {frameSpecs && <div className="mb-6 p-4 bg-secondary rounded-lg">
                <p className="text-sm mb-2">Thông Số Gọng</p>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Rộng</p>
                    <p>{frameSpecs.frameWidth}mm</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Cầu</p>
                    <p>{frameSpecs.bridgeWidth}mm</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Càng</p>
                    <p>{frameSpecs.templeLength}mm</p>
                  </div>
                </div>
              </div>}

            {
    /* Trạng thái hàng */
  }
            <div className="mb-6">
              {inStock ? <div className="flex items-center gap-2 text-sm text-green-600">
                  <Check className="w-4 h-4" />
                  <span>Còn hàng - Giao hàng trong 2-3 ngày</span>
                </div> : <div className="flex items-center gap-2 text-sm text-orange-600">
                  <Star className="w-4 h-4" />
                  <span>Hết hàng - Cho phép đặt trước</span>
                </div>}
            </div>

            {
    /* Nút hành động */
  }
            <div className="space-y-3">
              {inStock ? <>
                  <button
    onClick={handleBuyNow}
    className="w-full py-4 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 group"
  >
                    <Zap className="w-5 h-5 group-hover:scale-110 transition-transform" />
                    <span>Mua Ngay - {formatPrice(product.price)}</span>
                  </button>
                  <button
    onClick={handleAddFrameOnly}
    className="w-full py-4 border-2 border-primary text-primary rounded-lg hover:bg-primary/5 transition-colors flex items-center justify-center gap-2"
  >
                    <ShoppingCart className="w-5 h-5" />
                    <span>Thêm Vào Giỏ</span>
                  </button>
                </> : <Link
    to={`/preorder/${id}`}
    className="block w-full py-4 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors text-center"
  >
                  Đặt Trước
                </Link>}
              <button
    onClick={() => navigate(`/prescription/${id}`)}
    className="w-full py-4 border border-border rounded-lg hover:bg-secondary transition-colors"
  >
                Chọn Tròng Kính (Gọng + Tròng)
              </button>
            </div>
          </div>
        </div>

        <div className="mb-20">
          <div className="border-b border-border mb-8">
            <div className="flex gap-8">
              {[
    { key: "description", label: "M\xF4 t\u1EA3" },
    { key: "reviews", label: "\u0110\xE1nh gi\xE1" },
    { key: "specifications", label: "Th\xF4ng s\u1ED1" }
  ].map((tab) => <button
    key={tab.key}
    onClick={() => setActiveTab(tab.key)}
    className={`pb-4 border-b-2 transition-colors ${activeTab === tab.key ? "border-primary text-primary" : "border-transparent text-muted-foreground"}`}
  >
                  {tab.label}
                </button>)}
            </div>
          </div>

          {activeTab === "description" && <div className="max-w-3xl">
              <p className="text-foreground/80 mb-4">
                {product.description}
              </p>
              {product.tags && product.tags.length > 0 && <div className="flex flex-wrap gap-2 mt-6">
                  {product.tags.map((tag, i) => <span
    key={i}
    className="px-3 py-1 bg-secondary text-sm rounded-full"
  >
                      {tag}
                    </span>)}
                </div>}
              {product.includedLenses && <div className="mt-6 p-4 bg-accent/10 border border-accent/20 rounded-lg">
                  <p className="mb-2">
                    <strong>Tròng kính đi kèm:</strong>
                  </p>
                  <p className="text-sm text-foreground/80">
                    {product.includedLenses.description}
                  </p>
                </div>}
            </div>}

          {activeTab === "reviews" && <div className="max-w-3xl space-y-6">
              {[
    { name: "Nguy\u1EC5n V\u0103n A", review: "Ch\u1EA5t l\u01B0\u1EE3ng v\xE0 \u0111\u1ED9 v\u1EEBa v\u1EB7n tuy\u1EC7t v\u1EDDi. R\u1EA5t tho\u1EA3i m\xE1i khi \u0111eo c\u1EA3 ng\xE0y." },
    { name: "Tr\u1EA7n Th\u1ECB B", review: "S\u1EA3n ph\u1EA9m \u0111\u1EB9p, giao h\xE0ng nhanh. R\u1EA5t h\xE0i l\xF2ng v\u1EDBi mua h\xE0ng n\xE0y." },
    { name: "L\xEA V\u0103n C", review: "Thi\u1EBFt k\u1EBF sang tr\u1ECDng, ph\xF9 h\u1EE3p cho c\xF4ng s\u1EDF. R\u1EA5t \u0111\xE1ng ti\u1EC1n." }
  ].map((item, i) => <div key={i} className="pb-6 border-b border-border last:border-0">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="flex">
                      {[...Array(5)].map((_, j) => <Star key={j} className="w-4 h-4 fill-primary text-primary" />)}
                    </div>
                    <span className="text-sm">{item.name}</span>
                  </div>
                  <p className="text-foreground/80">
                    {item.review}
                  </p>
                </div>)}
            </div>}

          {activeTab === "specifications" && frameSpecs && <div className="max-w-3xl">
              <table className="w-full">
                <tbody className="divide-y divide-border">
                  <tr>
                    <td className="py-3 text-muted-foreground">Chất liệu</td>
                    <td className="py-3 capitalize">
                      {frameSpecs.material === "titanium" && "Titan"}
                      {frameSpecs.material === "acetate" && "Acetate"}
                      {frameSpecs.material === "metal" && "Kim lo\u1EA1i"}
                      {frameSpecs.material === "tr90" && "TR90"}
                      {!["titanium", "acetate", "metal", "tr90"].includes(frameSpecs.material) && frameSpecs.material}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-3 text-muted-foreground">Chiều rộng gọng</td>
                    <td className="py-3">{frameSpecs.frameWidth}mm</td>
                  </tr>
                  <tr>
                    <td className="py-3 text-muted-foreground">Chiều rộng tròng</td>
                    <td className="py-3">{frameSpecs.lensWidth}mm</td>
                  </tr>
                  <tr>
                    <td className="py-3 text-muted-foreground">Chiều cao tròng</td>
                    <td className="py-3">{frameSpecs.lensHeight}mm</td>
                  </tr>
                  <tr>
                    <td className="py-3 text-muted-foreground">Cầu kính</td>
                    <td className="py-3">{frameSpecs.bridgeWidth}mm</td>
                  </tr>
                  <tr>
                    <td className="py-3 text-muted-foreground">Chiều dài càng</td>
                    <td className="py-3">{frameSpecs.templeLength}mm</td>
                  </tr>
                  <tr>
                    <td className="py-3 text-muted-foreground">Trọng lượng</td>
                    <td className="py-3">{frameSpecs.weight}g</td>
                  </tr>
                </tbody>
              </table>
            </div>}
        </div>

        <div>
          <h2 className="mb-8">Sản Phẩm Tương Tự</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {recommendedProducts.map((product2) => <ProductCard key={product2.id} {...product2} />)}
          </div>
        </div>
      </div>
    </div>;
}
export {
  ProductDetailPage as default
};
