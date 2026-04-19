import { useEffect, useState } from "react";
import { usePopupDialog } from "@/components/common/ui/usePopupDialog";
import { selectAuthState } from "@/store/auth/authSlice";
import {
  createAdminReceipt,
  fetchAdminInventory,
  saveAdminInventoryQuantity,
  saveAdminPreOrder,
  selectAdminState,
} from "@/store/admin/adminSlice";
import { useAppDispatch, useAppSelector } from "@/store/hooks";

const DEFAULT_RECEIPT_FORM = {
  variantId: "",
  quantityReceived: "",
  note: "",
};

export function useAdminInventoryPage() {
  const dispatch = useAppDispatch();
  const auth = useAppSelector(selectAuthState);
  const admin = useAppSelector(selectAdminState);
  const { popupAlert, popupPrompt, popupElement } = usePopupDialog();
  const [receiptForm, setReceiptForm] = useState(DEFAULT_RECEIPT_FORM);

  useEffect(() => {
    if (!auth.isReady || !auth.accessToken) {
      return;
    }

    void dispatch(fetchAdminInventory());
  }, [auth.accessToken, auth.isReady, dispatch]);

  async function updateQuantity(item) {
    const rawQuantity = await popupPrompt("Nhap so luong moi:", String(item.quantity ?? 0), {
      title: "Sua so luong",
      okText: "Luu",
      placeholder: "So luong",
    });

    if (rawQuantity == null || rawQuantity === "") {
      return;
    }

    const quantity = Number(rawQuantity);
    if (Number.isNaN(quantity) || quantity < 0) {
      await popupAlert("So luong khong hop le.");
      return;
    }

    try {
      await dispatch(
        saveAdminInventoryQuantity({
          variantId: item.variantId,
          payload: {
            quantity,
            isPreOrderAllowed: Boolean(item.isPreOrderAllowed),
            expectedRestockDate: item.expectedRestockDate ?? null,
            preOrderNote: item.preOrderNote ?? null,
          },
        }),
      ).unwrap();
      await dispatch(fetchAdminInventory()).unwrap();
    } catch (error) {
      await popupAlert(error || "Khong cap nhat duoc ton kho.");
    }
  }

  async function editPreOrder(item) {
    const rawAllow = await popupPrompt(
      "Cho phep pre-order? Nhap true hoac false:",
      String(Boolean(item.isPreOrderAllowed)),
      { title: "Pre-order", okText: "Tiep tuc" },
    );

    if (rawAllow == null || rawAllow === "") {
      return;
    }

    const normalizedAllow = rawAllow.trim().toLowerCase();
    if (!["true", "false"].includes(normalizedAllow)) {
      await popupAlert("Chi nhap true hoac false.");
      return;
    }

    const restockDateText = await popupPrompt(
      "Nhap ngay du kien restock (YYYY-MM-DD), de trong neu khong co:",
      item.expectedRestockDate ? new Date(item.expectedRestockDate).toISOString().slice(0, 10) : "",
      { title: "Expected restock date", okText: "Tiep tuc" },
    );

    if (restockDateText == null) {
      return;
    }

    const note = await popupPrompt("Nhap ghi chu pre-order:", item.preOrderNote || "", {
      title: "Pre-order note",
      okText: "Cap nhat",
    });

    if (note == null) {
      return;
    }

    const expectedRestockDate = restockDateText ? new Date(`${restockDateText}T00:00:00`).toISOString() : null;

    try {
      await dispatch(
        saveAdminPreOrder({
          variantId: item.variantId,
          payload: {
            isPreOrderAllowed: normalizedAllow === "true",
            expectedRestockDate,
            preOrderNote: note.trim() || null,
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

    const variantId = Number(receiptForm.variantId);
    const quantityReceived = Number(receiptForm.quantityReceived);

    if (Number.isNaN(variantId) || variantId <= 0) {
      await popupAlert("Variant ID khong hop le.");
      return;
    }

    if (Number.isNaN(quantityReceived) || quantityReceived <= 0) {
      await popupAlert("So luong nhap phai lon hon 0.");
      return;
    }

    try {
      await dispatch(
        createAdminReceipt({
          variantId,
          quantityReceived,
          note: receiptForm.note.trim() || null,
        }),
      ).unwrap();
      setReceiptForm(DEFAULT_RECEIPT_FORM);
      await dispatch(fetchAdminInventory()).unwrap();
    } catch (error) {
      await popupAlert(error || "Khong tao duoc phieu nhap.");
    }
  }

  return {
    inventories: admin.inventory.items,
    receipts: admin.inventory.receipts,
    receiptForm,
    ui: {
      error: admin.inventory.error ?? (!auth.accessToken && auth.isReady ? "Khong co access token." : null),
      isLoading: admin.inventory.status === "loading",
    },
    actions: {
      setReceiptField: (field, value) => setReceiptForm((current) => ({ ...current, [field]: value })),
      retry: () => dispatch(fetchAdminInventory()),
      updateQuantity,
      editPreOrder,
      createReceipt,
    },
    popupElement,
  };
}
