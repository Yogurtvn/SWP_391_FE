import { useState } from "react";
import { Filter, X, Plus, User, Users, Type } from "lucide-react";
import { products } from "@/constants/products";
import { Link } from "react-router";
import { motion } from "motion/react";
import { Checkbox } from "@/components/common/ui/checkbox";
function ShopPage() {
  const [showFilters, setShowFilters] = useState(false);
  const [expandedSections, setExpandedSections] = useState(
    /* @__PURE__ */ new Set(["type", "category", "availability"])
  );
  const [filters, setFilters] = useState({
    types: [],
    categories: [],
    inStockOnly: false,
    preOrderOnly: false,
    priceRange: [0, 3e6],
    brands: []
  });
  const toggleSection = (section) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };
  const toggleType = (type) => {
    setFilters((prev) => ({
      ...prev,
      types: prev.types.includes(type) ? prev.types.filter((t) => t !== type) : [...prev.types, type]
    }));
  };
  const toggleCategory = (category) => {
    setFilters((prev) => ({
      ...prev,
      categories: prev.categories.includes(category) ? prev.categories.filter((c) => c !== category) : [...prev.categories, category]
    }));
  };
  const toggleBrand = (brand) => {
    setFilters((prev) => ({
      ...prev,
      brands: prev.brands.includes(brand) ? prev.brands.filter((b) => b !== brand) : [...prev.brands, brand]
    }));
  };
  const brands = Array.from(new Set(products.map((p) => p.brand)));
  const filteredProducts = products.filter((product) => {
    const productPrice = resolveShopProductPrice(product);
    if (filters.types.length > 0 && !filters.types.includes(product.type)) return false;
    if (filters.categories.length > 0 && !filters.categories.includes(product.category)) return false;
    if (filters.inStockOnly && !product.inStock) return false;
    if (filters.preOrderOnly && !product.allowPreOrder) return false;
    if (productPrice < filters.priceRange[0] || productPrice > filters.priceRange[1]) return false;
    if (filters.brands.length > 0 && !filters.brands.includes(product.brand)) return false;
    return true;
  });
  const typeLabels = {
    "frame-only": "G\u1ECDng Ri\xEAng",
    "lenses-only": "Tr\xF2ng Ri\xEAng",
    "complete-glasses": "K\xEDnh Ho\xE0n Ch\u1EC9nh",
    "sunglasses": "K\xEDnh R\xE2m/M\xE1t"
  };
  const FilterSection = ({
    title,
    id,
    children
  }) => {
    const isExpanded = expandedSections.has(id);
    return <div className="border-b border-border pb-4">
        <button
      onClick={() => toggleSection(id)}
      className="w-full flex items-center justify-between py-2 hover:text-primary transition-colors group"
    >
          <span className="font-semibold">{title}</span>
          <Plus className={`w-4 h-4 transition-transform duration-200 ${isExpanded ? "rotate-45" : ""}`} />
        </button>
        <motion.div
      initial={false}
      animate={{ height: isExpanded ? "auto" : 0, opacity: isExpanded ? 1 : 0 }}
      transition={{ duration: 0.2 }}
      className="overflow-hidden"
    >
          <div className="mt-3 space-y-3">{children}</div>
        </motion.div>
      </div>;
  };
  return <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {
    /* Header */
  }
        <div className="mb-8">
          <h1 className="text-3xl mb-2">Cửa Hàng Kính Mắt</h1>
          <p className="text-muted-foreground">
            Hiển thị {filteredProducts.length} sản phẩm
          </p>
        </div>

        <div className="flex gap-8">
          {
    /* Filters Sidebar */
  }
          <aside className={`
            ${showFilters ? "block" : "hidden"} lg:block
            fixed lg:static inset-0 z-50 lg:z-0
            bg-white lg:bg-transparent
            w-full lg:w-64 shrink-0
            overflow-y-auto lg:overflow-visible
            p-6 lg:p-0
          `}>
            {
    /* Mobile Filter Header */
  }
            <div className="lg:hidden flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold">Bộ Lọc</h2>
              <button
    onClick={() => setShowFilters(false)}
    className="p-2 hover:bg-secondary rounded"
  >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-6">
              {
    /* Product Type */
  }
              <FilterSection title="Loại Sản Phẩm" id="type">
                {Object.keys(typeLabels).map((type) => <label key={type} className="flex items-center gap-3 cursor-pointer group">
                    <Checkbox
    checked={filters.types.includes(type)}
    onCheckedChange={() => toggleType(type)}
  />
                    <Type className="w-4 h-4 text-amber-600 group-hover:text-amber-700 transition-colors" />
                    <span className="text-sm text-gray-700 group-hover:text-amber-700 transition-colors">{typeLabels[type]}</span>
                  </label>)}
              </FilterSection>

              {
    /* Category - Chỉ Nam/Nữ */
  }
              <FilterSection title="Giới Tính" id="category">
                <label className="flex items-center gap-3 cursor-pointer group">
                  <Checkbox
    checked={filters.categories.includes("men")}
    onCheckedChange={() => toggleCategory("men")}
  />
                  <User className="w-4 h-4 text-blue-600 group-hover:text-blue-700 transition-colors" />
                  <span className="text-sm font-medium text-blue-600 group-hover:text-blue-700 transition-colors">Nam</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer group">
                  <Checkbox
    checked={filters.categories.includes("women")}
    onCheckedChange={() => toggleCategory("women")}
  />
                  <Users className="w-4 h-4 text-pink-600 group-hover:text-pink-700 transition-colors" />
                  <span className="text-sm font-medium text-pink-600 group-hover:text-pink-700 transition-colors">Nữ</span>
                </label>
              </FilterSection>

              {
    /* Availability */
  }
              <FilterSection title="Tình Trạng" id="availability">
                <label className="flex items-center gap-3 cursor-pointer">
                  <Checkbox
    checked={filters.inStockOnly}
    onCheckedChange={(checked) => setFilters((prev) => ({ ...prev, inStockOnly: checked }))}
  />
                  <span className="text-sm">Chỉ hàng có sẵn</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <Checkbox
    checked={filters.preOrderOnly}
    onCheckedChange={(checked) => setFilters((prev) => ({ ...prev, preOrderOnly: checked }))}
  />
                  <span className="text-sm">Chỉ Pre-order</span>
                </label>
              </FilterSection>

              {
    /* Brands */
  }
              <FilterSection title="Thương Hiệu" id="brands">
                {brands.map((brand) => <label key={brand} className="flex items-center gap-3 cursor-pointer">
                    <Checkbox
    checked={filters.brands.includes(brand)}
    onCheckedChange={() => toggleBrand(brand)}
  />
                    <span className="text-sm">{brand}</span>
                  </label>)}
              </FilterSection>

              {
    /* Clear Filters */
  }
              <button
    onClick={() => setFilters({
      types: [],
      categories: [],
      inStockOnly: false,
      preOrderOnly: false,
      priceRange: [0, 3e6],
      brands: []
    })}
    className="w-full py-2 text-sm text-primary hover:underline"
  >
                Xóa Tất Cả Bộ Lọc
              </button>
            </div>
          </aside>

          {
    /* Products Grid */
  }
          <div className="flex-1">
            {
    /* Mobile Filter Toggle */
  }
            <button
    onClick={() => setShowFilters(true)}
    className="lg:hidden mb-4 flex items-center gap-2 px-4 py-2 border border-border rounded hover:bg-secondary transition-colors"
  >
              <Filter className="w-4 h-4" />
              <span>Bộ Lọc</span>
            </button>

            {filteredProducts.length === 0 ? <div className="text-center py-12">
                <p className="text-muted-foreground">Không tìm thấy sản phẩm phù hợp</p>
              </div> : <div className="grid grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProducts.map((product, index) => <ProductCard key={product.id} product={product} index={index} />)}
              </div>}
          </div>
        </div>
      </div>

      {
    /* Mobile Filter Backdrop */
  }
      {showFilters && <div
    className="lg:hidden fixed inset-0 bg-black/50 z-40"
    onClick={() => setShowFilters(false)}
  />}
    </div>;
}
function ProductCard({ product, index }) {
  const formatPrice = (price) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND"
    }).format(price);
  };
  const getStockBadge = () => {
    if (product.inStock) {
      return <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded">Có sẵn</span>;
    }
    if (product.allowPreOrder) {
      return <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">Pre-order</span>;
    }
    return <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">Hết hàng</span>;
  };
  return <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: index * 0.05 }}
  >
      <Link
    to={`/product/${product.id}`}
    className="group block bg-white border border-border rounded-lg overflow-hidden hover:shadow-lg transition-shadow"
  >
        {
    /* Image */
  }
        <div className="relative aspect-square bg-secondary overflow-hidden">
          <img
    src={product.images[0]}
    alt={product.name}
    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
  />
          {product.isPremium && <div className="absolute top-2 left-2 px-2 py-1 bg-amber-500 text-white text-xs font-semibold rounded">
              PREMIUM
            </div>}
          {product.originalPrice && <div className="absolute top-2 right-2 px-2 py-1 bg-red-500 text-white text-xs font-semibold rounded">
              SALE
            </div>}
        </div>

        {
    /* Content */
  }
        <div className="p-4">
          <div className="mb-2">{getStockBadge()}</div>
          
          <h3 className="font-semibold mb-1 group-hover:text-primary transition-colors line-clamp-2">
            {product.name}
          </h3>
          
          <p className="text-xs text-muted-foreground mb-2">{product.brand}</p>
          
          <div className="flex items-baseline gap-2">
            <span className="text-lg font-bold text-primary">
              {formatPrice(resolveShopProductPrice(product))}
            </span>
            {product.originalPrice && <span className="text-sm text-muted-foreground line-through">
                {formatPrice(product.originalPrice)}
              </span>}
          </div>
        </div>
      </Link>
    </motion.div>;
}
export {
  ShopPage as default
};

function resolveShopProductPrice(product) {
  const candidates = [
    product?.basePrice,
    product?.product?.basePrice,
    product?.price,
    product?.product?.price,
  ];

  for (const candidate of candidates) {
    const normalizedPrice = Number(candidate);
    if (Number.isFinite(normalizedPrice) && normalizedPrice >= 0) {
      return normalizedPrice;
    }
  }

  return 0;
}
