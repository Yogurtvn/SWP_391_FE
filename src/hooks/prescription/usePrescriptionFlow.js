import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { selectAuthState } from "@/store/auth/authSlice";
import { resolvePreferredVariant } from "@/services/cartService";
import {
  clearPrescriptionFlowSubmit,
  fetchPrescriptionPricing,
  loadPrescriptionFlow,
  selectPrescriptionFlowState,
  submitPrescriptionCartItem,
} from "@/store/prescription/prescriptionSlice";

const INITIAL_FORM_STATE = {
  rightSph: "",
  rightCyl: "0",
  rightAxis: "0",
  leftSph: "",
  leftCyl: "0",
  leftAxis: "0",
  pd: "",
  notes: "",
};

export function usePrescriptionFlow() {
  const { productId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const auth = useAppSelector(selectAuthState);
  const flow = useAppSelector(selectPrescriptionFlowState);

  const [selectedColor, setSelectedColor] = useState("");
  const [selectedSize, setSelectedSize] = useState("");
  const [selectedLensTypeId, setSelectedLensTypeId] = useState("");
  const [selectedLensMaterial, setSelectedLensMaterial] = useState("");
  const [selectedCoatings, setSelectedCoatings] = useState([]);
  const [formState, setFormState] = useState(INITIAL_FORM_STATE);
  const [imageFile, setImageFile] = useState(null);
  const [imageFileName, setImageFileName] = useState("");
  const [imagePreviewUrl, setImagePreviewUrl] = useState("");
  const [imagePreviewBlobUrl, setImagePreviewBlobUrl] = useState("");
  const [formError, setFormError] = useState("");

  useEffect(() => {
    void dispatch(loadPrescriptionFlow(productId));
  }, [dispatch, productId]);

  useEffect(() => {
    if (flow.status !== "succeeded" || !flow.product) {
      return;
    }

    const preferredVariant = resolvePreferredVariant(flow.product);
    const nextColor = normalizeText(location.state?.selectedColor) ?? flow.product.colors?.[0] ?? preferredVariant?.color ?? "";
    const nextSize = normalizeText(location.state?.selectedSize) ?? flow.product.sizes?.[0] ?? preferredVariant?.size ?? "";

    setSelectedColor(nextColor);
    setSelectedSize(nextSize);
    setSelectedLensTypeId(String(flow.lensTypes[0]?.lensTypeId ?? ""));
    setSelectedLensMaterial("");
    setSelectedCoatings([]);
    setFormState(INITIAL_FORM_STATE);
    setImage(null);
    setFormError("");
    dispatch(clearPrescriptionFlowSubmit());
  }, [
    dispatch,
    flow.lensTypes,
    flow.product,
    flow.status,
    location.state?.selectedColor,
    location.state?.selectedSize,
  ]);

  useEffect(
    () => () => {
      if (imagePreviewBlobUrl) {
        URL.revokeObjectURL(imagePreviewBlobUrl);
      }
    },
    [imagePreviewBlobUrl],
  );

  const variants = useMemo(
    () => (Array.isArray(flow.product?.variants) ? flow.product.variants : []),
    [flow.product?.variants],
  );

  const sizeOrder = useMemo(() => {
    const productSizes = Array.isArray(flow.product?.sizes)
      ? flow.product.sizes.map(normalizeText).filter(Boolean)
      : [];

    if (productSizes.length > 0) {
      return productSizes;
    }

    return Array.from(
      new Set(
        variants
          .map((variant) => normalizeText(variant?.size))
          .filter(Boolean),
      ),
    );
  }, [flow.product?.sizes, variants]);

  const availableSizesForSelectedColor = useMemo(
    () => getAvailableSizesForColor(variants, selectedColor, sizeOrder),
    [selectedColor, sizeOrder, variants],
  );

  const selectedVariant = useMemo(() => {
    if (!flow.product) {
      return null;
    }

    const exactMatch = variants.find((variant) => {
      const colorMatches = !selectedColor || variant.color === selectedColor;
      const sizeMatches = !selectedSize || variant.size === selectedSize;
      return colorMatches && sizeMatches;
    });

    return exactMatch ?? resolvePreferredVariant(flow.product);
  }, [flow.product, selectedColor, selectedSize, variants]);

  useEffect(() => {
    if (!flow.product || availableSizesForSelectedColor.length === 0) {
      return;
    }

    if (availableSizesForSelectedColor.includes(selectedSize)) {
      return;
    }

    const nextSize = pickNearestSize(selectedSize, sizeOrder, availableSizesForSelectedColor);
    if (nextSize && nextSize !== selectedSize) {
      setSelectedSize(nextSize);
    }
  }, [availableSizesForSelectedColor, flow.product, selectedSize, sizeOrder]);

  const selectedLensType = useMemo(
    () => flow.lensTypes.find((item) => String(item.lensTypeId) === String(selectedLensTypeId)) ?? null,
    [flow.lensTypes, selectedLensTypeId],
  );

  const selectedLensMaterialOption = useMemo(
    () => flow.pricingOptions.lensMaterials.find((item) => item.code === selectedLensMaterial) ?? null,
    [flow.pricingOptions.lensMaterials, selectedLensMaterial],
  );

  useEffect(() => {
    if (!selectedVariant?.variantId || !selectedLensType?.lensTypeId) {
      return;
    }

    void dispatch(fetchPrescriptionPricing({
      variantId: selectedVariant.variantId,
      lensTypeId: selectedLensType.lensTypeId,
      lensMaterial: normalizeOptionalField(selectedLensMaterial),
      coatings: selectedCoatings,
      quantity: 1,
    }));
  }, [
    dispatch,
    selectedCoatings,
    selectedLensMaterial,
    selectedLensType?.lensTypeId,
    selectedVariant?.variantId,
  ]);

  async function submit(event) {
    event.preventDefault();
    setFormError("");

    if (!auth?.accessToken || auth?.user?.role !== "customer") {
      navigate("/login");
      return;
    }

    if (!flow.product?.prescriptionCompatible) {
      setFormError("Sản phẩm này không còn hỗ trợ kính theo toa.");
      return;
    }

    if (!selectedVariant?.variantId) {
      setFormError("Không tìm thấy biến thể hợp lệ.");
      return;
    }

    if (!selectedLensType?.lensTypeId) {
      setFormError("Vui lòng chọn loại tròng kính.");
      return;
    }

    const validationMessage = validatePrescriptionForm(formState);
    if (validationMessage) {
      setFormError(validationMessage);
      return;
    }

    try {
      await dispatch(submitPrescriptionCartItem({
        product: flow.product,
        variant: selectedVariant,
        lensTypeId: selectedLensType.lensTypeId,
        lensMaterial: selectedLensMaterial,
        coatings: selectedCoatings,
        rightEye: {
          sph: parseDecimal(formState.rightSph),
          cyl: parseDecimal(formState.rightCyl),
          axis: parseInteger(formState.rightAxis),
        },
        leftEye: {
          sph: parseDecimal(formState.leftSph),
          cyl: parseDecimal(formState.leftCyl),
          axis: parseInteger(formState.leftAxis),
        },
        pd: parseDecimal(formState.pd),
        notes: formState.notes,
        imageFile,
      })).unwrap();

      navigate("/cart");
    } catch (error) {
      setFormError(error?.message || error || "Không thể thêm kính theo toa vào giỏ hàng.");
    }
  }

  function updateField(field, value) {
    setFormState((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function toggleCoating(coatingCode) {
    setSelectedCoatings((current) =>
      current.includes(coatingCode)
        ? current.filter((item) => item !== coatingCode)
        : [...current, coatingCode],
    );
  }

  function setImage(file) {
    if (imagePreviewBlobUrl) {
      URL.revokeObjectURL(imagePreviewBlobUrl);
      setImagePreviewBlobUrl("");
    }

    if (!file) {
      setImageFile(null);
      setImageFileName("");
      setImagePreviewUrl("");
      return;
    }

    const previewBlobUrl = URL.createObjectURL(file);

    setImageFile(file);
    setImageFileName(file?.name ?? "");
    setImagePreviewUrl(previewBlobUrl);
    setImagePreviewBlobUrl(previewBlobUrl);
  }

  return {
    productId,
    product: flow.product,
    lensTypes: flow.lensTypes,
    pricingOptions: flow.pricingOptions,
    selectedVariant,
    selectedLensType,
    selectedLensMaterialOption,
    selectedColor,
    selectedSize,
    availableSizesForSelectedColor,
    selectedLensTypeId,
    selectedLensMaterial,
    selectedCoatings,
    formState,
    imageFileName,
    imagePreviewUrl,
    totalPrice: flow.pricing.totalPrice || (Number(selectedVariant?.price ?? 0) + Number(selectedLensType?.price ?? 0)),
    ui: {
      isLoading: flow.status === "loading" || flow.status === "idle",
      error: flow.error,
      pricing: flow.pricing,
      imageUpload: flow.imageUpload,
      isCustomerSession: Boolean(auth?.accessToken && auth?.user?.role === "customer"),
      isSubmitting: flow.submitStatus === "loading",
      submitError: flow.submitError,
      formError,
    },
    actions: {
      submit,
      updateField,
      setSelectedColor: (color) => {
        const normalizedColor = normalizeText(color) ?? "";
        setSelectedColor(normalizedColor);

        const sizesForColor = getAvailableSizesForColor(variants, normalizedColor, sizeOrder);
        if (sizesForColor.length === 0) {
          return;
        }

        if (sizesForColor.includes(selectedSize)) {
          return;
        }

        const nextSize = pickNearestSize(selectedSize, sizeOrder, sizesForColor);
        if (nextSize) {
          setSelectedSize(nextSize);
        }
      },
      setSelectedSize: (size) => {
        const normalizedSize = normalizeText(size) ?? "";
        if (!normalizedSize) {
          return;
        }

        if (availableSizesForSelectedColor.length > 0 && !availableSizesForSelectedColor.includes(normalizedSize)) {
          const fallbackSize = pickNearestSize(normalizedSize, sizeOrder, availableSizesForSelectedColor);
          setSelectedSize(fallbackSize || normalizedSize);
          return;
        }

        setSelectedSize(normalizedSize);
      },
      setSelectedLensTypeId,
      setSelectedLensMaterial,
      toggleCoating,
      setImage,
      clearImage: () => setImage(null),
      goBackToProduct: () => navigate(`/product/${productId}`),
    },
  };
}

function validatePrescriptionForm(formState) {
  const requiredDecimalFields = [
    { key: "rightSph", label: "SPH mắt phải" },
    { key: "rightCyl", label: "CYL mắt phải" },
    { key: "leftSph", label: "SPH mắt trái" },
    { key: "leftCyl", label: "CYL mắt trái" },
    { key: "pd", label: "PD" },
  ];

  for (const field of requiredDecimalFields) {
    if (!Number.isFinite(parseDecimal(formState[field.key]))) {
      return `${field.label} phải là số hợp lệ.`;
    }
  }

  const rightAxis = parseInteger(formState.rightAxis);
  const leftAxis = parseInteger(formState.leftAxis);

  if (!Number.isInteger(rightAxis) || rightAxis < 0 || rightAxis > 180 || !Number.isInteger(leftAxis) || leftAxis < 0 || leftAxis > 180) {
    return "AXIS phải nằm trong khoảng 0-180.";
  }

  if (parseDecimal(formState.pd) <= 0) {
    return "PD phải lớn hơn 0.";
  }

  return "";
}

function parseDecimal(value) {
  return Number.parseFloat(String(value ?? "").trim().replace(",", "."));
}

function parseInteger(value) {
  return Number.parseInt(String(value ?? "").trim(), 10);
}

function normalizeOptionalField(value) {
  const normalizedValue = String(value ?? "").trim();
  return normalizedValue.length > 0 ? normalizedValue : undefined;
}

function normalizeText(value) {
  const normalizedValue = String(value ?? "").trim();
  return normalizedValue.length > 0 ? normalizedValue : null;
}

function getAvailableSizesForColor(variants, selectedColor, sizeOrder) {
  const normalizedColor = normalizeText(selectedColor);
  const baseVariants = Array.isArray(variants) ? variants : [];
  const filteredVariants = normalizedColor
    ? baseVariants.filter((variant) => normalizeText(variant?.color) === normalizedColor)
    : baseVariants;

  const variantSizes = new Set(
    filteredVariants
      .map((variant) => normalizeText(variant?.size))
      .filter(Boolean),
  );

  const orderedSizes = Array.isArray(sizeOrder) ? sizeOrder : [];
  if (orderedSizes.length === 0) {
    return Array.from(variantSizes);
  }

  return orderedSizes.filter((size) => variantSizes.has(size));
}

function pickNearestSize(currentSize, orderedSizes, availableSizes) {
  const normalizedCurrentSize = normalizeText(currentSize);
  const validOrderedSizes = Array.isArray(orderedSizes) ? orderedSizes : [];
  const validAvailableSizes = Array.isArray(availableSizes) ? availableSizes : [];

  if (validAvailableSizes.length === 0) {
    return "";
  }

  if (normalizedCurrentSize && validAvailableSizes.includes(normalizedCurrentSize)) {
    return normalizedCurrentSize;
  }

  if (!normalizedCurrentSize || validOrderedSizes.length === 0) {
    return validAvailableSizes[0];
  }

  const currentIndex = validOrderedSizes.indexOf(normalizedCurrentSize);
  if (currentIndex < 0) {
    return validAvailableSizes[0];
  }

  for (let offset = 1; offset < validOrderedSizes.length; offset += 1) {
    const rightSize = validOrderedSizes[currentIndex + offset];
    if (rightSize && validAvailableSizes.includes(rightSize)) {
      return rightSize;
    }

    const leftSize = validOrderedSizes[currentIndex - offset];
    if (leftSize && validAvailableSizes.includes(leftSize)) {
      return leftSize;
    }
  }

  return validAvailableSizes[0];
}
