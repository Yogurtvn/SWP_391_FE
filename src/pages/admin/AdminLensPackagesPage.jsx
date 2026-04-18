import { useCallback, useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { selectAuthState } from "@/store/auth/authSlice";
import { usePopupDialog } from "@/components/common/ui/usePopupDialog";
import {
  createLensType,
  getLensTypes,
  updateLensTypeStatus,
} from "@/services/adminService";

export default function AdminLensPackagesPage() {
  const { accessToken } = useSelector(selectAuthState);
  const { popupAlert, popupElement } = usePopupDialog();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ lensCode: "", lensName: "", price: "", description: "" });

  const fetchLensTypes = useCallback(async () => {
    if (!accessToken) {
      setError("Không có access token.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const result = await getLensTypes({ page: 1, pageSize: 100, sortBy: "lensCode", sortOrder: "asc" }, accessToken);
      setItems(result?.items ?? []);
    } catch (requestError) {
      setError(requestError?.message || "Không tải được gói tròng kính.");
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    fetchLensTypes();
  }, [fetchLensTypes]);

  async function handleCreate(event) {
    event.preventDefault();

    try {
      await createLensType(
        {
          lensCode: form.lensCode.trim(),
          lensName: form.lensName.trim(),
          price: Number(form.price || 0),
          description: form.description.trim() || null,
          isActive: true,
        },
        accessToken,
      );

      setForm({ lensCode: "", lensName: "", price: "", description: "" });
      fetchLensTypes();
    } catch (requestError) {
      await popupAlert(requestError?.message || "Không tạo được lens type.");
    }
  }

  async function handleToggle(item) {
    try {
      await updateLensTypeStatus(item.lensTypeId, !item.isActive, accessToken);
      fetchLensTypes();
    } catch (requestError) {
      await popupAlert(requestError?.message || "Không cập nhật được trạng thái.");
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Gói Tròng Kính</h1>
        <button type="button" onClick={fetchLensTypes} className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold">
          Tải lại
        </button>
      </div>

      {error ? <p className="mb-4 rounded-lg bg-red-50 p-3 text-red-700">{error}</p> : null}

      <form onSubmit={handleCreate} className="mb-6 rounded-xl border border-gray-200 bg-white p-4">
        <h2 className="mb-3 text-lg font-semibold">Tạo gói mới</h2>
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
          <input
            value={form.lensCode}
            onChange={(event) => setForm((currentForm) => ({ ...currentForm, lensCode: event.target.value }))}
            placeholder="Mã lens"
            className="rounded-md border border-gray-300 px-3 py-2"
            required
          />
          <input
            value={form.lensName}
            onChange={(event) => setForm((currentForm) => ({ ...currentForm, lensName: event.target.value }))}
            placeholder="Tên lens"
            className="rounded-md border border-gray-300 px-3 py-2"
            required
          />
          <input
            type="number"
            min="0"
            value={form.price}
            onChange={(event) => setForm((currentForm) => ({ ...currentForm, price: event.target.value }))}
            placeholder="Giá"
            className="rounded-md border border-gray-300 px-3 py-2"
            required
          />
          <input
            value={form.description}
            onChange={(event) => setForm((currentForm) => ({ ...currentForm, description: event.target.value }))}
            placeholder="Mô tả"
            className="rounded-md border border-gray-300 px-3 py-2"
          />
        </div>

        <button type="submit" className="mt-3 rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white">
          Tạo
        </button>
      </form>

      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-bold uppercase text-gray-600">ID</th>
              <th className="px-4 py-3 text-left text-xs font-bold uppercase text-gray-600">Mã</th>
              <th className="px-4 py-3 text-left text-xs font-bold uppercase text-gray-600">Tên</th>
              <th className="px-4 py-3 text-left text-xs font-bold uppercase text-gray-600">Giá</th>
              <th className="px-4 py-3 text-left text-xs font-bold uppercase text-gray-600">Trạng thái</th>
              <th className="px-4 py-3 text-left text-xs font-bold uppercase text-gray-600">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {!loading && items.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-sm text-gray-500">Không có dữ liệu.</td>
              </tr>
            ) : null}

            {items.map((item) => (
              <tr key={item.lensTypeId}>
                <td className="px-4 py-3 text-sm text-gray-700">{item.lensTypeId}</td>
                <td className="px-4 py-3 text-sm font-semibold text-gray-900">{item.lensCode}</td>
                <td className="px-4 py-3 text-sm text-gray-700">{item.lensName}</td>
                <td className="px-4 py-3 text-sm text-gray-700">{Number(item.price).toLocaleString("vi-VN")} đ</td>
                <td className="px-4 py-3 text-sm text-gray-700">{item.isActive ? "Hoạt động" : "Ngừng"}</td>
                <td className="px-4 py-3 text-sm">
                  <button
                    type="button"
                    onClick={() => handleToggle(item)}
                    className="rounded-md border border-gray-300 px-2 py-1 text-xs font-semibold"
                  >
                    {item.isActive ? "Khóa" : "Mở"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {popupElement}
    </div>
  );
}
