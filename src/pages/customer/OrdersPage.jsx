import { useState } from "react";
import { Package, Search, Eye, ChevronRight } from "lucide-react";
import { Link } from "react-router";
function OrdersPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const orders = [
    {
      id: "ORD-2026-001",
      date: "2026-04-10",
      status: "delivered",
      statusText: "\u0110\xE3 giao h\xE0ng",
      total: 25e5,
      items: [
        { name: "G\u1ECDng Ch\u1EEF Nh\u1EADt C\u1ED5 \u0110i\u1EC3n", quantity: 1, image: "https://images.unsplash.com/photo-1626104853817-343b24b5613f?w=200" }
      ]
    },
    {
      id: "ORD-2026-002",
      date: "2026-04-12",
      status: "shipping",
      statusText: "\u0110ang giao h\xE0ng",
      total: 18e5,
      items: [
        { name: "K\xEDnh R\xE2m Aviator", quantity: 1, image: "https://images.unsplash.com/photo-1681147768015-c6d3702f5e4f?w=200" }
      ]
    },
    {
      id: "ORD-2026-003",
      date: "2026-04-14",
      status: "processing",
      statusText: "\u0110ang x\u1EED l\xFD",
      total: 32e5,
      items: [
        { name: "K\xEDnh Ho\xE0n Ch\u1EC9nh Premium", quantity: 1, image: "https://images.unsplash.com/photo-1662230177619-e190429b87fd?w=200" }
      ]
    }
  ];
  const statusColors = {
    delivered: "bg-green-100 text-green-700",
    shipping: "bg-blue-100 text-blue-700",
    processing: "bg-yellow-100 text-yellow-700",
    cancelled: "bg-red-100 text-red-700"
  };
  const filteredOrders = orders.filter((order) => {
    if (filterStatus !== "all" && order.status !== filterStatus) return false;
    if (searchQuery && !order.id.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });
  const formatPrice = (price) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND"
    }).format(price);
  };
  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric"
    });
  };
  return <div className="min-h-screen bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {
    /* Header */
  }
        <div className="mb-8">
          <h1 className="text-3xl mb-2">Đơn Hàng Của Tôi</h1>
          <p className="text-muted-foreground">
            Quản lý và theo dõi tất cả đơn hàng của bạn
          </p>
        </div>

        {
    /* Filters */
  }
        <div className="mb-6 flex flex-col sm:flex-row gap-4">
          {
    /* Search */
  }
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
    type="text"
    placeholder="Tìm mã đơn hàng..."
    value={searchQuery}
    onChange={(e) => setSearchQuery(e.target.value)}
    className="w-full pl-10 pr-4 py-2 border border-border rounded-lg focus:outline-none focus:border-primary"
  />
          </div>

          {
    /* Status Filter */
  }
          <select
    value={filterStatus}
    onChange={(e) => setFilterStatus(e.target.value)}
    className="px-4 py-2 border border-border rounded-lg focus:outline-none focus:border-primary"
  >
            <option value="all">Tất cả trạng thái</option>
            <option value="processing">Đang xử lý</option>
            <option value="shipping">Đang giao hàng</option>
            <option value="delivered">Đã giao hàng</option>
            <option value="cancelled">Đã hủy</option>
          </select>
        </div>

        {
    /* Orders List */
  }
        {filteredOrders.length === 0 ? <div className="text-center py-12 bg-secondary rounded-lg">
            <Package className="w-16 h-16 text-muted-foreground opacity-50 mx-auto mb-4" />
            <p className="text-muted-foreground mb-4">
              {searchQuery || filterStatus !== "all" ? "Kh\xF4ng t\xECm th\u1EA5y \u0111\u01A1n h\xE0ng ph\xF9 h\u1EE3p" : "B\u1EA1n ch\u01B0a c\xF3 \u0111\u01A1n h\xE0ng n\xE0o"}
            </p>
            {!searchQuery && filterStatus === "all" && <Link
    to="/shop"
    className="inline-block px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
  >
                Khám Phá Sản Phẩm
              </Link>}
          </div> : <div className="space-y-4">
            {filteredOrders.map((order) => <div
    key={order.id}
    className="bg-white border border-border rounded-lg overflow-hidden hover:shadow-md transition-shadow"
  >
                {
    /* Order Header */
  }
                <div className="bg-secondary px-6 py-4 flex flex-wrap items-center justify-between gap-4">
                  <div className="flex flex-wrap items-center gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Mã đơn hàng</p>
                      <p className="font-semibold">{order.id}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Ngày đặt</p>
                      <p>{formatDate(order.date)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Tổng tiền</p>
                      <p className="font-semibold text-primary">{formatPrice(order.total)}</p>
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[order.status]}`}>
                    {order.statusText}
                  </span>
                </div>

                {
    /* Order Items */
  }
                <div className="px-6 py-4">
                  <div className="space-y-3">
                    {order.items.map((item, index) => <div key={index} className="flex items-center gap-4">
                        <img
    src={item.image}
    alt={item.name}
    className="w-16 h-16 object-cover rounded-lg"
  />
                        <div className="flex-1">
                          <p className="font-medium">{item.name}</p>
                          <p className="text-sm text-muted-foreground">Số lượng: {item.quantity}</p>
                        </div>
                      </div>)}
                  </div>

                  {
    /* Actions */
  }
                  <div className="mt-4 pt-4 border-t border-border flex gap-3">
                    <Link
    to={`/orders/${order.id}`}
    className="flex items-center gap-2 px-4 py-2 border border-border rounded-lg hover:bg-secondary transition-colors"
  >
                      <Eye className="w-4 h-4" />
                      <span className="text-sm">Chi tiết</span>
                    </Link>
                    {order.status === "delivered" && <Link
    to={`/invoice/${order.id}`}
    className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
  >
                        <span className="text-sm">Xem hóa đơn</span>
                        <ChevronRight className="w-4 h-4" />
                      </Link>}
                  </div>
                </div>
              </div>)}
          </div>}
      </div>
    </div>;
}
export {
  OrdersPage as default
};
