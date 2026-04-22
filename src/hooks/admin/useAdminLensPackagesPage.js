import { useEffect, useState } from "react";
import { usePopupDialog } from "@/components/common/ui/usePopupDialog";
import { selectAuthState } from "@/store/auth/authSlice";
import {
  createAdminLensType,
  fetchAdminLensTypes,
  removeAdminLensType,
  selectAdminState,
  toggleAdminLensTypeStatus,
  updateAdminLensType,
} from "@/store/admin/adminSlice";
import { useAppDispatch, useAppSelector } from "@/store/hooks";

const DEFAULT_LENS_FORM = {
  lensCode: "",
  lensName: "",
  price: "",
  description: "",
};

export function useAdminLensPackagesPage() {
  const dispatch = useAppDispatch();
  const auth = useAppSelector(selectAuthState);
  const admin = useAppSelector(selectAdminState);
  const { popupAlert, popupConfirm, popupForm, popupElement } = usePopupDialog();
  const [form, setForm] = useState(DEFAULT_LENS_FORM);

  useEffect(() => {
    if (!auth.isReady || !auth.accessToken) {
      return;
    }

    void dispatch(fetchAdminLensTypes({ page: 1, pageSize: 100, sortBy: "lensCode", sortOrder: "asc" }));
  }, [auth.accessToken, auth.isReady, dispatch]);

  async function createLens(event) {
    event.preventDefault();

    try {
      await dispatch(
        createAdminLensType({
          lensCode: form.lensCode.trim(),
          lensName: form.lensName.trim(),
          price: Number(form.price || 0),
          description: form.description.trim() || null,
          isActive: true,
        }),
      ).unwrap();
      setForm(DEFAULT_LENS_FORM);
      await dispatch(fetchAdminLensTypes({ page: 1, pageSize: 100, sortBy: "lensCode", sortOrder: "asc" })).unwrap();
    } catch (error) {
      await popupAlert(error || "Không tạo được lens type.");
    }
  }

  async function editLens(item) {
    const formValues = await popupForm({
      title: "Sửa lens type",
      message: `Lens code: ${item.lensCode}`,
      okText: "Cập nhật",
      fields: [
        {
          name: "lensName",
          label: "Tên lens",
          type: "text",
          required: true,
        },
        {
          name: "price",
          label: "Giá",
          type: "number",
          required: true,
          min: 0,
          validate: (value) => {
            const parsed = Number(value);
            if (Number.isNaN(parsed) || parsed < 0) {
              return "Giá không hợp lệ.";
            }
            return "";
          },
        },
        {
          name: "description",
          label: "Mô tả",
          type: "textarea",
          placeholder: "Mô tả goi trong kinh...",
        },
      ],
      initialValues: {
        lensName: item.lensName || "",
        price: String(item.price ?? 0),
        description: item.description || "",
      },
    });

    if (!formValues) {
      return;
    }

    try {
      await dispatch(
        updateAdminLensType({
          lensTypeId: item.lensTypeId,
          payload: {
            lensCode: item.lensCode,
            lensName: formValues.lensName.trim(),
            price: Number(formValues.price),
            description: formValues.description.trim() || null,
            isActive: Boolean(item.isActive),
          },
        }),
      ).unwrap();
      await dispatch(fetchAdminLensTypes({ page: 1, pageSize: 100, sortBy: "lensCode", sortOrder: "asc" })).unwrap();
    } catch (error) {
      await popupAlert(error || "Không cập nhật được lens type.");
    }
  }

  async function toggleLens(item) {
    try {
      await dispatch(
        toggleAdminLensTypeStatus({
          lensTypeId: item.lensTypeId,
          isActive: !item.isActive,
        }),
      ).unwrap();
      await dispatch(fetchAdminLensTypes({ page: 1, pageSize: 100, sortBy: "lensCode", sortOrder: "asc" })).unwrap();
    } catch (error) {
      await popupAlert(error || "Không cập nhật được trạng thái.");
    }
  }

  async function deleteLens(item) {
    const isConfirmed = await popupConfirm(`Bạn có chắc muốn xóa lens type ${item.lensCode}?`, {
      title: "Xóa lens type",
      okText: "Xóa",
    });

    if (!isConfirmed) {
      return;
    }

    try {
      await dispatch(removeAdminLensType(item.lensTypeId)).unwrap();
      await dispatch(fetchAdminLensTypes({ page: 1, pageSize: 100, sortBy: "lensCode", sortOrder: "asc" })).unwrap();
    } catch (error) {
      await popupAlert(error || "Không xóa được lens type.");
    }
  }

  return {
    items: admin.lenses.items,
    form,
    ui: {
      error: admin.lenses.error ?? (!auth.accessToken && auth.isReady ? "Không có access token." : null),
      isLoading: admin.lenses.status === "loading",
    },
    actions: {
      setFormField: (field, value) => setForm((current) => ({ ...current, [field]: value })),
      createLens,
      editLens,
      toggleLens,
      deleteLens,
      retry: () => dispatch(fetchAdminLensTypes({ page: 1, pageSize: 100, sortBy: "lensCode", sortOrder: "asc" })),
    },
    popupElement,
  };
}
