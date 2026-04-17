import { useState } from "react";
import { Search, UserPlus, Edit, Trash2, Shield, X } from "lucide-react";
function AdminUsersPage() {
  const [users, setUsers] = useState([
    {
      id: "1",
      name: "Admin User",
      email: "admin@visiondirect.com",
      role: "admin",
      status: "active",
      createdAt: "2024-01-01T00:00:00"
    },
    {
      id: "2",
      name: "Manager User",
      email: "manager@visiondirect.com",
      role: "manager",
      status: "active",
      createdAt: "2024-01-15T00:00:00"
    },
    {
      id: "3",
      name: "Nguy\u1EC5n V\u0103n A",
      email: "nguyenvana@email.com",
      role: "customer",
      status: "active",
      createdAt: "2024-03-01T00:00:00"
    },
    {
      id: "4",
      name: "Tr\u1EA7n Th\u1ECB B",
      email: "tranthib@email.com",
      role: "customer",
      status: "active",
      createdAt: "2024-03-10T00:00:00"
    }
  ]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterRole, setFilterRole] = useState("all");
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    role: "customer"
  });
  const filteredUsers = users.filter((user) => {
    const matchesSearch = user.name.toLowerCase().includes(searchQuery.toLowerCase()) || user.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = filterRole === "all" || user.role === filterRole;
    return matchesSearch && matchesRole;
  });
  const handleAddNew = () => {
    setEditingUser(null);
    setFormData({ name: "", email: "", role: "customer" });
    setShowModal(true);
  };
  const handleEdit = (user) => {
    setEditingUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      role: user.role
    });
    setShowModal(true);
  };
  const handleDelete = (id) => {
    if (confirm("B\u1EA1n c\xF3 ch\u1EAFc mu\u1ED1n x\xF3a ng\u01B0\u1EDDi d\xF9ng n\xE0y?")) {
      setUsers(users.filter((u) => u.id !== id));
    }
  };
  const handleToggleStatus = (id) => {
    setUsers(
      users.map(
        (user) => user.id === id ? {
          ...user,
          status: user.status === "active" ? "inactive" : "active"
        } : user
      )
    );
  };
  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingUser) {
      setUsers(
        users.map(
          (u) => u.id === editingUser.id ? {
            ...u,
            name: formData.name,
            email: formData.email,
            role: formData.role
          } : u
        )
      );
    } else {
      const newUser = {
        id: Date.now().toString(),
        name: formData.name,
        email: formData.email,
        role: formData.role,
        status: "active",
        createdAt: (/* @__PURE__ */ new Date()).toISOString()
      };
      setUsers([...users, newUser]);
    }
    setShowModal(false);
  };
  const getRoleColor = (role) => {
    switch (role) {
      case "admin":
        return "bg-red-100 text-red-800 border-red-300";
      case "manager":
        return "bg-blue-100 text-blue-800 border-blue-300";
      case "customer":
        return "bg-green-100 text-green-800 border-green-300";
      default:
        return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };
  const getRoleLabel = (role) => {
    switch (role) {
      case "admin":
        return "Qu\u1EA3n tr\u1ECB vi\xEAn";
      case "manager":
        return "Qu\u1EA3n l\xFD";
      case "customer":
        return "Kh\xE1ch h\xE0ng";
      default:
        return role;
    }
  };
  return <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-2xl border-2 border-gray-300 shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl mb-2 font-bold text-gray-900">Quản Lý Người Dùng</h1>
              <p className="text-gray-600 font-medium">
                Tổng số: <span className="font-bold text-primary">{filteredUsers.length}</span> người dùng
              </p>
            </div>
            <button
    onClick={handleAddNew}
    className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-xl hover:bg-primary/90 transition-all shadow-lg shadow-primary/30 font-bold border-2 border-primary"
  >
              <UserPlus className="w-5 h-5" />
              Thêm Người Dùng
            </button>
          </div>
        </div>

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
              <option value="admin">Admin</option>
              <option value="manager">Manager</option>
              <option value="customer">Customer</option>
            </select>
          </div>
        </div>

        <div className="bg-white rounded-2xl border-2 border-gray-300 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-100 border-b-2 border-gray-300">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-bold text-gray-900">Người dùng</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-gray-900">Email</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-gray-900">Vai trò</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-gray-900">Trạng thái</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-gray-900">Ngày tạo</th>
                  <th className="px-6 py-4 text-right text-sm font-bold text-gray-900">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y-2 divide-gray-200">
                {filteredUsers.length === 0 ? <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500 font-medium">
                      Không tìm thấy người dùng nào
                    </td>
                  </tr> : filteredUsers.map((user) => <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center border-2 border-primary/20">
                            <span className="text-sm font-bold text-primary">
                              {user.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <span className="font-bold text-gray-900">{user.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-700">{user.email}</td>
                      <td className="px-6 py-4">
                        <span
    className={`px-3 py-1 rounded-full text-xs font-bold border-2 ${user.role === "admin" ? "bg-red-100 text-red-800 border-red-200" : user.role === "manager" ? "bg-blue-100 text-blue-800 border-blue-200" : "bg-green-100 text-green-800 border-green-200"}`}
  >
                          <Shield className="w-3 h-3 inline mr-1" />
                          {user.role.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <button
    onClick={() => handleToggleStatus(user.id)}
    className={`px-3 py-1 rounded-full text-xs font-bold border-2 ${user.status === "active" ? "bg-green-100 text-green-800 border-green-300 hover:bg-green-200" : "bg-gray-100 text-gray-800 border-gray-300 hover:bg-gray-200"} transition-colors`}
  >
                          {user.status === "active" ? "Ho\u1EA1t \u0111\u1ED9ng" : "V\xF4 hi\u1EC7u"}
                        </button>
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-600">
                        {new Date(user.createdAt).toLocaleDateString("vi-VN")}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
    onClick={() => handleEdit(user)}
    className="p-2 hover:bg-gray-100 rounded-lg transition-colors border-2 border-transparent hover:border-primary"
  >
                            <Edit className="w-5 h-5 text-primary" />
                          </button>
                          <button
    onClick={() => handleDelete(user.id)}
    className="p-2 hover:bg-gray-100 rounded-lg transition-colors border-2 border-transparent hover:border-red-500"
  >
                            <Trash2 className="w-5 h-5 text-red-600" />
                          </button>
                        </div>
                      </td>
                    </tr>)}
              </tbody>
            </table>
          </div>
        </div>

        {showModal && <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-md w-full border-2 border-gray-300 shadow-2xl">
              <div className="flex items-center justify-between p-6 border-b-2 border-gray-300">
                <h2 className="text-2xl font-bold text-gray-900">
                  {editingUser ? "Ch\u1EC9nh S\u1EEDa Ng\u01B0\u1EDDi D\xF9ng" : "Th\xEAm Ng\u01B0\u1EDDi D\xF9ng M\u1EDBi"}
                </h2>
                <button
    onClick={() => setShowModal(false)}
    className="p-2 hover:bg-gray-100 rounded-lg transition-colors border-2 border-transparent hover:border-gray-300"
  >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      Tên <span className="text-red-500">*</span>
                    </label>
                    <input
    type="text"
    required
    value={formData.name}
    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
    placeholder="Nhập tên người dùng"
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
                      Vai trò <span className="text-red-500">*</span>
                    </label>
                    <select
    required
    value={formData.role}
    onChange={(e) => setFormData({
      ...formData,
      role: e.target.value
    })}
    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:border-primary"
  >
                      <option value="customer">Customer</option>
                      <option value="manager">Manager</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center gap-3 mt-6">
                  <button
    type="submit"
    className="flex-1 py-3 bg-primary text-white rounded-xl hover:bg-primary/90 transition-colors font-bold text-lg border-2 border-primary"
  >
                    {editingUser ? "C\u1EADp Nh\u1EADt" : "Th\xEAm Ng\u01B0\u1EDDi D\xF9ng"}
                  </button>
                  <button
    type="button"
    onClick={() => setShowModal(false)}
    className="flex-1 py-3 border-2 border-gray-300 rounded-xl hover:bg-gray-50 transition-colors font-bold text-lg"
  >
                    Hủy
                  </button>
                </div>
              </form>
            </div>
          </div>}
      </div>
    </div>;
}
export {
  AdminUsersPage as default
};
