import { useCallback, useEffect, useMemo, useState } from "react";
import { usePopupDialog } from "@/components/common/ui/usePopupDialog";
import { getAllOrders, getOrderItems, getStockReceiptById } from "@/services/adminService";
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
const CLOSED_ORDER_STATUSES = new Set(["completed", "cancelled", "canceled"]);

function normalizeSku(value) {
  return String(value ?? "").trim().toLowerCase();
}

function normalizeToken(value) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[\s_-]+/g, "");
}

function isOpenOrder(order) {
  const status = normalizeToken(order?.orderStatus ?? order?.status);
  return !CLOSED_ORDER_STATUSES.has(status);
}

function resolveOrderId(order) {
  const orderId = Number(order?.orderId ?? order?.id ?? 0);
  return Number.isFinite(orderId) && orderId > 0 ? orderId : 0;
}

function resolveVariantIdFromOrderItem(item) {
  const variantId = Number(item?.variantId ?? item?.productVariantId ?? item?.variantID ?? 0);
  return Number.isFinite(variantId) && variantId > 0 ? variantId : 0;
}

async function fetchAllPages(loader) {
  const items = [];
  let currentPage = 1;
  let totalPages = 1;

  while (currentPage <= totalPages) {
    const response = await loader(currentPage);
    const pageItems = Array.isArray(response?.items) ? response.items : [];
    items.push(...pageItems);

    const detectedTotalPages = Number(response?.totalPages ?? response?.totalPage ?? 1);
    if (!Number.isFinite(detectedTotalPages) || detectedTotalPages < 1) {
      break;
    }

    totalPages = detectedTotalPages;
    if (currentPage >= totalPages) {
      break;
    }

    currentPage += 1;
  }

  return items;
}

async function loadOpenOrderCountByVariantId(accessToken) {
  const allOrders = await fetchAllPages((pageNumber) =>
    getAllOrders(
      {
        page: pageNumber,
        pageSize: 100,
        sortBy: "createdAt",
        sortOrder: "desc",
      },
      accessToken,
    ),
  );

  const openOrders = allOrders.filter(isOpenOrder);
  if (openOrders.length === 0) {
    return new Map();
  }

  const openOrderItems = await Promise.all(
    openOrders.map(async (order) => {
      const orderId = resolveOrderId(order);
      if (orderId <= 0) {
        return [];
      }

      try {
        const result = await getOrderItems(orderId, accessToken);
        const items = Array.isArray(result?.items) ? result.items : [];
        return items.map((item) => ({ orderId, item }));
      } catch {
        return [];
      }
    }),
  );

  const countByVariantId = new Map();
  for (const rows of openOrderItems) {
    const seenOrderVariantPairs = new Set();

    for (const row of rows) {
      const variantId = resolveVariantIdFromOrderItem(row?.item);
      if (variantId <= 0) {
        continue;
      }

      const quantity = Number(row?.item?.quantity ?? 0);
      if (!Number.isFinite(quantity) || quantity <= 0) {
        continue;
      }

      const uniqueOrderVariantKey = `${row.orderId}-${variantId}`;
      if (seenOrderVariantPairs.has(uniqueOrderVariantKey)) {
        continue;
      }

      seenOrderVariantPairs.add(uniqueOrderVariantKey);
      countByVariantId.set(variantId, (countByVariantId.get(variantId) ?? 0) + 1);
    }
  }

  return countByVariantId;
}

export function useAdminInventoryPage() {
  const dispatch = useAppDispatch();
  const auth = useAppSelector(selectAuthState);
  const admin = useAppSelector(selectAdminState);
  const { popupAlert, popupForm, popupElement } = usePopupDialog();
  const [receiptForm, setReceiptForm] = useState(DEFAULT_RECEIPT_FORM);
  const [receiptDetail, setReceiptDetail] = useState(null);
  const [isLoadingReceiptDetail, setIsLoadingReceiptDetail] = useState(false);
  const [openOrderCountByVariantId, setOpenOrderCountByVariantId] = useState(new Map());
  const [isLoadingOrderLocks, setIsLoadingOrderLocks] = useState(false);

  const refreshInventoryData = useCallback(async () => {
    if (!auth.accessToken) {
      return;
    }

    setIsLoadingOrderLocks(true);

    try {
      const [_, openOrderCounts] = await Promise.all([
        dispatch(fetchAdminInventory()).unwrap(),
        loadOpenOrderCountByVariantId(auth.accessToken),
      ]);

      setOpenOrderCountByVariantId(openOrderCounts);
    } finally {
      setIsLoadingOrderLocks(false);
    }
  }, [auth.accessToken, dispatch]);

  const getOpenOrderCountForVariant = useCallback(
    (variantId) => {
      const normalizedVariantId = Number(variantId ?? 0);
      if (!Number.isFinite(normalizedVariantId) || normalizedVariantId <= 0) {
        return 0;
      }

      return Number(openOrderCountByVariantId.get(normalizedVariantId) ?? 0);
    },
    [openOrderCountByVariantId],
  );

  useEffect(() => {
    if (!auth.isReady || !auth.accessToken) {
      return;
    }

    void refreshInventoryData();
  }, [auth.accessToken, auth.isReady, refreshInventoryData]);

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
    if (isLoadingOrderLocks) {
      await popupAlert("Dang kiem tra trang thai don hang. Vui long thu lai sau.");
      return;
    }

    if (Number(item?.quantity ?? 0) > 0) {
      await popupAlert("Bien the con hang nen khong the sua pre-order.");
      return;
    }

    const openOrderCount = getOpenOrderCountForVariant(item?.variantId);
    if (openOrderCount > 0) {
      await popupAlert(`Bien the nay dang co ${openOrderCount} don hang chua hoan thanh hoac chua huy nen khong the sua pre-order.`);
      return;
    }

    const formValues = await popupForm({
      title: "Cap nhat pre-order",
      message: `SKU: ${item.sku || "-"} | Variant ID: ${item.variantId}`,
      okText: "Cap nhat",
      cancelText: "Huy",
      fields: [
        {
          name: "isPreOrderAllowed",
          label: "Cho phep pre-order",
          type: "select",
          required: true,
          options: [
            { value: "true", label: "Bat" },
            { value: "false", label: "Tat" },
          ],
        },
        {
          name: "expectedRestockDate",
          label: "Ngay du kien co hang",
          type: "date",
        },
        {
          name: "preOrderNote",
          label: "Ghi chu pre-order",
          type: "textarea",
          placeholder: "Them ghi chu cho khach hang hoac kho...",
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
      await popupAlert(error || "Khong cap nhat duoc pre-order.");
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
      isLoadingOrderLocks,
    },
    openOrderCountByVariantId,
    actions: {
      setReceiptField: (field, value) => setReceiptForm((current) => ({ ...current, [field]: value })),
      setReceiptSku,
      retry: refreshInventoryData,
      editPreOrder,
      createReceipt,
      viewReceiptDetail,
      closeReceiptDetail: () => setReceiptDetail(null),
    },
    popupElement,
  };
}
