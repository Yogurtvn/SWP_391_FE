import { Link } from "react-router";
import { ArrowRight, Star, Sparkles, Zap, Clock, Users, User, Sun, Briefcase } from "lucide-react";
import ProductCard from "@/components/product/ProductCard";
import { motion, AnimatePresence } from "motion/react";
import { useState, useEffect } from "react";
import { products } from "@/constants/products";
import { getCatalogProducts } from "@/services/catalogService";
import { resolveColorHex } from "@/utils/color";

const fallbackFeaturedProducts = products
  .filter((p) => Boolean(p.inStock) || Boolean(p.allowPreOrder))
  .slice(0, 4)
  .map((p) => ({
  id: p.id,
  name: p.name,
  price: p.price,
  image: p.images[0],
  color: p.frameSpecs?.colors[0]?.name || "\u0110en",
  subtitle: p.frameSpecs?.colors[0]?.name || "\u0110en",
  colors: p.frameSpecs?.colors.map((c) => c.hex) || ["#000000"],
  inStock: p.inStock,
  canPreOrder: Boolean(p.allowPreOrder),
  isPreOrderAllowed: Boolean(p.allowPreOrder),
  availabilityStatus: p.inStock ? "available" : p.allowPreOrder ? "preorder" : "unavailable",
  product: p,
}));
const categories = [
  {
    name: "G\u1ECDng k\u00EDnh th\u1EDDi trang",
    path: "/shop/ai-glasses",
    image: "https://images.unsplash.com/photo-1749032712013-6f21d1be6a6c?w=600",
    icon: User,
    color: "from-pink-500 to-rose-500"
  },
  {
    name: "G\u1ECDng k\u00EDnh c\u00F4ng s\u1EDF",
    path: "/shop/eyeglasses",
    image: "https://images.unsplash.com/photo-1715418554358-d34e420b18ab?w=600",
    icon: Users,
    color: "from-blue-500 to-indigo-500"
  },
  {
    name: "K\xEDnh R\xE2m",
    path: "/shop/sunglasses",
    image: "https://images.unsplash.com/photo-1681147767903-9011e9bf9e83?w=600",
    icon: Sun,
    color: "from-amber-500 to-orange-500"
  },
  {
    name: "Cao C\u1EA5p",
    path: "/shop/premium",
    image: "https://images.unsplash.com/photo-1599243439680-1af420953c23?w=600",
    icon: Briefcase,
    color: "from-violet-500 to-purple-500"
  }
];
const heroSlides = [
  {
    image: "https://images.unsplash.com/photo-1749032707146-40d374a4108d?w=1920",
    title: "Nh\xECn R\xF5 H\u01A1n, \u0110\u1EB9p H\u01A1n",
    subtitle: "K\xEDnh m\u1EAFt cao c\u1EA5p \u0111\u01B0\u1EE3c thi\u1EBFt k\u1EBF cho phong c\xE1ch ri\xEAng v\xE0 t\u1EA7m nh\xECn ho\xE0n h\u1EA3o c\u1EE7a b\u1EA1n",
    objectPosition: "62% 18%"
  },
  {
    image: "https://images.unsplash.com/photo-1715418554358-d34e420b18ab?w=1920",
    title: "B\u1ED9 S\u01B0u T\u1EADp M\u1EDBi 2026",
    subtitle: "Kh\xE1m ph\xE1 nh\u1EEFng thi\u1EBFt k\u1EBF hi\u1EC7n \u0111\u1EA1i nh\u1EA5t v\u1EDBi c\xF4ng ngh\u1EC7 tr\xF2ng k\xEDnh ti\xEAn ti\u1EBFn",
    objectPosition: "80% 16%"
  },
  {
    image: "https://images.unsplash.com/photo-1749032712013-6f21d1be6a6c?w=1920",
    title: "Phong C\xE1ch C\u1EE7a B\u1EA1n",
    subtitle: "H\xE0ng ngh\xECn m\u1EABu m\xE3 \u0111a d\u1EA1ng, ph\xF9 h\u1EE3p v\u1EDBi m\u1ECDi khu\xF4n m\u1EB7t v\xE0 c\xE1 t\xEDnh",
    objectPosition: "50% 24%"
  }
];
function HomePage() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [featuredProducts, setFeaturedProducts] = useState(fallbackFeaturedProducts);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
    }, 5e3);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    let isActive = true;

    async function loadFeaturedProducts() {
      try {
        const response = await getCatalogProducts({
          page: 1,
          pageSize: 4,
          sortBy: "newest",
          sortOrder: "desc",
        });

        const mappedProducts = (Array.isArray(response?.items) ? response.items : [])
          .map(mapCatalogProductToFeaturedCard)
          .filter(Boolean);

        if (isActive && mappedProducts.length > 0) {
          setFeaturedProducts(mappedProducts);
        }
      } catch {
        // Keep fallback products when API is unavailable.
      }
    }

    void loadFeaturedProducts();

    return () => {
      isActive = false;
    };
  }, []);

  return <div>
      {
    /* Hero Carousel Section */
  }
      <section className="relative h-[85vh] flex items-center overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
    key={currentSlide}
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    transition={{ duration: 0.7 }}
    className="absolute inset-0"
  >
            <img
    src={heroSlides[currentSlide].image}
    alt="Hero slide"
    className="w-full h-full object-cover"
    style={{ objectPosition: heroSlides[currentSlide].objectPosition || "50% 50%" }}
  />
            <div className="absolute inset-0 bg-gradient-to-r from-black/50 to-transparent" />
          </motion.div>
        </AnimatePresence>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full z-10">
          <AnimatePresence mode="wait">
            <motion.div
    key={`content-${currentSlide}`}
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -20 }}
    transition={{ duration: 0.5 }}
    className="max-w-xl"
  >
              <h1 className="text-5xl lg:text-6xl text-white mb-6">
                {heroSlides[currentSlide].title}
              </h1>
              <p className="text-xl text-white/90 mb-8">
                {heroSlides[currentSlide].subtitle}
              </p>
              <Link
    to="/shop"
    className="inline-flex items-center gap-2 px-8 py-4 bg-primary text-white rounded hover:bg-primary/90 transition-colors"
  >
                Mua Ngay
                <ArrowRight className="w-5 h-5" />
              </Link>
            </motion.div>
          </AnimatePresence>
        </div>

        {
    /* Slide Indicators */
  }
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2 z-10">
          {heroSlides.map((_, index) => <button
    key={index}
    onClick={() => setCurrentSlide(index)}
    className={`w-2 h-2 rounded-full transition-all ${index === currentSlide ? "bg-white w-8" : "bg-white/50 hover:bg-white/75"}`}
    aria-label={`Go to slide ${index + 1}`}
  />)}
        </div>
      </section>

      {
    /* CTA Promotion Banner - Compact Design */
  }
      <section className="relative overflow-hidden bg-gradient-to-r from-amber-500 via-orange-600 to-red-600 py-6">
        <div className="absolute inset-0 overflow-hidden">
          <motion.div
    animate={{
      x: [0, 100, 0],
      y: [0, -50, 0]
    }}
    transition={{
      duration: 15,
      repeat: Infinity,
      ease: "linear"
    }}
    className="absolute top-0 left-0 w-64 h-64 bg-white/10 rounded-full blur-3xl"
  />
          <motion.div
    animate={{
      x: [0, -100, 0],
      y: [0, 50, 0]
    }}
    transition={{
      duration: 12,
      repeat: Infinity,
      ease: "linear"
    }}
    className="absolute bottom-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl"
  />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
            {
    /* Left side - Main message */
  }
            <div className="flex items-center gap-4">
              <div className="hidden sm:flex w-16 h-16 bg-yellow-400 rounded-full items-center justify-center shrink-0">
                <Sparkles className="w-8 h-8 text-amber-900" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="inline-block px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-xs font-bold text-white">
                    KHUYẾN MÃI ĐẶC BIỆT
                  </span>
                  <div className="flex items-center gap-2 text-white/90 text-sm">
                    <Clock className="w-4 h-4" />
                    <span>Còn 6 ngày 14:32:18</span>
                  </div>
                </div>
                <h3 className="text-2xl lg:text-3xl font-bold text-white">
                  Giảm <span className="text-yellow-300">30%</span> Tròng Kính Cận + Quà Tặng Miễn Phí
                </h3>
                <p className="text-white/90 text-sm mt-1">
                  Áp dụng khi mua kèm gọng kính - Flash Sale cho 50 đơn đầu tiên
                </p>
              </div>
            </div>

            {
    /* Right side - CTAs */
  }
            <div className="flex flex-col sm:flex-row gap-3 shrink-0">
              <Link
    to="/shop/prescription"
    className="inline-flex items-center gap-2 px-6 py-3 bg-white text-amber-600 rounded-lg hover:bg-white/90 transition-all shadow-lg hover:scale-105 font-semibold whitespace-nowrap"
  >
                <Zap className="w-5 h-5" />
                Mua Ngay
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
    to="/shop"
    className="inline-flex items-center gap-2 px-6 py-3 bg-white/10 backdrop-blur-sm text-white rounded-lg hover:bg-white/20 transition-all border-2 border-white/30 font-semibold whitespace-nowrap"
  >
                Xem Chi Tiết
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-secondary">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-center mb-12">Mua Theo Danh Mục</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {categories.map((category, index) => {
    const Icon = category.icon;
    return <motion.div
      key={category.path}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.1 }}
    >
                  <Link
      to={category.path}
      className="group relative aspect-square rounded-2xl overflow-hidden block"
    >
                    {
      /* Background Image */
    }
                    <img
      src={category.image}
      alt={category.name}
      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
    />
                    
                    {
      /* Gradient Overlay */
    }
                    <div className={`absolute inset-0 bg-gradient-to-br ${category.color} opacity-60 group-hover:opacity-70 transition-opacity`} />
                    
                    {
      /* Content */
    }
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-white p-6">
                      {
      /* Icon */
    }
                      <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center mb-4 group-hover:scale-110 group-hover:bg-white/30 transition-all">
                        <Icon className="w-8 h-8" strokeWidth={2} />
                      </div>
                      
                      {
      /* Category Name */
    }
                      <h3 className="text-2xl font-bold tracking-wide" style={{ fontFamily: "system-ui, -apple-system, sans-serif" }}>
                        {category.name}
                      </h3>
                      
                      {
      /* Arrow indicator */
    }
                      <div className="mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                        <ArrowRight className="w-5 h-5" />
                      </div>
                    </div>

                    {
      /* Shine effect on hover */
    }
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                    </div>
                  </Link>
                </motion.div>;
  })}
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-12">
            <h2>Sản Phẩm Nổi Bật</h2>
            <Link to="/shop" className="text-primary hover:underline flex items-center gap-1">
              Xem tất cả
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredProducts.map((product) => <ProductCard key={product.id} {...product} />)}
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-center mb-12">Khách Hàng Nói Gì</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
    {
      name: "Nguy\u1EC5n Th\u1ECB Mai",
      review: "K\xEDnh t\u1ED1t nh\u1EA5t t\xF4i t\u1EEBng s\u1EDF h\u1EEFu. Quy tr\xECnh \u0111o \u0111\u1ED9 r\u1EA5t d\u1EC5 d\xE0ng v\xE0 ch\u1EA5t l\u01B0\u1EE3ng xu\u1EA5t s\u1EAFc.",
      rating: 5,
      avatar: "https://images.unsplash.com/photo-1581065178026-390bc4e78dad?w=200&h=200&fit=crop"
    },
    {
      name: "Tr\u1EA7n V\u0103n Nam",
      review: "Giao h\xE0ng nhanh, d\u1ECBch v\u1EE5 kh\xE1ch h\xE0ng tuy\u1EC7t v\u1EDDi, gi\xE1 c\u1EA3 h\u1EE3p l\xFD. Ch\u1EAFc ch\u1EAFn s\u1EBD \u0111\u1EB7t l\u1EA1i!",
      rating: 5,
      avatar: "https://images.unsplash.com/photo-1738566061505-556830f8b8f5?w=200&h=200&fit=crop"
    },
    {
      name: "L\xEA Th\u1ECB H\u01B0\u01A1ng",
      review: "R\u1EA5t th\xEDch c\xE1c ki\u1EC3u d\xE1ng v\xE0 t\xEDnh n\u0103ng th\u1EED k\xEDnh \u1EA3o. Gi\xFAp vi\u1EC7c ch\u1ECDn k\xEDnh d\u1EC5 d\xE0ng h\u01A1n nhi\u1EC1u.",
      rating: 5,
      avatar: "https://images.unsplash.com/photo-1726067438503-9c9c5d3ebe22?w=200&h=200&fit=crop"
    }
  ].map((testimonial, i) => <motion.div
    key={i}
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ delay: i * 0.1 }}
    className="bg-white border border-border p-8 rounded-2xl shadow-sm hover:shadow-md transition-shadow"
  >
                {
    /* Stars */
  }
                <div className="flex mb-4">
                  {[...Array(testimonial.rating)].map((_, i2) => <Star key={i2} className="w-5 h-5 fill-primary text-primary" />)}
                </div>
                
                {
    /* Review Text */
  }
                <p className="text-foreground/80 mb-6 leading-relaxed">
                  "{testimonial.review}"
                </p>
                
                {
    /* Customer Info with Avatar */
  }
                <div className="flex items-center gap-3">
                  <img
    src={testimonial.avatar}
    alt={testimonial.name}
    className="w-12 h-12 rounded-full object-cover ring-2 ring-primary/20"
  />
                  <div>
                    <p className="font-semibold text-foreground">{testimonial.name}</p>
                    <p className="text-xs text-muted-foreground">Khách hàng thân thiết</p>
                  </div>
                </div>
              </motion.div>)}
          </div>
        </div>
      </section>
    </div>;
}
export {
  HomePage as default
};

