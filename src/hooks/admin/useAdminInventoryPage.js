import { useEffect, useMemo, useState } from "react";
import { usePopupDialog } from "@/components/common/ui/usePopupDialog";
import { getStockReceiptById } from "@/services/adminService";
import { selectAuthState } from "@/store/auth/authSlice";
import {
  createAdminReceipt,
  fetchAdminInventory,
  saveAdminPreOrder,
  selectAdminState,
} from "@/store/admin/adminSlice";
import { useAppDispatch, useAppSelector } from "@/store/hooks";

const DEFAULT_RECEIPT_FORM = {
  sku: "",
  variantId: "",
  quantityReceived: "",
  note: "",
};

function normalizeSku(value) {
  return String(value ?? "").trim().toLowerCase();
}

export function useAdminInventoryPage() {
  const dispatch = useAppDispatch();
  const auth = useAppSelector(selectAuthState);
  const admin = useAppSelector(selectAdminState);
  const { popupAlert, popupForm, popupElement } = usePopupDialog();
  const [receiptForm, setReceiptForm] = useState(DEFAULT_RECEIPT_FORM);
  const [receiptDetail, setReceiptDetail] = useState(null);
  const [isLoadingReceiptDetail, setIsLoadingReceiptDetail] = useState(false);

  useEffect(() => {
    if (!auth.isReady || !auth.accessToken) {
      return;
    }

    void dispatch(fetchAdminInventory());
  }, [auth.accessToken, auth.isReady, dispatch]);

  const skuToVariantMap = useMemo(() => {
    const map = new Map();
    admin.inventory.items.forEach((item) => {
      const normalizedSku = normalizeSku(item?.sku);
      const variantId = Number(item?.variantId ?? 0);
      if (normalizedSku && Number.isFinite(variantId) && variantId > 0) {
        map.set(normalizedSku, variantId);
      }
    });
    return map;
  }, [admin.inventory.items]);

  const variantMetaById = useMemo(() => {
    const map = new Map();
    admin.inventory.items.forEach((item) => {
      const variantId = Number(item?.variantId ?? 0);
      if (Number.isFinite(variantId) && variantId > 0) {
        map.set(variantId, {
          sku: item?.sku ?? "-",
          productName: item?.productName ?? "-",
          productImageUrl: item?.productImageUrl ?? null,
        });
      }
    });
    return map;
  }, [admin.inventory.items]);

  const skuOptions = useMemo(() => {
    const options = Array.from(
      new Set(
        admin.inventory.items
          .map((item) => String(item?.sku ?? "").trim())
          .filter((sku) => sku.length > 0 && sku !== "-"),
      ),
    );
    options.sort((a, b) => a.localeCompare(b, "vi"));
    return options;
  }, [admin.inventory.items]);

  function enrichReceiptDetail(detail) {
    if (!detail) {
      return null;
    }

    const variantId = Number(detail?.variantId ?? 0);
    const fromVariant = variantMetaById.get(variantId) ?? {};
    const fromReceiptList = admin.inventory.receipts.find(
      (receipt) => Number(receipt?.receiptId) === Number(detail?.receiptId),
    ) ?? {};

    return {
      ...detail,
      sku: detail?.sku ?? fromReceiptList?.sku ?? fromVariant?.sku ?? "-",
      productName: detail?.productName ?? fromReceiptList?.productName ?? fromVariant?.productName ?? "-",
      productImageUrl: detail?.productImageUrl ?? fromReceiptList?.productImageUrl ?? fromVariant?.productImageUrl ?? null,
    };
  }

  function setReceiptSku(value) {
    const sku = String(value ?? "");
    const variantId = skuToVariantMap.get(normalizeSku(sku));

    setReceiptForm((current) => ({
      ...current,
      sku,
      variantId: Number.isFinite(variantId) && variantId > 0 ? String(variantId) : "",
    }));
  }

  useEffect(() => {
    if (!receiptForm.sku) {
      return;
    }

    const variantId = skuToVariantMap.get(normalizeSku(receiptForm.sku));
    const normalizedVariantId = Number.isFinite(variantId) && variantId > 0 ? String(variantId) : "";

    if (receiptForm.variantId !== normalizedVariantId) {
      setReceiptForm((current) => ({
        ...current,
        variantId: normalizedVariantId,
      }));
    }
  }, [receiptForm.sku, receiptForm.variantId, skuToVariantMap]);

  async function editPreOrder(item) {
    if (Number(item?.quantity ?? 0) > 0) {
      await popupAlert("Biến thể còn hàng nên không thể sửa pre-order.");
      return;
    }

    const formValues = await popupForm({
      title: "Cập nhật pre-order",
      message: `SKU: ${item.sku || "-"} | Variant ID: ${item.variantId}`,
      okText: "Cập nhật",
      cancelText: "Hủy",
      fields: [
        {
          name: "isPreOrderAllowed",
          label: "Cho phép pre-order",
          type: "select",
          required: true,
          options: [
            { value: "true", label: "Bật" },
            { value: "false", label: "Tắt" },
          ],
        },
        {
          name: "expectedRestockDate",
          label: "Ngày dự kiến có hàng",
          type: "date",
        },
        {
          name: "preOrderNote",
          label: "Ghi chú pre-order",
          type: "textarea",
          placeholder: "Thêm ghi chú cho khách hàng hoặc kho...",
        },
      ],
      initialValues: {
        isPreOrderAllowed: String(Boolean(item.isPreOrderAllowed)),
        expectedRestockDate: item.expectedRestockDate ? new Date(item.expectedRestockDate).toISOString().slice(0, 10) : "",
        preOrderNote: item.preOrderNote || "",
      },
    });

    if (!formValues) {
      return;
    }

    const expectedRestockDate = formValues.expectedRestockDate
      ? new Date(`${formValues.expectedRestockDate}T00:00:00`).toISOString()
      : null;

    try {
      await dispatch(
        saveAdminPreOrder({
          variantId: item.variantId,
          payload: {
            isPreOrderAllowed: formValues.isPreOrderAllowed === "true",
            expectedRestockDate,
            preOrderNote: formValues.preOrderNote.trim() || null,
          },
        }),
      ).unwrap();
      await dispatch(fetchAdminInventory()).unwrap();
    } catch (error) {
      await popupAlert(error || "Không cập nhật được pre-order.");
    }
  }

  async function createReceipt(event) {
    event.preventDefault();

    const sku = receiptForm.sku.trim();
    const variantId = Number(receiptForm.variantId);
    const quantityReceived = Number(receiptForm.quantityReceived);

    if (!sku) {
      await popupAlert("Vui lòng nhập SKU.");
      return;
    }

    if (Number.isNaN(variantId) || variantId <= 0) {
      await popupAlert("Không tìm thấy Variant ID tương ứng với SKU.");
      return;
    }

    if (Number.isNaN(quantityReceived) || quantityReceived <= 0) {
      await popupAlert("Số lượng nhập phải lớn hơn 0.");
      return;
    }

    try {
      const createdReceipt = await dispatch(
        createAdminReceipt({
          variantId,
          quantityReceived,
          note: receiptForm.note.trim() || null,
        }),
      ).unwrap();
      setReceiptDetail(enrichReceiptDetail(createdReceipt));
      setReceiptForm(DEFAULT_RECEIPT_FORM);
      await dispatch(fetchAdminInventory()).unwrap();
    } catch (error) {
      await popupAlert(error || "Không tạo được phiếu nhập.");
    }
  }

  async function viewReceiptDetail(receiptId) {
    if (!auth.accessToken) {
      await popupAlert("Không có access token.");
      return;
    }

    const normalizedReceiptId = Number(receiptId);
    if (Number.isNaN(normalizedReceiptId) || normalizedReceiptId <= 0) {
      await popupAlert("Mã phiếu nhập không hợp lệ.");
      return;
    }

    setIsLoadingReceiptDetail(true);
    try {
      const detail = await getStockReceiptById(normalizedReceiptId, auth.accessToken);
      setReceiptDetail(enrichReceiptDetail(detail));
    } catch (error) {
      await popupAlert(error || "Không tải được chi tiết phiếu nhập.");
    } finally {
      setIsLoadingReceiptDetail(false);
    }
  }

  return {
    inventories: admin.inventory.items,
    receipts: admin.inventory.receipts,
    receiptForm,
    skuOptions,
    receiptDetail,
    ui: {
      error: admin.inventory.error ?? (!auth.accessToken && auth.isReady ? "Không có access token." : null),
      isLoading: admin.inventory.status === "loading",
      isLoadingReceiptDetail,
    },
    actions: {
      setReceiptField: (field, value) => setReceiptForm((current) => ({ ...current, [field]: value })),
      setReceiptSku,
      retry: () => dispatch(fetchAdminInventory()),
      editPreOrder,
      createReceipt,
      viewReceiptDetail,
      closeReceiptDetail: () => setReceiptDetail(null),
    },
    popupElement,
  };
}
