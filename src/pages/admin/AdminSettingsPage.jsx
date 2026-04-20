import { useCallback, useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { AdminErrorBanner, AdminPageShell, AdminSection, adminStyles } from "@/components/admin/admin-ui";
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
      setError("Khong co access token.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const result = await getPolicies({ page: 1, pageSize: 100 }, accessToken);
      setPolicies(result?.items ?? []);
    } catch (requestError) {
      setError(requestError?.message || "Khong tai duoc policies.");
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
      await popupAlert(requestError?.message || "Khong tao duoc policy.");
    }
  }

  async function handleEdit(policy) {
    const nextTitle = await popupPrompt("Sua tieu de:", policy.title || "", {
      title: "Chinh sua policy",
      okText: "Tiep tuc",
      placeholder: "Tieu de",
    });

    if (nextTitle == null) {
      return;
    }

    const nextContent = await popupPrompt("Sua noi dung:", policy.content || "", {
      title: "Chinh sua policy",
      okText: "Luu",
      placeholder: "Noi dung",
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
      await popupAlert(requestError?.message || "Khong sua duoc policy.");
    }
  }

  async function handleDelete(policyId) {
    const isConfirmed = await popupConfirm("Ban co chac muon xoa policy nay?", {
      title: "Xac nhan xoa",
      okText: "Xoa",
      cancelText: "Huy",
    });

    if (!isConfirmed) {
      return;
    }

    try {
      await deletePolicy(policyId, accessToken);
      fetchPolicies();
    } catch (requestError) {
      await popupAlert(requestError?.message || "Khong xoa duoc policy.");
    }
  }

  return (
    <AdminPageShell
      title="Cai Dat Chinh Sach"
      actions={
        <button type="button" onClick={fetchPolicies} className={adminStyles.secondaryButton}>
          Tai lai
        </button>
      }
    >
      <AdminErrorBanner message={error} />

      <AdminSection title="Tao policy moi">
        <form onSubmit={handleCreate} className="space-y-4">
          <input
            value={form.title}
            onChange={(event) => setForm((currentForm) => ({ ...currentForm, title: event.target.value }))}
            placeholder="Tieu de"
            className={adminStyles.input}
            required
          />
          <textarea
            value={form.content}
            onChange={(event) => setForm((currentForm) => ({ ...currentForm, content: event.target.value }))}
            placeholder="Noi dung"
            className={adminStyles.textarea}
            required
          />

          <button type="submit" className={adminStyles.primaryButton}>
            Tao policy
          </button>
        </form>
      </AdminSection>

      <div className={adminStyles.tableWrapper}>
        <table className={adminStyles.table}>
          <thead className={adminStyles.tableHead}>
            <tr>
              <th className={adminStyles.th}>ID</th>
              <th className={adminStyles.th}>Tieu de</th>
              <th className={adminStyles.th}>Noi dung</th>
              <th className={adminStyles.th}>Thao tac</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {!loading && policies.length === 0 ? (
              <tr>
                <td colSpan={4} className={adminStyles.emptyState}>
                  Khong co du lieu.
                </td>
              </tr>
            ) : null}

            {policies.map((policy) => (
              <tr key={policy.policyId}>
                <td className={adminStyles.td}>{policy.policyId}</td>
                <td className={`${adminStyles.td} font-semibold text-slate-950`}>{policy.title}</td>
                <td className={adminStyles.td}>{policy.content}</td>
                <td className={adminStyles.td}>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => handleEdit(policy)}
                      className={adminStyles.smallButton}
                    >
                      Sua
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(policy.policyId)}
                      className={adminStyles.smallDangerButton}
                    >
                      Xoa
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {popupElement}
    </AdminPageShell>
  );
}
