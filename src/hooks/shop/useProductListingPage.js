import { useEffect, useMemo, useState } from "react";
import { useParams, useSearchParams } from "react-router";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  fetchCatalogCategories,
  fetchCatalogFilterOptions,
  fetchCatalogProducts,
  selectCatalogState,
} from "@/store/catalog/catalogSlice";
import {
  getAvailablePromotions,
  getCatalogProductById,
  getCatalogRouteConfig,
  getCatalogSortOptions,
} from "@/services/catalogService";

const DEFAULT_PAGE_SIZE = 12;

export function useProductListingPage() {
  const dispatch = useAppDispatch();
  const { category } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const catalog = useAppSelector(selectCatalogState);
  const [activePromotion, setActivePromotion] = useState(null);
  const [displayPriceOverrides, setDisplayPriceOverrides] = useState({});

  const routeConfig = useMemo(() => getCatalogRouteConfig(category), [category]);
  const isPrescriptionFilterLocked = isPrescriptionFilterLockedForProductType(routeConfig.productType);

  const filters = useMemo(
    () => ({
      search: normalizeSearchParam(searchParams.get("search")),
      categoryId: parseNullableInteger(searchParams.get("categoryId")),
      color: normalizeSearchParam(searchParams.get("color")),
      size: normalizeSearchParam(searchParams.get("size")),
      frameType: normalizeSearchParam(searchParams.get("frameType")),
      minPrice: parseNullableInteger(searchParams.get("minPrice")),
      maxPrice: parseNullableInteger(searchParams.get("maxPrice")),
      prescriptionCompatible: resolvePrescriptionFilter(searchParams.get("prescription"), routeConfig),
      sort: normalizeSort(searchParams.get("sort")),
      page: parsePositiveInteger(searchParams.get("page"), 1),
    }),
    [routeConfig, searchParams],
  );

  const productRequest = useMemo(() => {
    const sortConfig = mapSortToApi(filters.sort);

    return {
      page: filters.page,
      pageSize: DEFAULT_PAGE_SIZE,
      search: filters.search,
      categoryId: filters.categoryId,
      color: filters.color,
      size: filters.size,
      frameType: filters.frameType,
      minPrice: filters.minPrice,
      maxPrice: filters.maxPrice,
      prescriptionCompatible: filters.prescriptionCompatible,
      productType: routeConfig.productType,
      sortBy: sortConfig.sortBy,
      sortOrder: sortConfig.sortOrder,
    };
  }, [filters, routeConfig.productType]);

  useEffect(() => {
    if (catalog.categoriesStatus === "idle") {
      void dispatch(fetchCatalogCategories());
    }
  }, [catalog.categoriesStatus, dispatch]);

  useEffect(() => {
    void dispatch(fetchCatalogFilterOptions(routeConfig.productType));
  }, [dispatch, routeConfig.productType]);

  useEffect(() => {
    void dispatch(fetchCatalogProducts(productRequest));
  }, [dispatch, productRequest]);

  useEffect(() => {
    let isMounted = true;

    async function syncListingDisplayPrice() {
      const productIds = catalog.items
        .map((item) => Number(item?.productId ?? item?.id))
        .filter((productId) => Number.isFinite(productId) && productId > 0);

      if (productIds.length === 0) {
        if (isMounted) {
          setDisplayPriceOverrides({});
        }
        return;
      }

      const details = await Promise.allSettled(
        productIds.map((productId) => getCatalogProductById(productId)),
      );

      if (!isMounted) {
        return;
      }

      const nextPriceOverrides = {};
      details.forEach((result, index) => {
        if (result.status !== "fulfilled") {
          return;
        }

        const productId = productIds[index];
        const detail = result.value;
        const basePrice = Number(detail?.basePrice);

        if (Number.isFinite(basePrice) && basePrice >= 0) {
          nextPriceOverrides[productId] = basePrice;
        }
      });

      setDisplayPriceOverrides(nextPriceOverrides);
    }

    void syncListingDisplayPrice();

    return () => {
      isMounted = false;
    };
  }, [catalog.items]);

  useEffect(() => {
    let isMounted = true;

    async function loadPromotionBanner() {
      try {
        const promotions = await getAvailablePromotions(1);
        if (!isMounted) {
          return;
        }

        setActivePromotion(promotions[0] ?? null);
      } catch {
        if (!isMounted) {
          return;
        }

        setActivePromotion(null);
      }
    }

    void loadPromotionBanner();

    return () => {
      isMounted = false;
    };
  }, []);

  function updateQuery(patch, resetPage = true) {
    const nextSearchParams = new URLSearchParams(searchParams);

    Object.entries(patch).forEach(([key, value]) => {
      if (value === undefined || value === null || value === "" || value === false) {
        nextSearchParams.delete(key);
        return;
      }

      nextSearchParams.set(key, String(value));
    });

    if (resetPage) {
      nextSearchParams.delete("page");
    }

    setSearchParams(nextSearchParams);
  }

  function resetFilters() {
    const nextSearchParams = new URLSearchParams();

    if (filters.search) {
      nextSearchParams.set("search", filters.search);
    }

    if (routeConfig.notice) {
      nextSearchParams.delete("page");
    }

    setSearchParams(nextSearchParams);
  }

  return {
    title: routeConfig.title,
    routeNotice: routeConfig.notice ?? "",
    activePromotion,
    products: catalog.items,
    displayPriceOverrides,
    categories: catalog.categories,
    filterOptions: catalog.filterOptions,
    filters,
    sortOptions: getCatalogSortOptions(),
    pageInfo: {
      page: catalog.page,
      pageSize: catalog.pageSize,
      totalItems: catalog.totalItems,
      totalPages: catalog.totalPages,
      hasPreviousPage: catalog.hasPreviousPage,
      hasNextPage: catalog.hasNextPage,
    },
    ui: {
      isLoading: catalog.listStatus === "loading",
      isError: catalog.listStatus === "failed",
      error: catalog.error,
      isEmpty: catalog.listStatus === "succeeded" && catalog.items.length === 0,
      categoriesLoading: catalog.categoriesStatus === "loading",
      filterOptionsLoading: catalog.filterOptionsStatus === "loading",
      filterOptionsError: catalog.filterOptionsError,
      prescriptionFilterLocked: isPrescriptionFilterLocked,
    },
    actions: {
      setSort: (sort) => updateQuery({ sort }),
      setCategoryId: (categoryId) => updateQuery({ categoryId }),
      setColor: (color) => updateQuery({ color }),
      setSize: (size) => updateQuery({ size }),
      setFrameType: (frameType) => updateQuery({ frameType }),
      setMinPrice: (minPrice) => updateQuery({ minPrice }),
      setMaxPrice: (maxPrice) => updateQuery({ maxPrice }),
      setPrescriptionOnly: (enabled) => {
        if (isPrescriptionFilterLocked) {
          return;
        }
        updateQuery({ prescription: enabled ? 1 : 0 });
      },
      goToPage: (page) => updateQuery({ page }, false),
      retry: () => {
        void dispatch(fetchCatalogProducts(productRequest));
      },
      resetFilters,
    },
  };
}

