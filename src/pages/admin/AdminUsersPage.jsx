import { useCallback, useEffect, useState } from "react";
import { useSelector } from "react-redux";
import {
  AlertCircle,
  Loader2,
  Lock,
  RefreshCw,
  Search,
  Shield,
  Unlock,
  UserPlus,
  X,
} from "lucide-react";
import { AdminErrorBanner, AdminPageShell, AdminPagination, AdminSection, adminStyles } from "@/components/admin/admin-ui";
import { createUser, getUsers, updateUserStatus } from "@/services/adminService";
import { selectAuthState } from "@/store/auth/authSlice";

function getRoleClassName(role) {
  switch ((role ?? "").toLowerCase()) {
    case "admin":
      return "border-red-200 bg-red-50 text-red-700";
    case "staff":
      return "border-sky-200 bg-sky-50 text-sky-700";
    case "customer":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    default:
      return "border-slate-200 bg-slate-50 text-slate-700";
  }
}

function getRoleLabel(role) {
  switch ((role ?? "").toLowerCase()) {
    case "admin":
      return "Admin";
    case "staff":
      return "Nhân viên";
    case "customer":
      return "Khách hàng";
    default:
      return role ?? "-";
  }
}

function formatCreatedDate(user) {
  const value =
    user.createdAt ??
    user.created_at ??
    user.createdDate ??
    user.createdOn ??
    user.createAt ??
    user.registeredAt;
  return value ? new Date(value).toLocaleDateString("vi-VN") : "-";
}