function mapCatalogProductToFeaturedCard(item) {
  if (!item) {
    return null;
  }

  if (item.availabilityStatus === "unavailable") {
    return null;
  }

  const colorNames = Array.from(
    new Set((Array.isArray(item.variants) ? item.variants : []).map((variant) => variant?.color).filter(Boolean)),
  );
  const primaryColor = colorNames[0] || "Đen";
  const colorSwatches = colorNames.map(resolveColorHex).filter(Boolean);

  return {
    id: String(item.id ?? item.productId ?? ""),
    name: item.name || "Sản phẩm",
    price: Number(item.price ?? 0),
    basePrice: Number(item.basePrice ?? item.price ?? 0),
    displayPrice: Number(item.displayPrice ?? item.basePrice ?? item.price ?? 0),
    image: item.image,
    color: primaryColor,
    subtitle: primaryColor,
    colors: colorSwatches.length > 0 ? colorSwatches : ["#111827"],
    inStock: Boolean(item.inStock ?? item.isReadyAvailable),
    canPreOrder: Boolean(item.canPreOrder ?? item.isPreOrderAllowed),
    isPreOrderAllowed: Boolean(item.isPreOrderAllowed),
    availabilityStatus: item.availabilityStatus,
    product: item.product ?? item,
  };
}


