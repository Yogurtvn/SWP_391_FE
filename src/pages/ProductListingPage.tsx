import { useState } from "react";
import { useParams, Link } from "react-router";
import FilterSidebar from "@/components/product/FilterSidebar";
import ProductCard from "@/components/product/ProductCard";
import { ChevronDown } from "lucide-react";
import { products } from "@/constants/products";

// Map products to ProductCard format
const allProducts = products.map(p => ({
  id: p.id,
  name: p.name,
  price: p.price,
  image: p.images[0],
  color: p.frameSpecs?.colors[0]?.name || "Đen",
  colors: p.frameSpecs?.colors.map(c => c.hex) || ["#000000"],
  inStock: p.inStock,
  product: p, // Include full product data
}));

export default function ProductListingPage() {
  const { category } = useParams();
  const [sortBy, setSortBy] = useState("relevance");

  const categoryName = category
    ? category.charAt(0).toUpperCase() + category.slice(1)
    : "Kính Râm";

  return (
    <div className="bg-white">
      <div className="max-w-[1400px] mx-auto px-6 py-8">
        <div className="flex gap-12">
          <FilterSidebar />

          <div className="flex-1">
            <div className="flex items-center justify-end mb-6">
              <button className="flex items-center gap-2 text-sm text-foreground">
                <span>Sắp xếp: {sortBy === "relevance" ? "Phù hợp nhất" : sortBy}</span>
                <ChevronDown className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-[#F5F1E8] rounded-sm p-8 mb-8 flex items-center justify-between">
              <div className="flex-1">
                <h2 className="text-2xl mb-2" style={{ fontWeight: 700 }}>
                  Mua 1 Tặng 1 Miễn Phí
                </h2>
                <h3 className="text-xl mb-4" style={{ fontWeight: 600 }}>
                  + GIẢM THÊM 20%
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Nhập mã: <span className="text-foreground" style={{ fontWeight: 600 }}>BOGO20</span>
                </p>
                <Link
                  to="/shop"
                  className="inline-block text-sm text-primary hover:underline"
                  style={{ fontWeight: 600 }}
                >
                  Mua ngay →
                </Link>
              </div>
              <div className="w-48 h-48 rounded-full overflow-hidden flex items-center justify-center">
                <img
                  src="https://images.unsplash.com/photo-1764740113465-dc9e6b28cc9e?crop=center&fit=crop&w=300&h=300"
                  alt="Promotion"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-x-6 gap-y-10">
              {allProducts.map((product) => (
                <ProductCard key={product.id} {...product} />
              ))}
            </div>

            <div className="mt-12 flex justify-center">
              <button className="px-6 py-2 text-sm border border-border rounded-full hover:bg-secondary transition-colors">
                Xem thêm
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}