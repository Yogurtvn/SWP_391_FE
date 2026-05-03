import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import { Edit3, Heart, Minus, Plus, Shield, ShoppingBag, Trash2, Truck, Upload, X } from "lucide-react";
import { toast } from "sonner";
import { useCart } from "@/hooks/cart/useCart";
import { getLensTypeErrorMessage, getLensTypes } from "@/services/lensTypeService";

const EMPTY_PRESCRIPTION_EDIT_FORM = {
  lensTypeId: "",
  lensMaterial: "",
  coatings: "",
  rightSph: "",
  rightCyl: "0",
  rightAxis: "0",
  leftSph: "",
  leftCyl: "0",
  leftAxis: "0",
  pd: "",
  prescriptionImageUrl: "",
  notes: "",
};

function CartPage() {
  const navigate = useNavigate();
  const { getTotal, isCustomerSession, items, mutationStatus, removeItem, status, updatePrescriptionItem, updateQuantity } = useCart();

  const [savedItems, setSavedItems] = useState([]);
  const [prescriptionEditItem, setPrescriptionEditItem] = useState(null);
  const [prescriptionEditForm, setPrescriptionEditForm] = useState(EMPTY_PRESCRIPTION_EDIT_FORM);
  const [prescriptionEditError, setPrescriptionEditError] = useState("");
  const [prescriptionEditImageFile, setPrescriptionEditImageFile] = useState(null);
  const [prescriptionEditImagePreviewBlobUrl, setPrescriptionEditImagePreviewBlobUrl] = useState("");
  const [lensTypeOptions, setLensTypeOptions] = useState([]);
  const [lensTypeStatus, setLensTypeStatus] = useState("idle");
  const [lensTypeLoadError, setLensTypeLoadError] = useState("");

  const isLoading = status === "loading" && items.length === 0;
  const isMutating = mutationStatus === "loading";
  const subtotal = getTotal();
  const total = subtotal;
  const overStockReadyItems = items.filter((item) => {
    if (item.hasPrescription) {
      return false;
    }

    const normalizedOrderType = normalizeCartOrderType(item.orderType);
    if (normalizedOrderType === "preorder") {
      return false;
    }

    const stockQuantity = Number(item.stockQuantity ?? 0);
    const quantity = Number(item.quantity ?? 0);

    return Number.isFinite(stockQuantity) && Number.isFinite(quantity) && quantity > Math.max(0, stockQuantity);
  });
  const hasOverStockReadyItems = overStockReadyItems.length > 0;
  const currentPrescriptionImagePreview =
    prescriptionEditImagePreviewBlobUrl || prescriptionEditForm.prescriptionImageUrl || "";

  useEffect(() => {
    return () => {
      if (prescriptionEditImagePreviewBlobUrl) {
        URL.revokeObjectURL(prescriptionEditImagePreviewBlobUrl);
      }
    };
  }, [prescriptionEditImagePreviewBlobUrl]);
  useEffect(() => {
    if (!isCustomerSession || isMutating || overStockReadyItems.length === 0) {
      return;
    }

    let cancelled = false;

    async function syncOverStockItems() {
      for (const item of overStockReadyItems) {
        if (cancelled) {
          return;
        }

        const stockQuantity = Number(item.stockQuantity ?? 0);
        const quantity = Number(item.quantity ?? 0);

        if (!Number.isFinite(stockQuantity) || stockQuantity <= 0 || !Number.isFinite(quantity) || quantity <= stockQuantity) {
          continue;
        }

        try {
          await updateQuantity(item.cartItemId, stockQuantity);
        } catch {
          // Keep silent here; checkout/update handlers already show user-facing errors.
        }
      }
    }

    void syncOverStockItems();

    return () => {
      cancelled = true;
    };
  }, [isCustomerSession, isMutating, overStockReadyItems, updateQuantity]);

  useEffect(() => {
    if (!prescriptionEditItem) {
      return;
    }

    let isActive = true;
    setLensTypeStatus("loading");
    setLensTypeLoadError("");

    async function loadLensTypeOptions() {
      try {
        const lensTypes = await getLensTypes({
          page: 1,
          pageSize: 100,
          isActive: true,
          sortBy: "lensName",
          sortOrder: "asc",
        });

        if (!isActive) {
          return;
        }

        setLensTypeOptions(lensTypes);
        setLensTypeStatus("succeeded");
        setPrescriptionEditForm((current) => {
          if (String(current.lensTypeId ?? "").trim().length > 0) {
            return current;
          }

          const defaultLensTypeId = Number(lensTypes[0]?.lensTypeId ?? 0);
          if (!Number.isFinite(defaultLensTypeId) || defaultLensTypeId <= 0) {
            return current;
          }

          return {
            ...current,
            lensTypeId: String(defaultLensTypeId),
          };
        });
      } catch (error) {
        if (!isActive) {
          return;
        }

        setLensTypeStatus("failed");
        setLensTypeLoadError(getLensTypeErrorMessage(error, "Không thể tải danh sách gói tròng kính."));
      }
    }

    void loadLensTypeOptions();

    return () => {
      isActive = false;
    };
  }, [prescriptionEditItem]);

  async function handleUpdateQuantity(cartItemId, change) {
    const item = items.find((currentItem) => currentItem.cartItemId === cartItemId);

    if (!item) {
      return;
    }

    if (item.hasPrescription) {
      toast.error("Sản phẩm theo toa chỉ hỗ trợ số lượng 1. Hãy sửa thông tin toa nếu cần.");
      return;
    }

    const stockQuantity = Number(item.stockQuantity ?? 0);
    const normalizedOrderType = normalizeCartOrderType(item.orderType);
    const isStockLimited = normalizedOrderType !== "preorder" && Number.isFinite(stockQuantity);
    const availableQuantity = Math.max(0, stockQuantity);

    if (change > 0 && isStockLimited && Number(item.quantity ?? 0) >= availableQuantity) {
      toast.error(availableQuantity > 0 ? `Chỉ còn ${availableQuantity} sản phẩm trong kho.` : "Sản phẩm đã hết hàng.");
      return;
    }

    let nextQuantity = Math.max(1, Number(item.quantity ?? 1) + change);
    if (isStockLimited && availableQuantity > 0) {
      // Clamp back to inventory cap in one step for old out-of-sync cart data.
      nextQuantity = Math.min(nextQuantity, availableQuantity);
    }

    if (nextQuantity === Number(item.quantity ?? 0)) {
      return;
    }

    try {
      await updateQuantity(cartItemId, nextQuantity);
    } catch (error) {
      toast.error(resolveErrorMessage(error, "Không thể cập nhật số lượng sản phẩm."));
    }
  }

  async function handleSaveForLater(item) {
    setSavedItems((currentItems) => [...currentItems, item.cartItemId]);

    try {
      await removeItem(item.cartItemId, item.itemType);
      toast.success("Đã lưu sản phẩm để mua sau");
    } catch (error) {
      toast.error(resolveErrorMessage(error, "Không thể lưu sản phẩm để mua sau."));
    }
  }

  async function handleRemoveItem(item) {
    try {
      await removeItem(item.cartItemId, item.itemType);
      toast.success("Đã xóa sản phẩm khỏi giỏ hàng");
    } catch (error) {
      toast.error(resolveErrorMessage(error, "Không thể xóa sản phẩm khỏi giỏ hàng."));
    }
  }

  function openPrescriptionEditor(item) {
    const detail = item.prescriptionDetails ?? {};
    const rightEye = detail.rightEye ?? {};
    const leftEye = detail.leftEye ?? {};

    setPrescriptionEditItem(item);
    setPrescriptionEditForm({
      lensTypeId: String(detail.lensTypeId ?? ""),
      lensMaterial: detail.lensMaterial ?? "",
      coatings: Array.isArray(detail.coatings) ? detail.coatings.join(", ") : "",
      rightSph: String(rightEye.sph ?? ""),
      rightCyl: String(rightEye.cyl ?? "0"),
      rightAxis: String(rightEye.axis ?? "0"),
      leftSph: String(leftEye.sph ?? ""),
      leftCyl: String(leftEye.cyl ?? "0"),
      leftAxis: String(leftEye.axis ?? "0"),
      pd: String(detail.pd ?? ""),
      prescriptionImageUrl: detail.prescriptionImageUrl ?? "",
      notes: detail.notes ?? "",
    });
    resetPrescriptionEditImageSelection();
    setPrescriptionEditError("");
  }

  function closePrescriptionEditor() {
    resetPrescriptionEditImageSelection();
    setPrescriptionEditItem(null);
    setPrescriptionEditForm(EMPTY_PRESCRIPTION_EDIT_FORM);
    setPrescriptionEditError("");
  }

  function updatePrescriptionEditField(field, value) {
    setPrescriptionEditForm((current) => ({
      ...current,
      [field]: value,
    }));

    setPrescriptionEditError("");
  }

  function handlePrescriptionEditImageSelect(file) {
    if (prescriptionEditImagePreviewBlobUrl) {
      URL.revokeObjectURL(prescriptionEditImagePreviewBlobUrl);
      setPrescriptionEditImagePreviewBlobUrl("");
    }

    if (!file) {
      setPrescriptionEditImageFile(null);
      return;
    }

    const nextPreviewBlobUrl = URL.createObjectURL(file);
    setPrescriptionEditImageFile(file);
    setPrescriptionEditImagePreviewBlobUrl(nextPreviewBlobUrl);
    setPrescriptionEditError("");
  }

  function clearPrescriptionEditImage() {
    if (prescriptionEditImagePreviewBlobUrl) {
      URL.revokeObjectURL(prescriptionEditImagePreviewBlobUrl);
      setPrescriptionEditImagePreviewBlobUrl("");
    }

    setPrescriptionEditImageFile(null);
    setPrescriptionEditForm((current) => ({
      ...current,
      prescriptionImageUrl: "",
    }));
    setPrescriptionEditError("");
  }

  function resetPrescriptionEditImageSelection() {
    if (prescriptionEditImagePreviewBlobUrl) {
      URL.revokeObjectURL(prescriptionEditImagePreviewBlobUrl);
    }

    setPrescriptionEditImageFile(null);
    setPrescriptionEditImagePreviewBlobUrl("");
  }

  async function handlePrescriptionEditSubmit(event) {
    event.preventDefault();

    if (!prescriptionEditItem) {
      return;
    }

    const validationMessage = validatePrescriptionEditForm(prescriptionEditForm);

    if (validationMessage) {
      setPrescriptionEditError(validationMessage);
      return;
    }

    try {
      await updatePrescriptionItem({
        cartItemId: prescriptionEditItem.cartItemId,
        variantId: prescriptionEditItem.variantId,
        lensTypeId: Number(prescriptionEditForm.lensTypeId),
        lensMaterial: normalizeOptionalField(prescriptionEditForm.lensMaterial),
        coatings: parseCoatings(prescriptionEditForm.coatings),
        rightEye: {
          sph: parseDecimal(prescriptionEditForm.rightSph),
          cyl: parseDecimal(prescriptionEditForm.rightCyl),
          axis: parseInteger(prescriptionEditForm.rightAxis),
        },
        leftEye: {
          sph: parseDecimal(prescriptionEditForm.leftSph),
          cyl: parseDecimal(prescriptionEditForm.leftCyl),
          axis: parseInteger(prescriptionEditForm.leftAxis),
        },
        pd: parseDecimal(prescriptionEditForm.pd),
        prescriptionImageUrl: normalizeOptionalField(prescriptionEditForm.prescriptionImageUrl),
        imageFile: prescriptionEditImageFile,
        notes: normalizeOptionalField(prescriptionEditForm.notes),
      });

      toast.success("Đã cập nhật sản phẩm theo toa.");
      closePrescriptionEditor();
    } catch (error) {
      setPrescriptionEditError(resolveErrorMessage(error, "Không thể cập nhật sản phẩm theo toa."));
    }
  }

  return <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="mb-2">Giỏ Hàng</h1>
          <p className="text-muted-foreground">
            {items.length > 0 ? `${items.length} sản phẩm` : "Giỏ hàng trống"}
          </p>
        </div>

        {!isCustomerSession ? <div className="text-center py-16 bg-secondary rounded-2xl">
            <ShoppingBag className="w-20 h-20 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h2 className="mb-2">Giỏ hàng cần tài khoản khách hàng</h2>
            <p className="text-muted-foreground mb-6">
              Vui lòng đăng nhập để đồng bộ và thanh toán đơn hàng của bạn
            </p>
            <Link
              to="/login"
              className="inline-block px-8 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
            >
              Đăng Nhập
            </Link>
          </div> : isLoading ? <div className="text-center py-16 bg-secondary rounded-2xl">
            <div className="h-12 w-12 rounded-full border-4 border-primary/20 border-t-primary animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Đang tải giỏ hàng...</p>
          </div> : items.length === 0 ? <div className="text-center py-16 bg-secondary rounded-2xl">
            <ShoppingBag className="w-20 h-20 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h2 className="mb-2">Giỏ hàng của bạn đang trống</h2>
            <p className="text-muted-foreground mb-6">
              Hãy khám phá bộ sưu tập kính mắt đa dạng của chúng tôi
            </p>
            <Link
              to="/shop"
              className="inline-block px-8 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
            >
              Khám Phá Sản Phẩm
            </Link>
          </div> : <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-4">
              <div className="space-y-4">
                {items.map((item) => <div
                    key={item.cartItemId}
                    className="bg-white border border-border rounded-xl p-6 hover:shadow-md transition-shadow"
                  >
                    <div className="flex gap-6">
                      <div className="w-32 h-32 bg-secondary rounded-lg overflow-hidden shrink-0">
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start gap-4 mb-3">
                          <div>
                            <h3 className="mb-2 text-lg">{item.name}</h3>
                            <div className="space-y-1 text-sm text-muted-foreground">
                              <p className="flex items-center gap-2">
                                <span className="w-4 h-4 rounded-full border border-border" style={{ backgroundColor: item.color === "Đen" ? "#000" : item.color === "Tortoise" ? "#8B4513" : "#E5E7EB" }} />
                                Màu: {item.color}
                              </p>
                              {item.size && <p>Kích thước: {item.size}</p>}
                              {item.sku && <p>SKU: {item.sku}</p>}
                              {item.hasPrescription ? <>
                                  <p>✓ Tròng: {item.prescriptionDetails?.lensType}</p>
                                  <p>✓ Theo toa</p>
                                </> : item.orderType === "preOrder" ? <p className="text-blue-600">• Đặt trước</p> : <p className="text-amber-600">• Hàng sẵn</p>}
                              {!item.hasPrescription && (
                                <p>
                                  Tồn kho: {Number(item.stockQuantity ?? 0)}
                                  {item.orderType === "preOrder" && item.expectedRestockDate
                                    ? ` · Dự kiến ${formatDate(item.expectedRestockDate)}`
                                    : ""}
                                </p>
                              )}
                              {item.orderType === "preOrder" && item.preOrderNote ? (
                                <p className="text-blue-700">{item.preOrderNote}</p>
                              ) : null}
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-xl text-primary mb-1">{formatCurrency(item.unitPrice)}</p>
                            <p className="text-sm text-muted-foreground">mỗi sản phẩm</p>
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-3 border-t border-border">
                          <div className="flex items-center gap-4">
                            {item.hasPrescription ? (
                              <div className="rounded-lg bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700">
                                SL 1 - Theo toa
                              </div>
                            ) : (
                              <div className="flex items-center gap-3 bg-secondary rounded-lg px-3 py-2">
                                <button
                                  onClick={() => handleUpdateQuantity(item.cartItemId, -1)}
                                  disabled={item.quantity <= 1 || isMutating}
                                  className="w-6 h-6 flex items-center justify-center hover:text-primary transition-colors"
                                >
                                  <Minus className="w-4 h-4" />
                                </button>
                                <span className="w-8 text-center font-medium">{item.quantity}</span>
                                <button
                                  onClick={() => handleUpdateQuantity(item.cartItemId, 1)}
                                  disabled={
                                    isMutating
                                    || (normalizeCartOrderType(item.orderType) !== "preorder"
                                      && Number.isFinite(Number(item.stockQuantity ?? 0))
                                      && Number(item.quantity ?? 0) >= Math.max(0, Number(item.stockQuantity ?? 0)))
                                  }
                                  className="w-6 h-6 flex items-center justify-center hover:text-primary transition-colors"
                                >
                                  <Plus className="w-4 h-4" />
                                </button>
                              </div>
                            )}
                            <span className="text-sm text-muted-foreground">
                              Tổng: <span className="text-foreground font-semibold">{formatCurrency(item.totalPrice)}</span>
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            {item.hasPrescription ? (
                              <button
                                onClick={() => openPrescriptionEditor(item)}
                                disabled={isMutating}
                                className="p-2 text-muted-foreground hover:text-primary hover:bg-secondary rounded-lg transition-colors"
                                title="Sửa toa"
                              >
                                <Edit3 className="w-5 h-5" />
                              </button>
                            ) : null}
                            <button
                              onClick={() => handleSaveForLater(item)}
                              disabled={isMutating}
                              className="p-2 text-muted-foreground hover:text-primary hover:bg-secondary rounded-lg transition-colors"
                              title="Lưu để mua sau"
                            >
                              <Heart className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() => handleRemoveItem(item)}
                              disabled={isMutating}
                              className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                              title="Xóa"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>)}
              </div>

              <Link
                to="/shop"
                className="inline-flex items-center gap-2 text-primary hover:underline"
              >
                ← Tiếp tục mua sắm
              </Link>
            </div>

            <div className="lg:col-span-1">
              <div className="bg-secondary rounded-xl p-6 sticky top-24 space-y-6">
                <h3>Tóm Tắt Đơn Hàng</h3>

                <div className="space-y-3 pt-4 border-t border-border">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Tạm tính</span>
                    <span>{formatCurrency(subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Vận chuyển</span>
                    <span className="text-muted-foreground">Tính ở checkout</span>
                  </div>
                  <div className="border-t border-border pt-3">
                    <div className="flex justify-between items-center">
                      <span className="text-lg">Tổng cộng</span>
                      <span className="text-2xl text-primary">{formatCurrency(total)}</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => navigate("/checkout")}
                  disabled={isMutating || hasOverStockReadyItems}
                  className="w-full py-4 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-medium disabled:opacity-60"
                >
                  Thanh Toán Ngay
                </button>
                {hasOverStockReadyItems ? (
                  <p className="text-xs text-red-600">
                    Một số sản phẩm đang vượt tồn kho. Vui lòng giảm số lượng hoặc xóa sản phẩm hết hàng trước khi checkout.
                  </p>
                ) : null}

                <div className="space-y-3 pt-4 border-t border-border">
                  <div className="flex items-start gap-3 text-sm">
                    <Shield className="w-5 h-5 text-green-600 shrink-0" />
                    <div>
                      <p className="font-medium">Thanh toán an toàn</p>
                      <p className="text-muted-foreground text-xs">Bảo mật SSL 256-bit</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 text-sm">
                    <Truck className="w-5 h-5 text-blue-600 shrink-0" />
                    <div>
                      <p className="font-medium">Phí vận chuyển GHN</p>
                      <p className="text-muted-foreground text-xs">Được tính ở checkout theo địa chỉ giao hàng</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 text-sm">
                    <Heart className="w-5 h-5 text-red-600 shrink-0" />
                    <div>
                      <p className="font-medium">Đổi trả dễ dàng</p>
                      <p className="text-muted-foreground text-xs">Trong vòng 30 ngày</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>}
      </div>
      {prescriptionEditItem ? (
        <PrescriptionEditor
          form={prescriptionEditForm}
          item={prescriptionEditItem}
          error={prescriptionEditError}
          isSaving={isMutating}
          lensTypeOptions={lensTypeOptions}
          lensTypeStatus={lensTypeStatus}
          lensTypeLoadError={lensTypeLoadError}
          imagePreviewUrl={currentPrescriptionImagePreview}
          imageFileName={prescriptionEditImageFile?.name ?? ""}
          onSelectImageFile={handlePrescriptionEditImageSelect}
          onClearImage={clearPrescriptionEditImage}
          onChange={updatePrescriptionEditField}
          onClose={closePrescriptionEditor}
          onSubmit={handlePrescriptionEditSubmit}
        />
      ) : null}
    </div>;
}

