import { AdminErrorBanner, AdminPageShell, AdminSection, adminStyles } from "@/components/admin/admin-ui";
import { useAdminLensPackagesPage } from "@/hooks/admin/useAdminLensPackagesPage";

export default function AdminLensPackagesPage() {
  const { items, form, ui, actions, popupElement } = useAdminLensPackagesPage();

  return (
    <AdminPageShell
      title="Goi Trong Kinh"
      actions={
        <button type="button" onClick={actions.retry} className={adminStyles.secondaryButton}>
          Tai lai
        </button>
      }
    >
      <AdminErrorBanner message={ui.error} />

      <AdminSection title="Tao goi moi">
        <form onSubmit={actions.createLens} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <input
              value={form.lensCode}
              onChange={(event) => actions.setFormField("lensCode", event.target.value)}
              placeholder="Ma lens"
              className={adminStyles.input}
              required
            />
            <input
              value={form.lensName}
              onChange={(event) => actions.setFormField("lensName", event.target.value)}
              placeholder="Ten lens"
              className={adminStyles.input}
              required
            />
            <input
              type="number"
              min="0"
              value={form.price}
              onChange={(event) => actions.setFormField("price", event.target.value)}
              placeholder="Gia"
              className={adminStyles.input}
              required
            />
            <input
              value={form.description}
              onChange={(event) => actions.setFormField("description", event.target.value)}
              placeholder="Mo ta"
              className={adminStyles.input}
            />
          </div>

          <button type="submit" className={adminStyles.primaryButton}>
            Tao
          </button>
        </form>
      </AdminSection>

      <div className={adminStyles.tableWrapper}>
        <table className={adminStyles.table}>
          <thead className={adminStyles.tableHead}>
            <tr>
              <th className={adminStyles.th}>ID</th>
              <th className={adminStyles.th}>Ma</th>
              <th className={adminStyles.th}>Ten</th>
              <th className={adminStyles.th}>Gia</th>
              <th className={adminStyles.th}>Trang thai</th>
              <th className={adminStyles.th}>Thao tac</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {!ui.isLoading && items.length === 0 ? (
              <tr>
                <td colSpan={6} className={adminStyles.emptyState}>
                  Khong co du lieu.
                </td>
              </tr>
            ) : null}

            {items.map((item) => (
              <tr key={item.lensTypeId}>
                <td className={adminStyles.td}>{item.lensTypeId}</td>
                <td className={`${adminStyles.td} font-semibold text-slate-950`}>{item.lensCode}</td>
                <td className={adminStyles.td}>{item.lensName}</td>
                <td className={adminStyles.td}>{Number(item.price).toLocaleString("vi-VN")} d</td>
                <td className={adminStyles.td}>{item.isActive ? "Hoat dong" : "Ngung"}</td>
                <td className={adminStyles.td}>
                  <div className="flex flex-wrap gap-2">
                    <button type="button" onClick={() => actions.editLens(item)} className={adminStyles.smallButton}>
                      Sua
                    </button>
                    <button type="button" onClick={() => actions.toggleLens(item)} className={adminStyles.smallButton}>
                      {item.isActive ? "Khoa" : "Mo"}
                    </button>
                    <button
                      type="button"
                      onClick={() => actions.deleteLens(item)}
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
