import { useState, useEffect, useCallback } from "react";
import { useSelector } from "react-redux";
import { Search, UserPlus, Shield, X, Loader2, AlertCircle, RefreshCw, Lock, Unlock } from "lucide-react";
import { selectAuthState } from "@/store/auth/authSlice";
import { getUsers, createUser, updateUserStatus } from "@/services/adminService";

// ── Mock data dùng khi chưa có token thật (demo mode) ──────────────────────
const MOCK_USERS = [
  { userId: 1, fullName: "Nguyễn Văn Admin", email: "admin@eyewear.com", phone: "0901234567", role: "Admin", isActive: true, createdAt: "2024-01-01T00:00:00" },
  { userId: 2, fullName: "Trần Thị Staff", email: "staff@eyewear.com", phone: "0902234567", role: "Staff", isActive: true, createdAt: "2024-01-15T00:00:00" },
  { userId: 3, fullName: "Lê Văn Khách", email: "customer@example.com", phone: "0903234567", role: "Customer", isActive: true, createdAt: "2024-03-01T00:00:00" },
  { userId: 4, fullName: "Phạm Thị B", email: "phamthib@email.com", phone: "", role: "Customer", isActive: false, createdAt: "2024-03-10T00:00:00" },
];

export default function AdminUsersPage() {
  const { accessToken } = useSelector(selectAuthState);

  // ── State ─────────────────────────────────────────────────────────────────
  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pageSize: 15, totalItems: 0, totalPages: 1 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(null); // userId đang thực hiện action

  const [searchQuery, setSearchQuery] = useState("");
  const [filterRole, setFilterRole] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");

  const [showModal, setShowModal] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    phone: "",
    role: "Staff",
  });

  // ── Fetch users ───────────────────────────────────────────────────────────
  const fetchUsers = useCallback(async (page = 1) => {
    setLoading(true);
    setError(null);

    // Nếu không có token thật (demo account) → dùng mock data
    if (!accessToken) {
      const filtered = MOCK_USERS.filter((u) => {
        const matchesSearch =
          !searchQuery ||
          u.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          u.email.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesRole = filterRole === "all" || u.role.toLowerCase() === filterRole.toLowerCase();
        const matchesStatus =
          filterStatus === "all" ||
          (filterStatus === "active" && u.isActive !== false) ||
          (filterStatus === "inactive" && u.isActive === false);
        return matchesSearch && matchesRole && matchesStatus;
      });
      setUsers(filtered);
      setPagination({ page: 1, pageSize: 15, totalItems: filtered.length, totalPages: 1 });
      setLoading(false);
      return;
    }

    try {
      const result = await getUsers(
        {
          page,
          pageSize: pagination.pageSize,
          search: searchQuery || undefined,
          role: filterRole !== "all" ? filterRole : undefined,
          status: filterStatus !== "all" ? filterStatus : undefined,
        },
        accessToken
      );
      setUsers(result.items ?? []);
      setPagination({
        page: result.page ?? page,
        pageSize: result.pageSize ?? 15,
        totalItems: result.totalItems ?? 0,
        totalPages: result.totalPages ?? 1,
      });
    } catch (err) {
      setError(err.message || "Không thể tải danh sách người dùng.");
    } finally {
      setLoading(false);
    }
  }, [accessToken, searchQuery, filterRole, filterStatus, pagination.pageSize]);

  // Gọi lại khi filter thay đổi
  useEffect(() => {
    const timer = setTimeout(() => fetchUsers(1), 400); // debounce search
    return () => clearTimeout(timer);
  }, [searchQuery, filterRole, filterStatus]);

  // Initial load
  useEffect(() => {
    fetchUsers(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Toggle trạng thái user ─────────────────────────────────────────────────
  const handleToggleStatus = async (user) => {
    const newStatus = user.isActive === false; // toggle
    setActionLoading(user.userId);
    try {
      await updateUserStatus(user.userId, newStatus, accessToken);
      // Cập nhật local state không cần reload
      setUsers((prev) =>
        prev.map((u) =>
          u.userId === user.userId ? { ...u, isActive: newStatus } : u
        )
      );
    } catch (err) {
      alert(`Lỗi: ${err.message || "Không thể cập nhật trạng thái."}`);
    } finally {
      setActionLoading(null);
    }
  };

  // ── Tạo user mới ───────────────────────────────────────────────────────────
  const handleOpenModal = () => {
    setFormData({ fullName: "", email: "", password: "", phone: "", role: "Staff" });
    setSubmitError(null);
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitLoading(true);
    setSubmitError(null);
    try {
      await createUser(
        {
          fullName: formData.fullName.trim(),
          email: formData.email.trim().toLowerCase(),
          password: formData.password,
          phone: formData.phone?.trim() || null,
          role: formData.role,
        },
        accessToken
      );
      setShowModal(false);
      fetchUsers(pagination.page); // Reload danh sách
    } catch (err) {
      setSubmitError(err.message || "Không thể tạo người dùng. Vui lòng thử lại.");
    } finally {
      setSubmitLoading(false);
    }
  };

  // ── Helpers UI ────────────────────────────────────────────────────────────
  const getRoleColor = (role) => {
    const r = (role ?? "").toLowerCase();
    switch (r) {
      case "admin": return "bg-red-100 text-red-800 border-red-300";
      case "staff": return "bg-blue-100 text-blue-800 border-blue-300";
      case "customer": return "bg-green-100 text-green-800 border-green-300";
      default: return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  const getRoleLabel = (role) => {
    const r = (role ?? "").toLowerCase();
    switch (r) {
      case "admin": return "Quản trị viên";
      case "staff": return "Nhân viên";
      case "customer": return "Khách hàng";
      default: return role ?? "—";
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Header */}
        <div className="bg-white rounded-2xl border-2 border-gray-300 shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl mb-2 font-bold text-gray-900">Quản Lý Người Dùng</h1>
              <p className="text-gray-600 font-medium">
                Tổng số:{" "}
                <span className="font-bold text-primary">
                  {loading ? "..." : pagination.totalItems}
                </span>{" "}
                người dùng
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => fetchUsers(pagination.page)}
                disabled={loading}
                className="p-2.5 border-2 border-gray-300 rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-50"
                title="Tải lại"
              >
                <RefreshCw className={`w-5 h-5 text-gray-600 ${loading ? "animate-spin" : ""}`} />
              </button>
              <button
                onClick={handleOpenModal}
                className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-xl hover:bg-primary/90 transition-all shadow-lg shadow-primary/30 font-bold border-2 border-primary"
              >
                <UserPlus className="w-5 h-5" />
                Thêm Người Dùng
              </button>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl border-2 border-gray-300 shadow-sm p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Tìm kiếm theo tên hoặc email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
              />
            </div>
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:border-primary font-medium"
            >
              <option value="all">Tất cả vai trò</option>
              <option value="Admin">Admin</option>
              <option value="Staff">Nhân viên</option>
              <option value="Customer">Khách hàng</option>
            </select>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:border-primary font-medium"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="active">Hoạt động</option>
              <option value="inactive">Bị khóa</option>
            </select>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-center gap-3 bg-red-50 border-2 border-red-200 rounded-2xl p-4 mb-6 text-red-700 font-medium">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            {error}
            <button
              onClick={() => fetchUsers(1)}
              className="ml-auto text-sm underline"
            >
              Thử lại
            </button>
          </div>
        )}

        {/* Table */}
        <div className="bg-white rounded-2xl border-2 border-gray-300 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-100 border-b-2 border-gray-300">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-bold text-gray-900">Người dùng</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-gray-900">Email</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-gray-900">SĐT</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-gray-900">Vai trò</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-gray-900">Trạng thái</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-gray-900">Ngày tạo</th>
                  <th className="px-6 py-4 text-right text-sm font-bold text-gray-900">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y-2 divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center">
                      <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-2" />
                      <p className="text-gray-500 font-medium">Đang tải...</p>
                    </td>
                  </tr>
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-gray-500 font-medium">
                      Không tìm thấy người dùng nào
                    </td>
                  </tr>
                ) : (
                  users.map((user) => (
                    <tr key={user.userId} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center border-2 border-primary/20 flex-shrink-0">
                            <span className="text-sm font-bold text-primary">
                              {(user.fullName ?? user.email ?? "?").charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <span className="font-bold text-gray-900">{user.fullName ?? "—"}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-700">{user.email}</td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-600">{user.phone ?? "—"}</td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold border-2 ${getRoleColor(user.role)}`}>
                          <Shield className="w-3 h-3 inline mr-1" />
                          {getRoleLabel(user.role)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-bold border-2 ${
                            user.isActive !== false
                              ? "bg-green-100 text-green-800 border-green-300"
                              : "bg-gray-100 text-gray-600 border-gray-300"
                          }`}
                        >
                          {user.isActive !== false ? "Hoạt động" : "Đã khóa"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-600">
                        {user.createdAt
                          ? new Date(user.createdAt).toLocaleDateString("vi-VN")
                          : "—"}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end">
                          <button
                            onClick={() => handleToggleStatus(user)}
                            disabled={actionLoading === user.userId}
                            title={user.isActive !== false ? "Khóa tài khoản" : "Mở khóa tài khoản"}
                            className={`p-2 rounded-lg transition-colors border-2 border-transparent ${
                              user.isActive !== false
                                ? "hover:bg-red-50 hover:border-red-400"
                                : "hover:bg-green-50 hover:border-green-400"
                            } disabled:opacity-50`}
                          >
                            {actionLoading === user.userId ? (
                              <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
                            ) : user.isActive !== false ? (
                              <Lock className="w-5 h-5 text-red-500" />
                            ) : (
                              <Unlock className="w-5 h-5 text-green-600" />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {!loading && pagination.totalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-4 border-t-2 border-gray-200 bg-gray-50">
              <p className="text-sm text-gray-600 font-medium">
                Trang {pagination.page} / {pagination.totalPages} &nbsp;·&nbsp; {pagination.totalItems} người dùng
              </p>
              <div className="flex gap-2">
                <button
                  disabled={pagination.page <= 1}
                  onClick={() => fetchUsers(pagination.page - 1)}
                  className="px-4 py-2 text-sm font-bold border-2 border-gray-300 rounded-xl hover:bg-gray-100 disabled:opacity-40 transition-colors"
                >
                  ← Trước
                </button>
                <button
                  disabled={pagination.page >= pagination.totalPages}
                  onClick={() => fetchUsers(pagination.page + 1)}
                  className="px-4 py-2 text-sm font-bold border-2 border-gray-300 rounded-xl hover:bg-gray-100 disabled:opacity-40 transition-colors"
                >
                  Sau →
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal Tạo User */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full border-2 border-gray-300 shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b-2 border-gray-300">
              <h2 className="text-2xl font-bold text-gray-900">Thêm Người Dùng Mới</h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors border-2 border-transparent hover:border-gray-300"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {submitError && (
                <div className="flex items-center gap-2 bg-red-50 border-2 border-red-200 rounded-xl p-3 text-red-700 text-sm font-medium">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {submitError}
                </div>
              )}

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Họ tên <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                  placeholder="Nhập họ tên"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                  placeholder="email@example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Mật khẩu <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                  placeholder="Tối thiểu 6 ký tự"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Số điện thoại</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                  placeholder="0901234567"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Vai trò <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:border-primary"
                >
                  <option value="Staff">Nhân viên (Staff)</option>
                  <option value="Admin">Quản trị viên (Admin)</option>
                </select>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="submit"
                  disabled={submitLoading}
                  className="flex-1 py-3 bg-primary text-white rounded-xl hover:bg-primary/90 transition-colors font-bold text-lg border-2 border-primary disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {submitLoading && <Loader2 className="w-5 h-5 animate-spin" />}
                  {submitLoading ? "Đang tạo..." : "Thêm Người Dùng"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  disabled={submitLoading}
                  className="flex-1 py-3 border-2 border-gray-300 rounded-xl hover:bg-gray-50 transition-colors font-bold text-lg"
                >
                  Hủy
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