function PrescriptionEditor({
  item,
  form,
  error,
  isSaving,
  lensTypeOptions,
  lensTypeStatus,
  lensTypeLoadError,
  imagePreviewUrl,
  imageFileName,
  onSelectImageFile,
  onClearImage,
  onChange,
  onClose,
  onSubmit,
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-6">
      <form onSubmit={onSubmit} className="max-h-full w-full max-w-5xl overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-2xl">Sửa sản phẩm theo toa</h2>
            <p className="mt-1 text-sm text-muted-foreground">{item.name}</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-full p-2 text-muted-foreground hover:bg-secondary">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <LensTypeSelectField
            label="Gói tròng kính"
            value={form.lensTypeId}
            options={lensTypeOptions}
            isLoading={lensTypeStatus === "loading"}
            errorMessage={lensTypeLoadError}
            fallbackLabel={resolveLensPackageLabel(item, form)}
            onChange={(value) => onChange("lensTypeId", value)}
          />
          <EditField label="SPH phải" value={form.rightSph} onChange={(value) => onChange("rightSph", value)} />
          <EditField label="CYL phải" value={form.rightCyl} onChange={(value) => onChange("rightCyl", value)} />
          <EditField label="AXIS phải" value={form.rightAxis} onChange={(value) => onChange("rightAxis", value)} />
          <EditField label="SPH trái" value={form.leftSph} onChange={(value) => onChange("leftSph", value)} />
          <EditField label="CYL trái" value={form.leftCyl} onChange={(value) => onChange("leftCyl", value)} />
          <EditField label="AXIS trái" value={form.leftAxis} onChange={(value) => onChange("leftAxis", value)} />
          <EditField label="PD" value={form.pd} onChange={(value) => onChange("pd", value)} />
        </div>

        <PrescriptionImageField
          imagePreviewUrl={imagePreviewUrl}
          imageFileName={imageFileName}
          onSelectImageFile={onSelectImageFile}
          onClearImage={onClearImage}
        />

        <label className="mt-4 block">
          <span className="mb-2 block text-sm">Ghi chú</span>
          <textarea
            value={form.notes}
            onChange={(event) => onChange("notes", event.target.value)}
            rows={3}
            className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-primary"
          />
        </label>

        {error ? <p className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}

        <div className="mt-6 flex flex-wrap justify-end gap-3">
          <button type="button" onClick={onClose} className="rounded-xl border border-border px-5 py-3 hover:bg-secondary">
            Hủy
          </button>
          <button type="submit" disabled={isSaving} className="rounded-xl bg-primary px-5 py-3 text-white hover:bg-primary/90 disabled:opacity-60">
            {isSaving ? "Đang lưu..." : "Lưu thay đổi"}
          </button>
        </div>
      </form>
    </div>
  );
}

