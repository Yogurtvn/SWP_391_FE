import { useCallback, useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { selectAuthState } from "@/store/auth/authSlice";
import { usePopupDialog } from "@/components/common/ui/usePopupDialog";
import { createPolicy, deletePolicy, getPolicies, updatePolicy } from "@/services/adminService";

export default function AdminSettingsPage() {
  const { accessToken } = useSelector(selectAuthState);
  const { popupAlert, popupConfirm, popupPrompt, popupElement } = usePopupDialog();
  const [policies, setPolicies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ title: "", content: "" });

  const fetchPolicies = useCallback(async () => {
    if (!accessToken) {
      setError("Không có access token.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const result = await getPolicies({ page: 1, pageSize: 100 }, accessToken);
      setPolicies(result?.items ?? []);
    } catch (requestError) {
      setError(requestError?.message || "Không tải được policies.");
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    fetchPolicies();
  }, [fetchPolicies]);

  async function handleCreate(event) {
    event.preventDefault();

    try {
      await createPolicy(
        {
          title: form.title.trim(),
          content: form.content.trim(),
        },
        accessToken,
      );

      setForm({ title: "", content: "" });
      fetchPolicies();
    } catch (requestError) {
      await popupAlert(requestError?.message || "Không tạo được policy.");
    }
  }

  async function handleEdit(policy) {
    const nextTitle = await popupPrompt("Sửa tiêu đề:", policy.title || "", {
      title: "Chỉnh sửa policy",
      okText: "Tiếp tục",
      placeholder: "Tiêu đề",
    });

    if (nextTitle == null) {
      return;
    }

    const nextContent = await popupPrompt("Sửa nội dung:", policy.content || "", {
      title: "Chỉnh sửa policy",
      okText: "Lưu",
      placeholder: "Nội dung",
    });

    if (nextContent == null) {
      return;
    }

    try {
      await updatePolicy(
        policy.policyId,
        {
          title: nextTitle,
          content: nextContent,
        },
        accessToken,
      );
      fetchPolicies();
    } catch (requestError) {
      await popupAlert(requestError?.message || "Không sửa được policy.");
    }
  }

  async function handleDelete(policyId) {
    const isConfirmed = await popupConfirm("Bạn có chắc muốn xóa policy này?", {
      title: "Xác nhận xóa",
      okText: "Xóa",
      cancelText: "Hủy",
    });

    if (!isConfirmed) {
      return;
    }

    try {
      await deletePolicy(policyId, accessToken);
      fetchPolicies();
    } catch (requestError) {
      await popupAlert(requestError?.message || "Không xóa được policy.");
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Cài Đặt Chính Sách</h1>
        <button
          type="button"
          onClick={fetchPolicies}
          className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold"
        >
          Tải lại
        </button>
      </div>

      {error ? <p className="mb-4 rounded-lg bg-red-50 p-3 text-red-700">{error}</p> : null}

      <form onSubmit={handleCreate} className="mb-6 rounded-xl border border-gray-200 bg-white p-4">
        <h2 className="mb-3 text-lg font-semibold">Tạo policy mới</h2>
        <div className="grid gap-3">
          <input
            value={form.title}
            onChange={(event) => setForm((currentForm) => ({ ...currentForm, title: event.target.value }))}
            placeholder="Tiêu đề"
            className="rounded-md border border-gray-300 px-3 py-2"
            required
          />
          <textarea
            value={form.content}
            onChange={(event) => setForm((currentForm) => ({ ...currentForm, content: event.target.value }))}
            placeholder="Nội dung"
            className="min-h-28 rounded-md border border-gray-300 px-3 py-2"
            required
          />
        </div>

        <button type="submit" className="mt-3 rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white">
          Tạo policy
        </button>
      </form>

      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-bold uppercase text-gray-600">ID</th>
              <th className="px-4 py-3 text-left text-xs font-bold uppercase text-gray-600">Tiêu đề</th>
              <th className="px-4 py-3 text-left text-xs font-bold uppercase text-gray-600">Nội dung</th>
              <th className="px-4 py-3 text-left text-xs font-bold uppercase text-gray-600">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {!loading && policies.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-sm text-gray-500">Không có dữ liệu.</td>
              </tr>
            ) : null}

            {policies.map((policy) => (
              <tr key={policy.policyId}>
                <td className="px-4 py-3 text-sm text-gray-700">{policy.policyId}</td>
                <td className="px-4 py-3 text-sm font-semibold text-gray-900">{policy.title}</td>
                <td className="px-4 py-3 text-sm text-gray-700">{policy.content}</td>
                <td className="px-4 py-3 text-sm">
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => handleEdit(policy)}
                      className="rounded-md border border-gray-300 px-2 py-1 text-xs font-semibold"
                    >
                      Sửa
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(policy.policyId)}
                      className="rounded-md border border-gray-300 px-2 py-1 text-xs font-semibold"
                    >
                      Xóa
                    </button>
                  </div>
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
