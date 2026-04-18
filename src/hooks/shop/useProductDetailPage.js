import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { useCart } from "@/hooks/cart/useCart";
import { useCartDrawer } from "@/store/cart/CartDrawerContext";
import {
  getCatalogErrorMessage,
  getCatalogProductById,
  getRecommendedCatalogProducts,
} from "@/services/catalogService";
import {
  createCartItemView,
  resolveCartAvailabilityStatus,
  resolvePreferredVariant,
} from "@/services/cartService";
import { products as mockProducts } from "@/constants/products";
import { toast } from "sonner";

export function useProductDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addStandardItem } = useCart();
  const { openDrawer } = useCartDrawer();
  const mockProduct = useMemo(() => mockProducts.find((item) => item.id === id) ?? null, [id]);

  const [product, setProduct] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [currentImage, setCurrentImage] = useState(0);
  const [selectedColor, setSelectedColor] = useState("");
  const [selectedSize, setSelectedSize] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadProduct() {
      setLoading(true);
      setError("");

      try {
        if (mockProduct) {
          const normalizedMockProduct = normalizeMockProduct(mockProduct);
          const mockRecommendations = mockProducts
            .filter((item) => item.id !== mockProduct.id && item.type === mockProduct.type)
            .slice(0, 4)
            .map(mapMockProductToCard);

          if (!isMounted) {
            return;
          }

          setProduct(normalizedMockProduct);
          setRelatedProducts(mockRecommendations);
          return;
        }

        const numericId = Number.parseInt(String(id ?? ""), 10);

        if (!Number.isFinite(numericId) || numericId <= 0) {
          if (!isMounted) {
            return;
          }

          setProduct(null);
          setRelatedProducts([]);
          return;
        }

        const detailProduct = await getCatalogProductById(numericId);
        const recommendations = await getRecommendedCatalogProducts({
          productType: detailProduct.productType,
          excludeProductId: detailProduct.productId,
        });

        if (!isMounted) {
          return;
        }

        setProduct(detailProduct);
        setRelatedProducts(recommendations);
      } catch (loadError) {
        if (!isMounted) {
          return;
        }

        setProduct(null);
        setRelatedProducts([]);
        setError(getCatalogErrorMessage(loadError, "Khong the tai chi tiet san pham."));
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    void loadProduct();

    return () => {
      isMounted = false;
    };
  }, [id, mockProduct]);

  useEffect(() => {
    setCurrentImage(0);
    setSelectedColor(product?.colors?.[0] ?? "");
    setSelectedSize(product?.sizes?.[0] ?? "");
  }, [product]);

  const resolvedVariant = useMemo(() => {
    if (!product) {
      return null;
    }

    const variants = Array.isArray(product.variants) ? product.variants : [];

    if (variants.length === 0) {
      return product.selectedVariant ?? null;
    }

    const exactVariant = variants.find((variant) => {
      const colorMatches = !selectedColor || variant.color === selectedColor;
      const sizeMatches = !selectedSize || variant.size === selectedSize;
      return colorMatches && sizeMatches;
    });

    if (exactVariant) {
      return exactVariant;
    }

    const fallbackByColor = variants.find((variant) => !selectedColor || variant.color === selectedColor);
    return fallbackByColor || resolvePreferredVariant(product);
  }, [product, selectedColor, selectedSize]);

  const resolvedProduct = useMemo(() => {
    if (!product) {
      return null;
    }

    const activeVariant = resolvedVariant ?? product.selectedVariant ?? null;
    const availabilityStatus = activeVariant ? resolveCartAvailabilityStatus(activeVariant) : product.availabilityStatus;

    return {
      ...product,
      selectedVariant: activeVariant,
      price: activeVariant?.price ?? product.price,
      availabilityStatus,
      inStock: availabilityStatus === "available",
      isPreOrderAllowed: availabilityStatus === "preorder",
    };
  }, [product, resolvedVariant]);

  async function addCurrentProductToCart(openCartDrawer) {
    if (!resolvedProduct || resolvedProduct.availabilityStatus !== "available") {
      toast.error("San pham nay hien chua san sang de mua.");
      return false;
    }

    if (!resolvedProduct.selectedVariant?.variantId) {
      toast.error("San pham nay chua co variant hop le de goi cart API.");
      return false;
    }

    try {
      await addStandardItem({
        variantId: resolvedProduct.selectedVariant.variantId,
        quantity: 1,
        orderType: "ready",
        view: createCartItemView(resolvedProduct, resolvedProduct.selectedVariant),
      });

      toast.success("Da them vao gio hang!");

      if (openCartDrawer) {
        openDrawer();
      }

      return true;
    } catch (error) {
      toast.error(getCartActionErrorMessage(error, "Khong the them san pham vao gio hang."));
      return false;
    }
  }

  return {
    product: resolvedProduct,
    relatedProducts,
    selectedColor,
    selectedSize,
    currentImage,
    ui: {
      loading,
      error,
      isNotFound: !loading && !error && !product,
    },
    actions: {
      selectColor: setSelectedColor,
      selectSize: setSelectedSize,
      setCurrentImage,
      showNextImage: () => {
        if (!product?.images?.length) {
          return;
        }

        setCurrentImage((currentIndex) => (currentIndex + 1) % product.images.length);
      },
      showPreviousImage: () => {
        if (!product?.images?.length) {
          return;
        }

        setCurrentImage((currentIndex) => (currentIndex - 1 + product.images.length) % product.images.length);
      },
      addToCart: () => addCurrentProductToCart(true),
      buyNow: async () => {
        const isAdded = await addCurrentProductToCart(false);

        if (isAdded) {
          navigate("/cart");
        }
      },
      goBackToShop: () => navigate("/shop"),
      goToPreOrder: () => navigate(`/preorder/${id}`),
    },
  };
}