function normalizeSearchParam(value) {
  const normalizedValue = String(value ?? "").trim();
  return normalizedValue.length > 0 ? normalizedValue : "";
}

function normalizeSort(value) {
  if (value === "price-asc" || value === "price-desc") {
    return value;
  }

  return "newest";
}

function resolvePrescriptionFilter(rawValue, routeConfig) {
  if (isPrescriptionFilterLockedForProductType(routeConfig.productType)) {
    return undefined;
  }

  if (routeConfig.prescriptionCompatible === true && rawValue == null) {
    return true;
  }

  return rawValue === "1" ? true : undefined;
}

function isPrescriptionFilterLockedForProductType(productType) {
  const normalizedType = String(productType ?? "").trim().toLowerCase();
  return normalizedType === "sunglasses" || normalizedType === "lens";
}

function mapSortToApi(sort) {
  switch (sort) {
    case "price-asc":
      return { sortBy: "price", sortOrder: "asc" };
    case "price-desc":
      return { sortBy: "price", sortOrder: "desc" };
    default:
      return { sortBy: "newest", sortOrder: "desc" };
  }
}

function parsePositiveInteger(value, fallbackValue) {
  const parsedValue = Number.parseInt(String(value ?? ""), 10);
  return Number.isFinite(parsedValue) && parsedValue > 0 ? parsedValue : fallbackValue;
}

function parseNullableInteger(value) {
  const parsedValue = Number.parseInt(String(value ?? ""), 10);
  return Number.isFinite(parsedValue) && parsedValue > 0 ? parsedValue : undefined;
}
