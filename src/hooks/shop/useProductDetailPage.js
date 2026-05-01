import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { useCart } from "@/hooks/cart/useCart";
import { useCartDrawer } from "@/store/cart/CartDrawerContext";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  fetchProductPrescriptionEligibility,
  selectPrescriptionState,
} from "@/store/prescription/prescriptionSlice";
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
  const dispatch = useAppDispatch();
  const prescription = useAppSelector(selectPrescriptionState);
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
  const productNumericId = useMemo(() => Number.parseInt(String(product?.productId ?? id ?? ""), 10), [id, product?.productId]);
  const eligibilityState = Number.isFinite(productNumericId) && productNumericId > 0
    ? prescription.productEligibility[String(productNumericId)]
    : null;

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
        if (detailProduct.availabilityStatus === "unavailable") {
          if (!isMounted) {
            return;
          }

          setProduct(null);
          setRelatedProducts([]);
          return;
        }

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
        setError(getCatalogErrorMessage(loadError, "Không thể tải chi tiết sản phẩm."));
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
    setSelectedColor(product?.selectedVariant?.color ?? product?.colors?.[0] ?? "");
    setSelectedSize(product?.selectedVariant?.size ?? product?.sizes?.[0] ?? "");
  }, [product]);

  useEffect(() => {
    if (mockProduct || !product || !Number.isFinite(productNumericId) || productNumericId <= 0) {
      return;
    }

    void dispatch(fetchProductPrescriptionEligibility(productNumericId));
  }, [dispatch, mockProduct, product, productNumericId]);

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
    const variants = Array.isArray(product.variants) ? product.variants : [];
    const availabilityStatus = activeVariant ? resolveCartAvailabilityStatus(activeVariant) : product.availabilityStatus;
    const activeVariantCanPreOrder = isOutOfStockPreOrderVariant(activeVariant);
    const hasPreOrderVariant = variants.some(isOutOfStockPreOrderVariant) || Boolean(product.canPreOrder);

    return {
      ...product,
      selectedVariant: activeVariant,
      price: activeVariant?.price ?? product.price,
      availabilityStatus,
      inStock: availabilityStatus === "available",
      isPreOrderAllowed: Boolean(activeVariant?.isPreOrderAllowed),
      canPreOrder: activeVariantCanPreOrder,
      hasPreOrderVariant,
      prescriptionCompatible: resolvePrescriptionCompatibility(product, eligibilityState, Boolean(mockProduct)),
      prescriptionEligibilityReason: eligibilityState?.data?.reason || eligibilityState?.error || "",
    };
  }, [eligibilityState, mockProduct, product, resolvedVariant]);

  async function addCurrentProductToCart(openCartDrawer) {
    if (!resolvedProduct || resolvedProduct.availabilityStatus !== "available") {
      toast.error("Sản phẩm này hiện chưa sẵn sàng để mua.");
      return false;
    }

    if (!resolvedProduct.selectedVariant?.variantId) {
      toast.error("Sản phẩm này chưa có variant hợp lệ để gọi cart API.");
      return false;
    }

    try {
      await addStandardItem({
        variantId: resolvedProduct.selectedVariant.variantId,
        quantity: 1,
        orderType: "ready",
        view: createCartItemView(resolvedProduct, resolvedProduct.selectedVariant),
      });

      toast.success("Đã thêm vào giỏ hàng!");

      if (openCartDrawer) {
        openDrawer();
      }

      return true;
    } catch (error) {
      toast.error(getCartActionErrorMessage(error, "Không thể thêm sản phẩm vào giỏ hàng."));
      return false;
    }
  }

  function selectColor(color) {
    setSelectedColor(color);

    const preferredVariant = resolvePreferredVariantBy(
      product,
      (variant) => variant.color === color,
    );

    if (preferredVariant?.size) {
      setSelectedSize(preferredVariant.size);
    }
  }

  function selectSize(size) {
    setSelectedSize(size);

    const preferredVariant =
      resolvePreferredVariantBy(
        product,
        (variant) => variant.size === size && (!selectedColor || variant.color === selectedColor),
      ) ??
      resolvePreferredVariantBy(
        product,
        (variant) => variant.size === size,
      );

    if (preferredVariant?.color) {
      setSelectedColor(preferredVariant.color);
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
      selectColor,
      selectSize,
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
      goToPrescriptionFlow: () => {
        if (!resolvedProduct?.prescriptionCompatible) {
          toast.error(resolvedProduct?.prescriptionEligibilityReason || "Sản phẩm này hiện không hỗ trợ kính theo toa.");
          return;
        }

        if (resolvedProduct?.availabilityStatus !== "available") {
          toast.error("Chỉ sản phẩm còn hàng mới có thể đặt kính theo toa.");
          return;
        }

        navigate(`/prescription/${id}`, {
          state: {
            selectedColor,
            selectedSize,
          },
        });
      },
      goBackToShop: () => navigate("/shop"),
      goToPreOrder: () => {
        if (!resolvedProduct?.hasPreOrderVariant) {
          toast.error("Chỉ biến thể đã hết hàng và bật pre-order mới được đặt trước.");
          return;
        }

        navigate(`/preorder/${id}`, {
          state: {
            selectedVariantId: resolvedProduct?.canPreOrder ? resolvedProduct?.selectedVariant?.variantId ?? null : null,
          },
        });
      },
    },
  };
}

function resolvePreferredVariantBy(product, predicate) {
  const variants = Array.isArray(product?.variants) ? product.variants.filter(predicate) : [];

  return (
    variants.find((variant) => Number(variant?.quantity ?? 0) > 0) ||
    variants.find((variant) => Boolean(variant?.isPreOrderAllowed)) ||
    variants[0] ||
    null
  );
}

function resolvePrescriptionCompatibility(product, eligibilityState, isMockProduct) {
  if (isMockProduct) {
    return Boolean(product?.prescriptionCompatible);
  }

  if (!product?.prescriptionCompatible) {
    return false;
  }

  if (!eligibilityState || eligibilityState.status === "loading") {
    return false;
  }

  return eligibilityState.status === "succeeded" && Boolean(eligibilityState.data?.isEligible);
}

function isOutOfStockPreOrderVariant(variant) {
  return (
    Boolean(variant?.isPreOrderAllowed) &&
    Number(variant?.quantity ?? 0) <= 0
  );
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
    canPreOrder: Boolean(product.allowPreOrder),
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
    canPreOrder: Boolean(product.allowPreOrder),
    availabilityStatus: product.inStock ? "available" : product.allowPreOrder ? "preorder" : "unavailable",
    product,
  };
}

function mapMockTypeToLabel(type) {
  switch (type) {
    case "sunglasses":
      return "Kính Râm";
    case "lenses-only":
      return "Tròng Kính";
    default:
      return "Gọng Kính";
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

