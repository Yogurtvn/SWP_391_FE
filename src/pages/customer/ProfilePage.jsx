import { useState, useEffect } from "react";
import { Link } from "react-router";
import { User, Package, Eye, Settings, Clock } from "lucide-react";
const recentOrders = [
  {
    id: "ORD-12345",
    date: "April 10, 2026",
    total: 158,
    status: "Shipped",
    image: "https://images.unsplash.com/photo-1626104853817-343b24b5613f?w=80"
  },
  {
    id: "ORD-12344",
    date: "March 15, 2026",
    total: 89,
    status: "Delivered",
    image: "https://images.unsplash.com/photo-1654274285614-37cad6007665?w=80"
  },
  {
    id: "ORD-12343",
    date: "February 22, 2026",
    total: 199,
    status: "Delivered",
    image: "https://images.unsplash.com/photo-1681147768015-c6d3702f5e4f?w=80"
  }
];
const savedPrescriptions = [
  {
    id: "1",
    name: "Current Prescription",
    date: "January 2026",
    od: { sph: "-2.00", cyl: "-0.50", axis: "180" },
    os: { sph: "-1.75", cyl: "-0.25", axis: "170" },
    pd: "63"
  },
  {
    id: "2",
    name: "Previous Prescription",
    date: "June 2024",
    od: { sph: "-1.75", cyl: "-0.25", axis: "175" },
    os: { sph: "-1.50", cyl: "-0.50", axis: "165" },
    pd: "63"
  }
];
function ProfilePage() {
  const [activeTab, setActiveTab] = useState("orders");
  const [userEmail, setUserEmail] = useState("");
  useEffect(() => {
    const email = localStorage.getItem("userEmail");
    if (email) {
      setUserEmail(email);
    }
  }, []);
  return <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="mb-4">Tài Khoản Của Tôi</h1>
      <p className="text-muted-foreground mb-12">{userEmail}</p>

      <div className="grid lg:grid-cols-4 gap-8">
        <aside className="lg:col-span-1">
          <nav className="space-y-2">
            <button
    onClick={() => setActiveTab("orders")}
    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${activeTab === "orders" ? "bg-primary text-white" : "hover:bg-secondary"}`}
  >
              <Package className="w-5 h-5" />
              Đơn hàng
            </button>
            <button
    onClick={() => setActiveTab("prescriptions")}
    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${activeTab === "prescriptions" ? "bg-primary text-white" : "hover:bg-secondary"}`}
  >
              <Eye className="w-5 h-5" />
              Đơn kính
            </button>
            <button
    onClick={() => setActiveTab("pre-orders")}
    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${activeTab === "pre-orders" ? "bg-primary text-white" : "hover:bg-secondary"}`}
  >
              <Clock className="w-5 h-5" />
              Pre-orders
            </button>
            <button
    onClick={() => setActiveTab("account")}
    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${activeTab === "account" ? "bg-primary text-white" : "hover:bg-secondary"}`}
  >
              <User className="w-5 h-5" />
              Thông tin tài khoản
            </button>
            <button
    onClick={() => setActiveTab("settings")}
    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${activeTab === "settings" ? "bg-primary text-white" : "hover:bg-secondary"}`}
  >
              <Settings className="w-5 h-5" />
              Cài đặt
            </button>
          </nav>
        </aside>

        <div className="lg:col-span-3">
          {activeTab === "orders" && <div>
              <h2 className="mb-6">Lịch Sử Đơn Hàng</h2>
              <div className="space-y-4">
                {recentOrders.map((order) => <Link
    key={order.id}
    to={`/orders/${order.id}`}
    className="block bg-secondary p-6 rounded-xl hover:bg-muted transition-colors"
  >
                    <div className="flex items-center gap-6">
                      <img
    src={order.image}
    alt="Order"
    className="w-16 h-16 object-cover rounded-lg"
  />
                      <div className="flex-1">
                        <p className="mb-1">Đơn hàng #{order.id}</p>
                        <p className="text-sm text-muted-foreground">{order.date}</p>
                      </div>
                      <div className="text-right">
                        <p className="mb-1">${order.total.toFixed(2)}</p>
                        <span
    className={`inline-block px-3 py-1 text-xs rounded-full ${order.status === "Delivered" ? "bg-accent/10 text-accent" : "bg-primary/10 text-primary"}`}
  >
                          {order.status === "Delivered" ? "\u0110\xE3 giao" : order.status === "Shipped" ? "\u0110ang giao" : order.status}
                        </span>
                      </div>
                    </div>
                  </Link>)}
              </div>
            </div>}

          {activeTab === "prescriptions" && <div>
              <div className="flex items-center justify-between mb-6">
                <h2>Đơn Kính Đã Lưu</h2>
                <button className="px-4 py-2 bg-primary text-white rounded hover:bg-primary/90 transition-colors">
                  Thêm mới
                </button>
              </div>
              <div className="space-y-4">
                {savedPrescriptions.map((rx) => <div key={rx.id} className="bg-secondary p-6 rounded">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="mb-1">{rx.name}</h3>
                        <p className="text-sm text-muted-foreground">{rx.date}</p>
                      </div>
                      <button className="text-primary hover:underline text-sm">
                        Sửa
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground mb-2">OD (Mắt phải)</p>
                        <p>
                          SPH: {rx.od.sph} | CYL: {rx.od.cyl} | AXIS: {rx.od.axis}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground mb-2">OS (Mắt trái)</p>
                        <p>
                          SPH: {rx.os.sph} | CYL: {rx.os.cyl} | AXIS: {rx.os.axis}
                        </p>
                      </div>
                      <div className="col-span-2">
                        <p className="text-muted-foreground">PD: {rx.pd}mm</p>
                      </div>
                    </div>
                  </div>)}
              </div>
            </div>}

          {activeTab === "pre-orders" && <div>
              <div className="flex items-center justify-between mb-6">
                <h2>Pre-orders</h2>
                <Link
    to="/pre-order"
    className="px-4 py-2 bg-primary text-white rounded hover:bg-primary/90 transition-colors"
  >
                  Tạo pre-order mới
                </Link>
              </div>
              <div className="text-center py-12 bg-secondary rounded-lg">
                <Clock className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <p className="mb-2">Bạn chưa có pre-order nào</p>
                <p className="text-sm text-muted-foreground mb-6">
                  Không tìm thấy kính phù hợp? Tạo yêu cầu đặt trước ngay
                </p>
                <Link
    to="/profile/pre-orders"
    className="text-primary hover:underline text-sm"
  >
                  Xem tất cả pre-orders →
                </Link>
              </div>
            </div>}

          {activeTab === "account" && <div>
              <h2 className="mb-6">Thông Tin Tài Khoản</h2>
              <div className="bg-secondary p-6 rounded space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block mb-2 text-sm">Họ</label>
                    <input
    type="text"
    defaultValue="Nguyễn"
    className="w-full px-4 py-3 bg-white border border-border rounded-lg focus:outline-none focus:border-primary"
  />
                  </div>
                  <div>
                    <label className="block mb-2 text-sm">Tên</label>
                    <input
    type="text"
    defaultValue="Văn A"
    className="w-full px-4 py-3 bg-white border border-border rounded-lg focus:outline-none focus:border-primary"
  />
                  </div>
                </div>
                <div>
                  <label className="block mb-2 text-sm">Email</label>
                  <input
    type="email"
    value={userEmail}
    readOnly
    className="w-full px-4 py-3 bg-white border border-border rounded-lg focus:outline-none focus:border-primary"
  />
                </div>
                <div>
                  <label className="block mb-2 text-sm">Số điện thoại</label>
                  <input
    type="tel"
    defaultValue="0912345678"
    className="w-full px-4 py-3 bg-white border border-border rounded-lg focus:outline-none focus:border-primary"
  />
                </div>
                <button className="px-6 py-3 bg-primary text-white rounded hover:bg-primary/90 transition-colors">
                  Lưu thay đổi
                </button>
              </div>
            </div>}

          {activeTab === "settings" && <div>
              <h2 className="mb-6">Cài Đặt</h2>
              <div className="space-y-6">
                <div className="bg-secondary p-6 rounded">
                  <h3 className="mb-4">Tùy Chọn Email</h3>
                  <div className="space-y-3">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
    type="checkbox"
    defaultChecked
    className="w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary"
  />
                      <span>Cập nhật đơn hàng và thông báo giao hàng</span>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
    type="checkbox"
    defaultChecked
    className="w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary"
  />
                      <span>Email khuyến mãi và ưu đãi đặc biệt</span>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
    type="checkbox"
    className="w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary"
  />
                      <span>Thông báo sản phẩm mới</span>
                    </label>
                  </div>
                </div>

                <div className="bg-secondary p-6 rounded">
                  <h3 className="mb-4">Mật khẩu</h3>
                  <button className="text-primary hover:underline">
                    Đổi mật khẩu
                  </button>
                </div>
              </div>
            </div>}
        </div>
      </div>
    </div>;
}
export {
  ProfilePage as default
};