export default function AdminUsersPage() {
  const { accessToken } = useSelector(selectAuthState);

  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pageSize: 10, totalItems: 0, totalPages: 1 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [filterRole, setFilterRole] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");

  const [showMởdal, setShowMởdal] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    phone: "",
    role: "Staff",
  });

  const fetchUsers = useCallback(
    async (page = 1) => {
      setLoading(true);
      setError("");

      try {
        if (!accessToken) {
          throw new Error("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
        }

        const result = await getUsers(
          {
            page,
            pageSize: pagination.pageSize,
            search: searchQuery || undefined,
            role: filterRole !== "all" ? filterRole : undefined,
            status: filterStatus !== "all" ? filterStatus : undefined,
          },
          accessToken,
        );

        setUsers(result.items ?? []);
        setPagination({
          page: result.page ?? page,
          pageSize: result.pageSize ?? pagination.pageSize,
          totalItems: result.totalItems ?? 0,
          totalPages: result.totalPages ?? 1,
        });
      } catch (fetchError) {
        setUsers([]);
        setPagination((current) => ({ ...current, page, totalItems: 0, totalPages: 1 }));
        setError(fetchError.message || "Không thể tải danh sách người dùng.");
      } finally {
        setLoading(false);
      }
    },
    [accessToken, filterRole, filterStatus, pagination.pageSize, searchQuery],
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      void fetchUsers(1);
    }, 350);

    return () => clearTimeout(timer);
  }, [fetchUsers]);

  const handleToggleStatus = async (user) => {
    setActionLoading(user.userId);

    try {
      if (!accessToken) {
        throw new Error("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
      }

      const nextStatus = user.isActive === false;
      await updateUserStatus(user.userId, nextStatus, accessToken);
      setUsers((current) => current.map((item) => (item.userId === user.userId ? { ...item, isActive: nextStatus } : item)));
    } catch (updateError) {
      setError(updateError.message || "Không thể cập nhật trạng thái người dùng.");
    } finally {
      setActionLoading(null);
    }
  };

  const openCreateMởdal = () => {
    setFormData({
      fullName: "",
      email: "",
      password: "",
      phone: "",
      role: "Staff",
    });
    setSubmitError("");
    setShowMởdal(true);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitLoading(true);
    setSubmitError("");

    try {
      if (!accessToken) {
        throw new Error("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
      }

      await createUser(
        {
          fullName: formData.fullName.trim(),
          email: formData.email.trim().toLowerCase(),
          password: formData.password,
          phone: formData.phone.trim() || null,
          role: formData.role,
        },
        accessToken,
      );

      setShowMởdal(false);
      await fetchUsers(1);
    } catch (createError) {
      setSubmitError(createError.message || "Không thể tạo người dùng mới.");
    } finally {
      setSubmitLoading(false);
    }
  };

  return (
    <AdminPageShell
      title="Quản Lý Người Dùng"
      actions={
        <>
          <button type="button" className={adminStyles.secondaryButton} onClick={() => fetchUsers(pagination.page)} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Tải lại
          </button>
          <button type="button" className={adminStyles.primaryButton} onClick={openCreateMởdal}>
            <UserPlus className="h-4 w-4" />
            Thêm người dùng
          </button>
        </>
      }
    >
      <AdminSection subtitle={`Tổng số: ${loading ? "..." : pagination.totalItems} người dùng`}>
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_220px_220px]">
          <label className="relative block">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              placeholder="Tìm theo tên hoặc email..."
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              className={`${adminStyles.input} pl-12`}
            />
          </label>
          <select value={filterRole} onChange={(event) => setFilterRole(event.target.value)} className={adminStyles.input}>
            <option value="all">Tất cả vai trò</option>
            <option value="Admin">Admin</option>
            <option value="Staff">Nhân viên</option>
            <option value="Customer">Khách hàng</option>
          </select>
          <select value={filterStatus} onChange={(event) => setFilterStatus(event.target.value)} className={adminStyles.input}>
            <option value="all">Tất cả trạng thái</option>
            <option value="active">Hoạt động</option>
            <option value="inactive">Bị khóa</option>
          </select>
        </div>
      </AdminSection>

      <AdminErrorBanner message={error} />

      <AdminSection title="Danh sách người dùng" bodyClassName="p-0">
        <div className={adminStyles.tableWrapper}>
          <table className={adminStyles.table}>
            <thead className={adminStyles.tableHead}>
              <tr>
                <th className={adminStyles.th}>Người dùng</th>
                <th className={adminStyles.th}>Email</th>
                <th className={adminStyles.th}>Số điện thoại</th>
                <th className={adminStyles.th}>Vai trò</th>
                <th className={adminStyles.th}>Trạng thái</th>
                <th className={adminStyles.th}>Ngày tạo</th>
                <th className={`${adminStyles.th} text-right`}>Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {loading ? (
                <tr>
                  <td colSpan={7} className={adminStyles.emptyState}>
                    <Loader2 className="mx-auto h-8 w-8 animate-spin text-orange-500" />
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={7} className={adminStyles.emptyState}>
                    Không tìm thấy người dùng nào.
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.userId} className="transition hover:bg-orange-50/40">
                    <td className={adminStyles.td}>
                      <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-orange-100 font-bold text-orange-700">
                          {(user.fullName ?? user.email ?? "?").charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold text-[#11284b]">{user.fullName ?? "-"}</p>
                          <p className="text-sm text-slate-500">ID: {user.userId}</p>
                        </div>
                      </div>
                    </td>
                    <td className={adminStyles.td}>{user.email ?? "-"}</td>
                    <td className={adminStyles.td}>{user.phone || "-"}</td>
                    <td className={adminStyles.td}>
                      <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-bold ${getRoleClassName(user.role)}`}>
                        <Shield className="h-3.5 w-3.5" />
                        {getRoleLabel(user.role)}
                      </span>
                    </td>
                    <td className={adminStyles.td}>
                      <span
                        className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold ${
                          user.isActive !== false
                            ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                            : "border-slate-200 bg-slate-50 text-slate-600"
                        }`}
                      >
                        {user.isActive !== false ? "Hoạt động" : "Đã khóa"}
                      </span>
                    </td>
                    <td className={adminStyles.td}>
                      {formatCreatedDate(user)}
                    </td>
                    <td className={`${adminStyles.td} text-right`}>
                      <button
                        type="button"
                        onClick={() => handleToggleStatus(user)}
                        className={adminStyles.smallButton}
                        disabled={actionLoading === user.userId}
                      >
                        {actionLoading === user.userId ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : user.isActive !== false ? (
                          <>
                            <Lock className="h-4 w-4 text-red-500" />
                            Khóa
                          </>
                        ) : (
                          <>
                            <Unlock className="h-4 w-4 text-emerald-600" />
                            Mở khóa
                          </>
                        )}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <AdminPagination
          page={pagination.page}
          totalPages={pagination.totalPages}
          onPageChange={(nextPage) => {
            void fetchUsers(nextPage);
          }}
        />
      </AdminSection>

      {showMởdal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-[1.8rem] border border-orange-200 bg-white shadow-[0_24px_48px_rgba(15,23,42,0.18)]">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
              <div>
                <h2 className="text-3xl font-bold text-[#11284b]">Thêm người dùng mới</h2>
                <p className="mt-1 text-sm text-slate-500">Tạo tài khoản admin hoặc nhân viên mới.</p>
              </div>
              <button type="button" className={adminStyles.secondaryButton} onClick={() => setShowMởdal(false)} disabled={submitLoading}>
                <X className="h-4 w-4" />
                Đóng
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5 p-6">
              <AdminErrorBanner message={submitError} />

              <div className="grid gap-5 md:grid-cols-2">
                <label className="space-y-2">
                  <span className="text-sm font-semibold text-[#11284b]">Họ tên</span>
                  <input
                    required
                    value={formData.fullName}
                    onChange={(event) => setFormData((current) => ({ ...current, fullName: event.target.value }))}
                    className={adminStyles.input}
                    placeholder="Nhập họ tên"
                  />
                </label>
                <label className="space-y-2">
                  <span className="text-sm font-semibold text-[#11284b]">Email</span>
                  <input
                    required
                    type="email"
                    value={formData.email}
                    onChange={(event) => setFormData((current) => ({ ...current, email: event.target.value }))}
                    className={adminStyles.input}
                    placeholder="staff@example.com"
                  />
                </label>
                <label className="space-y-2">
                  <span className="text-sm font-semibold text-[#11284b]">Mật khẩu</span>
                  <input
                    required
                    minLength={6}
                    type="password"
                    value={formData.password}
                    onChange={(event) => setFormData((current) => ({ ...current, password: event.target.value }))}
                    className={adminStyles.input}
                    placeholder="Tối thiểu 6 ký tự"
                  />
                </label>
                <label className="space-y-2">
                  <span className="text-sm font-semibold text-[#11284b]">Số điện thoại</span>
                  <input
                    value={formData.phone}
                    onChange={(event) => setFormData((current) => ({ ...current, phone: event.target.value }))}
                    className={adminStyles.input}
                    placeholder="0901234567"
                  />
                </label>
              </div>

              <label className="space-y-2">
                <span className="text-sm font-semibold text-[#11284b]">Vai trò</span>
                <select
                  value={formData.role}
                  onChange={(event) => setFormData((current) => ({ ...current, role: event.target.value }))}
                  className={adminStyles.input}
                >
                  <option value="Staff">Nhân viên</option>
                  <option value="Admin">Admin</option>
                </select>
              </label>

              <div className="flex flex-col gap-3 pt-2 md:flex-row">
                <button type="submit" className={adminStyles.primaryButton} disabled={submitLoading}>
                  {submitLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  {submitLoading ? "Đang tạo..." : "Tạo người dùng"}
                </button>
                <button type="button" className={adminStyles.secondaryButton} onClick={() => setShowMởdal(false)} disabled={submitLoading}>
                  Hủy
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </AdminPageShell>
  );
}
