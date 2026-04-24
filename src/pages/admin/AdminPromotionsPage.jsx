import { useCallback, useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { Loader2, Plus, RefreshCw } from "lucide-react";
import { AdminErrorBanner, AdminPageShell, AdminPagination, AdminSection, adminStyles } from "@/components/admin/admin-ui";
import { usePopupDialog } from "@/components/common/ui/usePopupDialog";
import {
  createAdminPromotion,
  deleteAdminPromotion,
  getAdminPromotions,
  updateAdminPromotion,
  updateAdminPromotionStatus,
} from "@/services/adminService";
import { selectAuthState } from "@/store/auth/authSlice";

const TABLE_PAGE_SIZE = 10;
const FETCH_PAGE_SIZE = 100;

const STATUS_META = {
  active: { label: "Đang chạy", className: "border-emerald-200 bg-emerald-50 text-emerald-700" },
  scheduled: { label: "Sắp diễn ra", className: "border-sky-200 bg-sky-50 text-sky-700" },
  paused: { label: "Tạm dừng", className: "border-amber-200 bg-amber-50 text-amber-700" },
  expired: { label: "Hết hạn", className: "border-slate-200 bg-slate-100 text-slate-700" },
};

function normalizePromotion(rawPromotion) {
  return {
    promotionId: Number(rawPromotion?.promotionId ?? rawPromotion?.PromotionId ?? 0),
    name: String(rawPromotion?.name ?? rawPromotion?.Name ?? "").trim(),
    description: String(rawPromotion?.description ?? rawPromotion?.Description ?? "").trim(),
    discountPercent: Number(rawPromotion?.discountPercent ?? rawPromotion?.DiscountPercent ?? 0),
    startAt: rawPromotion?.startAt ?? rawPromotion?.StartAt ?? null,
    endAt: rawPromotion?.endAt ?? rawPromotion?.EndAt ?? null,
    isActive: Boolean(rawPromotion?.isActive ?? rawPromotion?.IsActive),
    createdAt: rawPromotion?.createdAt ?? rawPromotion?.CreatedAt ?? null,
    updatedAt: rawPromotion?.updatedAt ?? rawPromotion?.UpdatedAt ?? null,
  };
}

function resolvePromotionStatus(promotion, now = new Date()) {
  const start = promotion.startAt ? new Date(promotion.startAt) : null;
  const end = promotion.endAt ? new Date(promotion.endAt) : null;

  if (!promotion.isActive) {
    return "paused";
  }

  if (start && now < start) {
    return "scheduled";
  }

  if (end && now > end) {
    return "expired";
  }

  return "active";
}

function formatDate(value) {
  if (!value) {
    return "-";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return date.toLocaleDateString("vi-VN");
}

function toDateInputValue(value) {
  if (!value) {
    return "";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toISOString().slice(0, 10);
}

function toIsoDate(value) {
  if (!value) {
    return null;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date.toISOString();
}

function buildFormFields() {
  return [
    { name: "name", label: "Tên khuyến mãi", type: "text", required: true, placeholder: "Ví dụ: Flash Sale Cuối Tuần" },
    {
      name: "discountPercent",
      label: "Phần trăm giảm (%)",
      type: "number",
      required: true,
      min: 1,
      max: 100,
      step: "0.01",
      helpText: "Giá trị từ 0.01 đến 100.",
    },
    { name: "startAt", label: "Ngày bắt đầu", type: "date", required: true },
    { name: "endAt", label: "Ngày kết thúc", type: "date", required: true },
    { name: "isActive", label: "Kích hoạt chương trình", type: "checkbox" },
    { name: "description", label: "Mô tả", type: "textarea", rows: 3, placeholder: "Mô tả ngắn cho chương trình..." },
  ];
}

export default function AdminPromotionsPage() {
  const { accessToken } = useSelector(selectAuthState);
  const { popupAlert, popupConfirm, popupForm, popupElement } = usePopupDialog();

  const [promotions, setPromotions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [keyword, setKeyword] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);

  const fetchPromotions = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      if (!accessToken) {
        throw new Error("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
      }

      const result = await getAdminPromotions({ page: 1, pageSize: FETCH_PAGE_SIZE }, accessToken);
      const normalizedItems = (result?.items ?? []).map(normalizePromotion);
      setPromotions(normalizedItems);
    } catch (requestError) {
      setPromotions([]);
      setError(requestError?.message || "Không tải được danh sách khuyến mãi.");
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    void fetchPromotions();
  }, [fetchPromotions]);

  const promotionsWithStatus = useMemo(
    () => promotions.map((promotion) => ({ ...promotion, status: resolvePromotionStatus(promotion) })),
    [promotions],
  );

  const filteredPromotions = useMemo(() => {
    const normalizedKeyword = keyword.trim().toLowerCase();

    return promotionsWithStatus.filter((promotion) => {
      const keywordMatched =
        normalizedKeyword.length === 0 ||
        promotion.name.toLowerCase().includes(normalizedKeyword) ||
        promotion.description.toLowerCase().includes(normalizedKeyword);
      const statusMatched = statusFilter === "all" || promotion.status === statusFilter;
      return keywordMatched && statusMatched;
    });
  }, [keyword, promotionsWithStatus, statusFilter]);

  const summary = useMemo(() => {
    return promotionsWithStatus.reduce(
      (result, promotion) => {
        result.total += 1;
        result[promotion.status] += 1;
        return result;
      },
      { total: 0, active: 0, scheduled: 0, paused: 0, expired: 0 },
    );
  }, [promotionsWithStatus]);

  const totalPages = Math.max(1, Math.ceil(filteredPromotions.length / TABLE_PAGE_SIZE));
  const paginatedPromotions = useMemo(
    () => filteredPromotions.slice((page - 1) * TABLE_PAGE_SIZE, page * TABLE_PAGE_SIZE),
    [filteredPromotions, page],
  );

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  useEffect(() => {
    setPage(1);
  }, [keyword, statusFilter]);

  async function upsertPromotion(targetPromotion = null) {
    const initialValues = targetPromotion
      ? {
          name: targetPromotion.name,
          discountPercent: String(targetPromotion.discountPercent),
          startAt: toDateInputValue(targetPromotion.startAt),
          endAt: toDateInputValue(targetPromotion.endAt),
          isActive: Boolean(targetPromotion.isActive),
          description: targetPromotion.description,
        }
      : {
          name: "",
          discountPercent: "",
          startAt: "",
          endAt: "",
          isActive: true,
          description: "",
        };

    const formValues = await popupForm({
      title: targetPromotion ? "Sửa khuyến mãi" : "Tạo khuyến mãi",
      message: "Điền thông tin chương trình khuyến mãi.",
      okText: targetPromotion ? "Lưu thay đổi" : "Tạo mới",
      fields: buildFormFields(),
      initialValues,
    });

    if (!formValues) {
      return;
    }

    const name = String(formValues.name ?? "").trim();
    const startAt = toIsoDate(formValues.startAt);
    const endAt = toIsoDate(formValues.endAt);
    const discountPercent = Number(formValues.discountPercent ?? 0);

    if (!name) {
      await popupAlert("Tên khuyến mãi không được để trống.");
      return;
    }

    if (!startAt || !endAt) {
      await popupAlert("Vui lòng chọn đầy đủ ngày bắt đầu và ngày kết thúc.");
      return;
    }

    if (new Date(endAt) <= new Date(startAt)) {
      await popupAlert("Ngày kết thúc phải sau ngày bắt đầu.");
      return;
    }

    if (!Number.isFinite(discountPercent) || discountPercent <= 0 || discountPercent > 100) {
      await popupAlert("Phần trăm giảm phải lớn hơn 0 và nhỏ hơn hoặc bằng 100.");
      return;
    }

    const payload = {
      name,
      description: String(formValues.description ?? "").trim() || null,
      discountPercent,
      startAt,
      endAt,
      isActive: Boolean(formValues.isActive),
    };

    try {
      if (!accessToken) {
        throw new Error("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
      }

      if (targetPromotion) {
        await updateAdminPromotion(targetPromotion.promotionId, payload, accessToken);
      } else {
        await createAdminPromotion(payload, accessToken);
      }

      await fetchPromotions();
    } catch (requestError) {
      await popupAlert(requestError?.message || "Không thể lưu khuyến mãi.");
    }
  }

  async function removePromotion(promotion) {
    const isConfirmed = await popupConfirm(`Bạn có chắc muốn xóa khuyến mãi "${promotion.name}"?`, {
      title: "Xác nhận xóa",
      okText: "Xóa",
      cancelText: "Hủy",
    });

    if (!isConfirmed) {
      return;
    }

    try {
      if (!accessToken) {
        throw new Error("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
      }

      await deleteAdminPromotion(promotion.promotionId, accessToken);
      await fetchPromotions();
    } catch (requestError) {
      await popupAlert(requestError?.message || "Không thể xóa khuyến mãi.");
    }
  }

  async function togglePromotionActive(promotion) {
    try {
      if (!accessToken) {
        throw new Error("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
      }

      await updateAdminPromotionStatus(promotion.promotionId, !promotion.isActive, accessToken);
      await fetchPromotions();
    } catch (requestError) {
      await popupAlert(requestError?.message || "Không thể cập nhật trạng thái khuyến mãi.");
    }
  }

  return (
    <AdminPageShell
      title="Khuyến mãi"
      actions={
        <>
          <button type="button" className={adminStyles.secondaryButton} onClick={fetchPromotions} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Tải lại
          </button>
          <button type="button" className={adminStyles.primaryButton} onClick={() => upsertPromotion()}>
            <Plus className="h-4 w-4" />
            Tạo khuyến mãi
          </button>
        </>
      }
    >
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-[1.3rem] border border-orange-200 bg-orange-50 p-5">
          <p className="text-sm font-semibold text-slate-600">Tổng chương trình</p>
          <p className="mt-2 text-3xl font-bold text-orange-700">{summary.total}</p>
        </div>
        <div className="rounded-[1.3rem] border border-emerald-200 bg-emerald-50 p-5">
          <p className="text-sm font-semibold text-slate-600">Đang chạy</p>
          <p className="mt-2 text-3xl font-bold text-emerald-700">{summary.active}</p>
        </div>
        <div className="rounded-[1.3rem] border border-sky-200 bg-sky-50 p-5">
          <p className="text-sm font-semibold text-slate-600">Sắp diễn ra</p>
          <p className="mt-2 text-3xl font-bold text-sky-700">{summary.scheduled}</p>
        </div>
        <div className="rounded-[1.3rem] border border-amber-200 bg-amber-50 p-5">
          <p className="text-sm font-semibold text-slate-600">Tạm dừng</p>
          <p className="mt-2 text-3xl font-bold text-amber-700">{summary.paused}</p>
        </div>
      </div>

      <AdminSection title="Bộ lọc">
        <div className="grid gap-4 md:grid-cols-2">
          <input
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
            placeholder="Tìm theo tên hoặc mô tả..."
            className={adminStyles.input}
          />
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className={adminStyles.input}>
            <option value="all">Tất cả trạng thái</option>
            {Object.entries(STATUS_META).map(([value, meta]) => (
              <option key={value} value={value}>
                {meta.label}
              </option>
            ))}
          </select>
        </div>
      </AdminSection>

      <AdminErrorBanner message={error} />

      <div className={adminStyles.tableWrapper}>
        <table className={adminStyles.table}>
          <thead className={adminStyles.tableHead}>
            <tr>
              <th className={adminStyles.th}>ID</th>
              <th className={adminStyles.th}>Chương trình</th>
              <th className={adminStyles.th}>Giảm giá</th>
              <th className={adminStyles.th}>Thời gian</th>
              <th className={adminStyles.th}>Trạng thái</th>
              <th className={adminStyles.th}>Cập nhật</th>
              <th className={adminStyles.th}>Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan={7} className={adminStyles.emptyState}>
                  <Loader2 className="mx-auto h-7 w-7 animate-spin text-orange-500" />
                </td>
              </tr>
            ) : filteredPromotions.length === 0 ? (
              <tr>
                <td colSpan={7} className={adminStyles.emptyState}>
                  Không có chương trình khuyến mãi phù hợp.
                </td>
              </tr>
            ) : (
              paginatedPromotions.map((promotion) => {
                const statusMeta = STATUS_META[promotion.status] ?? STATUS_META.expired;
                return (
                  <tr key={promotion.promotionId}>
                    <td className={adminStyles.td}>{promotion.promotionId}</td>
                    <td className={adminStyles.td}>
                      <p className="font-semibold text-slate-900">{promotion.name}</p>
                      <p className="mt-1 text-sm text-slate-500">{promotion.description || "Không có mô tả."}</p>
                    </td>
                    <td className={adminStyles.td}>{promotion.discountPercent}%</td>
                    <td className={adminStyles.td}>
                      <p>{formatDate(promotion.startAt)}</p>
                      <p className="text-sm text-slate-500">đến {formatDate(promotion.endAt)}</p>
                    </td>
                    <td className={adminStyles.td}>
                      <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold ${statusMeta.className}`}>
                        {statusMeta.label}
                      </span>
                    </td>
                    <td className={adminStyles.td}>{formatDate(promotion.updatedAt)}</td>
                    <td className={adminStyles.td}>
                      <div className="flex flex-wrap gap-2">
                        <button type="button" className={adminStyles.smallButton} onClick={() => upsertPromotion(promotion)}>
                          Sửa
                        </button>
                        <button type="button" className={adminStyles.smallButton} onClick={() => togglePromotionActive(promotion)}>
                          {promotion.isActive ? "Tạm dừng" : "Kích hoạt"}
                        </button>
                        <button type="button" className={adminStyles.smallDangerButton} onClick={() => removePromotion(promotion)}>
                          Xóa
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
        {!loading ? (
          <AdminPagination
            page={page}
            totalPages={totalPages}
            onPageChange={setPage}
            summary={`Trang ${page} / ${totalPages} - hiển thị ${paginatedPromotions.length} / ${filteredPromotions.length} khuyến mãi`}
          />
        ) : null}
      </div>
      {popupElement}
    </AdminPageShell>
  );
}