function PrescriptionImageField({ imagePreviewUrl, imageFileName, onSelectImageFile, onClearImage }) {
  return (
    <div className="mt-4 rounded-xl border border-dashed border-border p-4">
      <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl bg-secondary/30 px-4 py-5 text-center">
        <Upload className="h-7 w-7 text-primary" />
        <span className="text-sm font-medium">Cập nhật ảnh toa từ máy tính</span>
        <span className="text-xs text-muted-foreground">JPG, PNG, WEBP...</span>
        <input
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(event) => onSelectImageFile(event.target.files?.[0] ?? null)}
        />
      </label>

      {imageFileName ? <p className="mt-3 text-sm text-muted-foreground">Đã chọn: {imageFileName}</p> : null}

      {imagePreviewUrl ? (
        <div className="mt-3 rounded-xl border border-border bg-secondary/20 p-2">
          <img
            src={imagePreviewUrl}
            alt="Ảnh toa"
            className="max-h-[320px] w-full rounded-lg object-contain"
          />
          <div className="mt-2 flex justify-end">
            <button
              type="button"
              onClick={onClearImage}
              className="rounded-lg border border-border px-3 py-1.5 text-sm hover:bg-secondary"
            >
              Xóa ảnh
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function EditField({ label, value, onChange, placeholder }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm">{label}</span>
      <input
        type="text"
        inputMode="decimal"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-primary"
      />
    </label>
  );
}

function LensTypeSelectField({
  label,
  value,
  options,
  isLoading,
  errorMessage,
  fallbackLabel,
  onChange,
}) {
  const normalizedValue = String(value ?? "").trim();
  const hasMatchingOption = options.some(
    (option) => String(option?.lensTypeId ?? "") === normalizedValue,
  );

  return (
    <label className="block">
      <span className="mb-2 block text-sm">{label}</span>
      <select
        value={normalizedValue}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-primary"
      >
        <option value="">Chọn gói tròng kính</option>
        {!hasMatchingOption && normalizedValue ? <option value={normalizedValue}>{fallbackLabel}</option> : null}
        {options.map((option) => (
          <option key={option.lensTypeId} value={String(option.lensTypeId)}>
            {formatLensTypeOptionLabel(option)}
          </option>
        ))}
      </select>
      {isLoading ? <p className="mt-2 text-xs text-muted-foreground">Đang tải danh sách gói tròng...</p> : null}
      {errorMessage ? <p className="mt-2 text-xs text-red-600">{errorMessage}</p> : null}
    </label>
  );
}

function resolveLensPackageLabel(item, form) {
  const lensType = String(
    item?.prescriptionDetails?.lensType
      || item?.prescriptionDetails?.lensName
      || item?.prescriptionDetails?.lensCode
      || "",
  ).trim();

  if (lensType.length > 0) {
    return lensType;
  }

  const lensTypeId = Number(form?.lensTypeId ?? 0);
  return lensTypeId > 0 ? `Gói #${lensTypeId}` : "Chưa xác định";
}

function formatLensTypeOptionLabel(option) {
  const lensName = String(option?.lensName ?? "").trim();
  const lensCode = String(option?.lensCode ?? "").trim();
  const price = Number(option?.price ?? 0);

  if (lensCode) {
    return `${lensName || "Tròng kính"} - ${lensCode} - ${formatCurrency(price)}`;
  }

  return `${lensName || "Tròng kính"} - ${formatCurrency(price)}`;
}

function validatePrescriptionEditForm(form) {
  if (!Number.isFinite(Number(form.lensTypeId)) || Number(form.lensTypeId) <= 0) {
    return "Gói tròng kính không hợp lệ.";
  }

  const requiredValues = [form.rightSph, form.rightCyl, form.leftSph, form.leftCyl, form.pd];

  if (requiredValues.some((value) => !Number.isFinite(parseDecimal(value)))) {
    return "Vui lòng nhập đầy đủ thông số toa.";
  }

  const rightAxis = parseInteger(form.rightAxis);
  const leftAxis = parseInteger(form.leftAxis);

  if (!Number.isInteger(rightAxis) || rightAxis < 0 || rightAxis > 180 || !Number.isInteger(leftAxis) || leftAxis < 0 || leftAxis > 180) {
    return "AXIS phải nằm trong khoảng 0-180.";
  }

  if (parseDecimal(form.pd) <= 0) {
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

function parseCoatings(value) {
  return String(value ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function normalizeOptionalField(value) {
  const normalizedValue = String(value ?? "").trim();
  return normalizedValue.length > 0 ? normalizedValue : undefined;
}

function formatCurrency(value) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND"
  }).format(Number(value ?? 0));
}

function formatDate(value) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "chưa cập nhật";
  }

  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  }).format(date);
}

function normalizeCartOrderType(orderType) {
  return String(orderType ?? "")
    .trim()
    .toLowerCase()
    .replace(/[\s_-]+/g, "");
}

function resolveErrorMessage(error, fallbackMessage) {
  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message;
  }

  if (typeof error === "string" && error.trim().length > 0) {
    return error;
  }

  return fallbackMessage;
}

export {
  CartPage as default
};




