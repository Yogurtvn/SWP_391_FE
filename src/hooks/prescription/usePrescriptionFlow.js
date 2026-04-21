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
    const materialOptions = flow.pricingOptions.lensMaterials ?? [];
    const defaultMaterial =
      materialOptions.find((option) => option.code.toLowerCase() === "standard")?.code ??
      materialOptions[0]?.code ??
      "";

    setSelectedColor(nextColor);
    setSelectedSize(nextSize);
    setSelectedLensTypeId(String(flow.lensTypes[0]?.lensTypeId ?? ""));
    setSelectedLensMaterial(defaultMaterial);
    setSelectedCoatings([]);
    setFormState(INITIAL_FORM_STATE);
    setImageFile(null);
    setImageFileName("");
    setFormError("");
    dispatch(clearPrescriptionFlowSubmit());
  }, [
    dispatch,
    flow.lensTypes,
    flow.pricingOptions.lensMaterials,
    flow.product,
    flow.status,
    location.state?.selectedColor,
    location.state?.selectedSize,
  ]);

  const selectedVariant = useMemo(() => {
    if (!flow.product) {
      return null;
    }

    const variants = Array.isArray(flow.product.variants) ? flow.product.variants : [];

    const exactMatch = variants.find((variant) => {
      const colorMatches = !selectedColor || variant.color === selectedColor;
      const sizeMatches = !selectedSize || variant.size === selectedSize;
      return colorMatches && sizeMatches;
    });

    return exactMatch ?? resolvePreferredVariant(flow.product);
  }, [flow.product, selectedColor, selectedSize]);

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
      setFormError("San pham nay khong con ho tro kinh theo toa.");
      return;
    }

    if (!selectedVariant?.variantId) {
      setFormError("Khong tim thay bien the hop le.");
      return;
    }

    if (!selectedLensType?.lensTypeId) {
      setFormError("Vui long chon loai trong kinh.");
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
      setFormError(error?.message || error || "Khong the them kinh theo toa vao gio hang.");
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
    setImageFile(file);
    setImageFileName(file?.name ?? "");
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
    selectedLensTypeId,
    selectedLensMaterial,
    selectedCoatings,
    formState,
    imageFileName,
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
      setSelectedColor,
      setSelectedSize,
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
    { key: "rightSph", label: "SPH mat phai" },
    { key: "rightCyl", label: "CYL mat phai" },
    { key: "leftSph", label: "SPH mat trai" },
    { key: "leftCyl", label: "CYL mat trai" },
    { key: "pd", label: "PD" },
  ];

  for (const field of requiredDecimalFields) {
    if (!Number.isFinite(parseDecimal(formState[field.key]))) {
      return `${field.label} phai la so hop le.`;
    }
  }

  const rightAxis = parseInteger(formState.rightAxis);
  const leftAxis = parseInteger(formState.leftAxis);

  if (!Number.isInteger(rightAxis) || rightAxis < 0 || rightAxis > 180 || !Number.isInteger(leftAxis) || leftAxis < 0 || leftAxis > 180) {
    return "AXIS phai nam trong khoang 0-180.";
  }

  if (parseDecimal(formState.pd) <= 0) {
    return "PD phai lon hon 0.";
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
