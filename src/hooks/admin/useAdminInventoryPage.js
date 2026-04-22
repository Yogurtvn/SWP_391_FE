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
      title: "Sửa số lượng tồn kho",
      message: `SKU: ${item.sku || "-"} | Variant ID: ${item.variantId}`,
      okText: "Lưu",
      fields: [
        {
          name: "quantity",
          label: "Số lượng",
          type: "number",
          required: true,
          min: 0,
          validate: (value) => {
            const parsed = Number(value);
            if (Number.isNaN(parsed) || parsed < 0) {
              return "Số lượng không hợp lệ.";
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
      await popupAlert(error || "Không cập nhật được tồn kho.");
    }
  }

  async function editPreOrder(item) {
    const formValues = await popupForm({
      title: "Cập nhật pre-order",
      message: `SKU: ${item.sku || "-"} | Variant ID: ${item.variantId}`,
      okText: "Cập nhật",
      fields: [
        {
          name: "isPreOrderAllowed",
          label: "Cho phep pre-order",
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

    const variantId = Number(receiptForm.variantId);
    const quantityReceived = Number(receiptForm.quantityReceived);

    if (Number.isNaN(variantId) || variantId <= 0) {
      await popupAlert("Variant ID không hợp lệ.");
      return;
    }

    if (Number.isNaN(quantityReceived) || quantityReceived <= 0) {
      await popupAlert("Số lượng nhập phai lon hon 0.");
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
      await popupAlert(error || "Không tạo được phiếu nhập.");
    }
  }

  return {
    inventories: admin.inventory.items,
    receipts: admin.inventory.receipts,
    receiptForm,
    ui: {
      error: admin.inventory.error ?? (!auth.accessToken && auth.isReady ? "Không có access token." : null),
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
