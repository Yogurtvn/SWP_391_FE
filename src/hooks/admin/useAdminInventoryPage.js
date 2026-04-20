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
  const { popupAlert, popupForm, popupElement } = usePopupDialog();
  const [receiptForm, setReceiptForm] = useState(DEFAULT_RECEIPT_FORM);

  useEffect(() => {
    if (!auth.isReady || !auth.accessToken) {
      return;
    }

    void dispatch(fetchAdminInventory());
  }, [auth.accessToken, auth.isReady, dispatch]);

  async function updateQuantity(item) {
    const formValues = await popupForm({
      title: "Sua so luong ton kho",
      message: `SKU: ${item.sku || "-"} | Variant ID: ${item.variantId}`,
      okText: "Luu",
      fields: [
        {
          name: "quantity",
          label: "So luong",
          type: "number",
          required: true,
          min: 0,
          validate: (value) => {
            const parsed = Number(value);
            if (Number.isNaN(parsed) || parsed < 0) {
              return "So luong khong hop le.";
            }
            return "";
          },
        },
      ],
      initialValues: {
        quantity: String(item.quantity ?? 0),
      },
    });

    if (!formValues) {
      return;
    }

    const quantity = Number(formValues.quantity);

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
    const formValues = await popupForm({
      title: "Cap nhat pre-order",
      message: `SKU: ${item.sku || "-"} | Variant ID: ${item.variantId}`,
      okText: "Cap nhat",
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