function normalizeMockProduct(product) {
  const colors = Array.isArray(product.frameSpecs?.colors)
    ? product.frameSpecs.colors.map((item) => item.name)
    : [];

  return {
    id: product.id,
    productId: product.id,
    name: product.name,
    description: product.description,
    price: Number(product.price ?? 0),
    basePrice: Number(product.price ?? 0),
    image: product.images?.[0] ?? "",
    images: Array.isArray(product.images) && product.images.length > 0 ? product.images : [],
    productType: product.type,
    productTypeLabel: mapMockTypeToLabel(product.type),
    prescriptionCompatible: Boolean(product.prescriptionCompatible),
    colors,
    sizes: [],
    frameTypes: product.frameSpecs?.material ? [product.frameSpecs.material] : [],
    variants: [],
    selectedVariant: null,
    availabilityStatus: product.inStock ? "available" : product.allowPreOrder ? "preorder" : "unavailable",
    inStock: Boolean(product.inStock),
    isPreOrderAllowed: Boolean(product.allowPreOrder),
    product,
  };
}

function mapMockProductToCard(product) {
  return {
    id: product.id,
    name: product.name,
    price: Number(product.price ?? 0),
    image: product.images?.[0] ?? "",
    subtitle: mapMockTypeToLabel(product.type),
    colors: Array.isArray(product.frameSpecs?.colors)
      ? product.frameSpecs.colors.map((item) => item.hex)
      : [],
    inStock: Boolean(product.inStock),
    isPreOrderAllowed: Boolean(product.allowPreOrder),
    availabilityStatus: product.inStock ? "available" : product.allowPreOrder ? "preorder" : "unavailable",
    product,
  };
}

function mapMockTypeToLabel(type) {
  switch (type) {
    case "sunglasses":
      return "Kinh Ram";
    case "lenses-only":
      return "Trong Kinh";
    default:
      return "Gong Kinh";
  }
}

function getCartActionErrorMessage(error, fallbackMessage) {
  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message;
  }

  if (typeof error === "string" && error.trim().length > 0) {
    return error;
  }

  return fallbackMessage;
}
