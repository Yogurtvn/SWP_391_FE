import { useEffect, useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { AdminErrorBanner, AdminPageShell, AdminPagination, adminStyles } from "@/components/admin/admin-ui";
import { useAdminLensPackagesPage } from "@/hooks/admin/useAdminLensPackagesPage";

const PAGE_SIZE = 10;

export default function AdminLensPackagesPage() {
  const { items, ui, actions, popupElement } = useAdminLensPackagesPage();
  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(items.length / PAGE_SIZE));
  const paginatedItems = useMemo(() => items.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE), [items, page]);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  return (
    <AdminPageShell
      title="Gói Tròng Kính"
      actions={
        <>
          <button type="button" onClick={actions.retry} className={adminStyles.secondaryButton}>
            Tải lại
          </button>
          <button type="button" onClick={actions.createLens} className={adminStyles.primaryButton}>
            <Plus className="h-4 w-4" />
            Tạo
          </button>
        </>
      }
    >
      <AdminErrorBanner message={ui.error} />

      <div className={adminStyles.tableWrapper}>
        <table className={adminStyles.table}>
          <thead className={adminStyles.tableHead}>
            <tr>
              <th className={adminStyles.th}>ID</th>
              <th className={adminStyles.th}>Mã</th>
              <th className={adminStyles.th}>Tên</th>
              <th className={adminStyles.th}>Giá</th>
              <th className={adminStyles.th}>Trạng thái</th>
              <th className={adminStyles.th}>Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {!ui.isLoading && items.length === 0 ? (
              <tr>
                <td colSpan={6} className={adminStyles.emptyState}>
                  Không có dữ liệu.
                </td>
              </tr>
            ) : null}

            {paginatedItems.map((item) => (
              <tr key={item.lensTypeId}>
                <td className={adminStyles.td}>{item.lensTypeId}</td>
                <td className={`${adminStyles.td} font-semibold text-slate-950`}>{item.lensCode}</td>
                <td className={adminStyles.td}>{item.lensName}</td>
                <td className={adminStyles.td}>{Number(item.price).toLocaleString("vi-VN")} đ</td>
                <td className={adminStyles.td}>{item.isActive ? "Hoạt động" : "Ngừng"}</td>
                <td className={adminStyles.td}>
                  <div className="flex flex-wrap gap-2">
                    <button type="button" onClick={() => actions.editLens(item)} className={adminStyles.smallButton}>
                      Sửa
                    </button>
                    <button type="button" onClick={() => actions.toggleLens(item)} className={adminStyles.smallButton}>
                      {item.isActive ? "Khóa" : "Mở"}
                    </button>
                    <button
                      type="button"
                      onClick={() => actions.deleteLens(item)}
                      className={adminStyles.smallDangerButton}
                    >
                      Xóa
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <AdminPagination
          page={page}
          totalPages={totalPages}
          onPageChange={setPage}
          summary={`Trang ${page} / ${totalPages} - hiển thị ${paginatedItems.length} / ${items.length} gói`}
        />
      </div>
      {popupElement}
    </AdminPageShell>
  );
}
