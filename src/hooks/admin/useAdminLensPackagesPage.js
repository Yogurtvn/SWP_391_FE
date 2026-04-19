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
  const { popupAlert, popupConfirm, popupPrompt, popupElement } = usePopupDialog();
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
      await popupAlert(error || "Khong tao duoc lens type.");
    }
  }

  async function editLens(item) {
    const lensName = await popupPrompt("Nhap ten lens moi:", item.lensName || "", {
      title: "Sua lens type",
      okText: "Luu",
    });

    if (!lensName) {
      return;
    }

    const rawPrice = await popupPrompt("Nhap gia moi:", String(item.price ?? 0), {
      title: "Gia lens type",
      okText: "Tiep tuc",
    });

    if (rawPrice == null || rawPrice === "") {
      return;
    }

    const price = Number(rawPrice);
    if (Number.isNaN(price) || price < 0) {
      await popupAlert("Gia khong hop le.");
      return;
    }

    const description = await popupPrompt("Nhap mo ta:", item.description || "", {
      title: "Mo ta lens type",
      okText: "Cap nhat",
    });

    if (description == null) {
      return;
    }

    try {
      await dispatch(
        updateAdminLensType({
          lensTypeId: item.lensTypeId,
          payload: {
            lensCode: item.lensCode,
            lensName: lensName.trim(),
            price,
            description: description.trim() || null,
            isActive: Boolean(item.isActive),
          },
        }),
      ).unwrap();
      await dispatch(fetchAdminLensTypes({ page: 1, pageSize: 100, sortBy: "lensCode", sortOrder: "asc" })).unwrap();
    } catch (error) {
      await popupAlert(error || "Khong cap nhat duoc lens type.");
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
      await popupAlert(error || "Khong cap nhat duoc trang thai.");
    }
  }

  async function deleteLens(item) {
    const isConfirmed = await popupConfirm(`Ban co chac muon xoa lens type ${item.lensCode}?`, {
      title: "Xoa lens type",
      okText: "Xoa",
    });

    if (!isConfirmed) {
      return;
    }

    try {
      await dispatch(removeAdminLensType(item.lensTypeId)).unwrap();
      await dispatch(fetchAdminLensTypes({ page: 1, pageSize: 100, sortBy: "lensCode", sortOrder: "asc" })).unwrap();
    } catch (error) {
      await popupAlert(error || "Khong xoa duoc lens type.");
    }
  }

  return {
    items: admin.lenses.items,
    form,
    ui: {
      error: admin.lenses.error ?? (!auth.accessToken && auth.isReady ? "Khong co access token." : null),
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
