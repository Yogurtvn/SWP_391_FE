import { useState } from "react";
import { Search, Package, FileText, Clock, CheckCircle, Eye } from "lucide-react";
function ManagerOrdersPage() {
  const [orders] = useState([
    {
      id: "ORD-2024-001",
      customerName: "Nguy\u1EC5n V\u0103n A",
      customerEmail: "nguyenvana@email.com",
      type: "prescription",
      status: "Ch\u1EDD duy\u1EC7t",
      total: 158,
      createdAt: "2024-03-15T10:30:00",
      items: [
        { name: "G\u1ECDng Ch\u1EEF Nh\u1EADt C\u1ED5 \u0110i\u1EC3n", quantity: 1, price: 79 },
        { name: "Tr\xF2ng k\xEDnh cao c\u1EA5p", quantity: 1, price: 79 }
      ],
      prescription: {
        odSph: "-2.50",
        odCyl: "-0.75",
        odAxis: "90",
        osSph: "-2.25",
        osCyl: "-0.50",
        osAxis: "85",
        pd: "63"
      }
    },
    {
      id: "ORD-2024-002",
      customerName: "Tr\u1EA7n Th\u1ECB B",
      customerEmail: "tranthib@email.com",
      type: "regular",
      status: "\u0110\xE3 x\xE1c nh\u1EADn",
      total: 79,
      createdAt: "2024-03-14T14:20:00",
      items: [{ name: "G\u1ECDng M\u1EAFt M\xE8o", quantity: 1, price: 79 }]
    },
    {
      id: "PRE-2024-001",
      customerName: "L\xEA V\u0103n C",
      customerEmail: "levanc@email.com",
      type: "pre-order",
      status: "\u0110ang t\xECm ki\u1EBFm",
      total: 0,
      createdAt: "2024-03-13T09:15:00",
      items: [],
      prescription: {
        odSph: "-3.00",
        odCyl: "",
        odAxis: "",
        osSph: "-3.00",
        osCyl: "",
        osAxis: "",
        pd: "64"
      },
      preOrderPreferences: {
        shape: ["Ch\u1EEF nh\u1EADt", "Vu\xF4ng"],
        color: ["\u0110en", "N\xE2u"],
        material: ["Acetate", "Kim lo\u1EA1i"],
        frameType: "full"
      }
    }
  ]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const filteredOrders = orders.filter((order) => {
    const matchesSearch = order.id.toLowerCase().includes(searchQuery.toLowerCase()) || order.customerName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === "all" || order.type === filterType;
    const matchesStatus = filterStatus === "all" || order.status === filterStatus;
    return matchesSearch && matchesType && matchesStatus;
  });
  const getTypeIcon = (type) => {
    switch (type) {
      case "regular":
        return <Package className="w-4 h-4" />;
      case "prescription":
        return <FileText className="w-4 h-4" />;
      case "pre-order":
        return <Clock className="w-4 h-4" />;
      default:
        return <Package className="w-4 h-4" />;
    }
  };
  const getTypeLabel = (type) => {
    switch (type) {
      case "regular":
        return "\u0110\u01A1n th\u01B0\u1EDDng";
      case "prescription":
        return "\u0110\u01A1n k\xEDnh";
      case "pre-order":
        return "Pre-order";
      default:
        return type;
    }
  };
  const getStatusColor = (status) => {
    switch (status) {
      case "Ch\u1EDD duy\u1EC7t":
        return "bg-yellow-100 text-yellow-800 border-yellow-300";
      case "\u0110\xE3 x\xE1c nh\u1EADn":
        return "bg-blue-100 text-blue-800 border-blue-300";
      case "\u0110ang x\u1EED l\xFD":
        return "bg-purple-100 text-purple-800 border-purple-300";
      case "\u0110ang giao":
        return "bg-orange-100 text-orange-800 border-orange-300";
      case "\u0110\xE3 giao":
        return "bg-green-100 text-green-800 border-green-300";
      case "\u0110ang t\xECm ki\u1EBFm":
        return "bg-blue-100 text-blue-800 border-blue-300";
      case "\u0110\xE3 t\xECm th\u1EA5y":
        return "bg-green-100 text-green-800 border-green-300";
      default:
        return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };
  const handleApproveOrder = (orderId) => {
    alert(`\u0110\xE3 duy\u1EC7t \u0111\u01A1n h\xE0ng ${orderId}`);
  };
  const handleRejectOrder = (orderId) => {
    if (confirm("B\u1EA1n c\xF3 ch\u1EAFc mu\u1ED1n t\u1EEB ch\u1ED1i \u0111\u01A1n h\xE0ng n\xE0y?")) {
      alert(`\u0110\xE3 t\u1EEB ch\u1ED1i \u0111\u01A1n h\xE0ng ${orderId}`);
    }
  };
  return <div className="min-h-screen bg-orange-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-2xl border-2 border-orange-300 shadow-sm p-6 mb-6">
          <h1 className="text-3xl mb-2 font-bold text-gray-900">Quản Lý Đơn Hàng</h1>
          <p className="text-gray-600 font-medium">
            Xác nhận, duyệt đơn kính và pre-order
          </p>
        </div>

        <div className="bg-white rounded-2xl border-2 border-orange-300 shadow-sm p-6 mb-6">
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
    type="text"
    placeholder="Tìm kiếm theo mã đơn hoặc tên khách hàng..."
    value={searchQuery}
    onChange={(e) => setSearchQuery(e.target.value)}
    className="w-full pl-12 pr-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition-all"
  />
            </div>

            <div className="flex gap-4">
              <select
    value={filterType}
    onChange={(e) => setFilterType(e.target.value)}
    className="px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:border-orange-500 font-medium"
  >
                <option value="all">Tất cả loại đơn</option>
                <option value="regular">Đơn thường</option>
                <option value="prescription">Đơn kính</option>
                <option value="pre-order">Pre-order</option>
              </select>

              <select
    value={filterStatus}
    onChange={(e) => setFilterStatus(e.target.value)}
    className="px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:border-orange-500 font-medium"
  >
                <option value="all">Tất cả trạng thái</option>
                <option value="Chờ duyệt">Chờ duyệt</option>
                <option value="Đã xác nhận">Đã xác nhận</option>
                <option value="Đang xử lý">Đang xử lý</option>
                <option value="Đang giao">Đang giao</option>
                <option value="Đã giao">Đã giao</option>
                <option value="Đang tìm kiếm">Đang tìm kiếm</option>
              </select>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 space-y-3 max-h-[calc(100vh-350px)] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-orange-300 scrollbar-track-orange-50">
            {filteredOrders.map((order) => <button
    key={order.id}
    onClick={() => setSelectedOrder(order)}
    className={`w-full p-4 border-2 rounded-xl text-left transition-all ${selectedOrder?.id === order.id ? "border-orange-500 bg-orange-50 shadow-md" : "border-orange-200 bg-white hover:border-orange-400 hover:shadow-sm"}`}
  >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    {getTypeIcon(order.type)}
                    <span className="text-sm font-bold text-gray-900">{order.id}</span>
                  </div>
                  <div
    className={`text-xs px-3 py-1 rounded-lg border-2 font-bold ${getStatusColor(
      order.status
    )}`}
  >
                    {order.status}
                  </div>
                </div>
                <p className="text-sm font-medium text-gray-700 mb-2">{order.customerName}</p>
                <div className="flex items-center justify-between text-xs text-gray-600">
                  <span className="font-medium">{getTypeLabel(order.type)}</span>
                  {order.type !== "pre-order" && <span className="font-bold text-orange-600">${order.total}</span>}
                </div>
              </button>)}
          </div>

          <div className="lg:col-span-2">
            {selectedOrder ? <div className="bg-white border-2 border-orange-300 rounded-2xl overflow-hidden shadow-sm">
                <div className="p-6 border-b-2 border-orange-300 bg-orange-50">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h2 className="mb-2 text-2xl font-bold text-gray-900">{selectedOrder.id}</h2>
                      <p className="text-sm text-gray-600 font-medium">
                        {getTypeLabel(selectedOrder.type)}
                      </p>
                    </div>
                    <div
    className={`text-sm px-4 py-2 rounded-xl border-2 font-bold ${getStatusColor(
      selectedOrder.status
    )}`}
  >
                      {selectedOrder.status}
                    </div>
                  </div>
                  <div className="space-y-2 text-sm">
                    <p className="font-medium text-gray-700">
                      <span className="text-gray-500 font-bold">Khách hàng:</span>{" "}
                      {selectedOrder.customerName}
                    </p>
                    <p className="font-medium text-gray-700">
                      <span className="text-gray-500 font-bold">Email:</span>{" "}
                      {selectedOrder.customerEmail}
                    </p>
                    <p className="font-medium text-gray-700">
                      <span className="text-gray-500 font-bold">Ngày tạo:</span>{" "}
                      {new Date(selectedOrder.createdAt).toLocaleString("vi-VN")}
                    </p>
                  </div>
                </div>

                {selectedOrder.items.length > 0 && <div className="p-6 border-b-2 border-orange-200">
                    <h3 className="mb-4 text-lg font-bold text-gray-900">Sản phẩm</h3>
                    <div className="space-y-3">
                      {selectedOrder.items.map((item, index) => <div
    key={index}
    className="flex items-center justify-between text-sm p-3 bg-gray-50 rounded-xl border-2 border-gray-200"
  >
                          <div>
                            <p className="font-bold text-gray-900">{item.name}</p>
                            <p className="text-gray-600 font-medium">
                              Số lượng: {item.quantity}
                            </p>
                          </div>
                          <p className="text-orange-600 font-bold">${item.price}</p>
                        </div>)}
                    </div>
                    <div className="mt-4 pt-4 border-t-2 border-gray-200 flex items-center justify-between">
                      <span className="font-bold text-gray-900">Tổng cộng:</span>
                      <span className="text-2xl text-orange-600 font-bold">${selectedOrder.total}</span>
                    </div>
                  </div>}

                {selectedOrder.prescription && <div className="p-6 border-b-2 border-orange-200">
                    <h3 className="mb-4 text-lg font-bold text-gray-900">Thông Tin Đơn Kính</h3>
                    <div className="bg-blue-50 p-5 rounded-xl space-y-3 text-sm border-2 border-blue-200">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-gray-600 mb-2 font-bold">Mắt Phải (OD)</p>
                          <p className="font-medium text-gray-900">SPH: {selectedOrder.prescription.odSph}</p>
                          <p className="font-medium text-gray-900">CYL: {selectedOrder.prescription.odCyl || "\u2014"}</p>
                          <p className="font-medium text-gray-900">AXIS: {selectedOrder.prescription.odAxis || "\u2014"}</p>
                        </div>
                        <div>
                          <p className="text-gray-600 mb-2 font-bold">Mắt Trái (OS)</p>
                          <p className="font-medium text-gray-900">SPH: {selectedOrder.prescription.osSph}</p>
                          <p className="font-medium text-gray-900">CYL: {selectedOrder.prescription.osCyl || "\u2014"}</p>
                          <p className="font-medium text-gray-900">AXIS: {selectedOrder.prescription.osAxis || "\u2014"}</p>
                        </div>
                      </div>
                      <div className="border-t-2 border-blue-300 pt-3">
                        <p className="font-bold text-gray-900">Khoảng Cách Đồng Tử: {selectedOrder.prescription.pd} mm</p>
                      </div>
                    </div>
                  </div>}

                {selectedOrder.preOrderPreferences && <div className="p-6 border-b-2 border-orange-200">
                    <h3 className="mb-4 text-lg font-bold text-gray-900">Yêu Cầu Pre-order</h3>
                    <div className="space-y-4 text-sm">
                      <div>
                        <p className="text-gray-600 mb-2 font-bold">Hình dạng:</p>
                        <div className="flex flex-wrap gap-2">
                          {selectedOrder.preOrderPreferences.shape.map((shape) => <span
    key={shape}
    className="px-3 py-1.5 bg-orange-100 text-orange-700 rounded-lg text-xs font-bold border-2 border-orange-200"
  >
                              {shape}
                            </span>)}
                        </div>
                      </div>
                      {selectedOrder.preOrderPreferences.color.length > 0 && <div>
                          <p className="text-gray-600 mb-2 font-bold">Màu sắc:</p>
                          <div className="flex flex-wrap gap-2">
                            {selectedOrder.preOrderPreferences.color.map((color) => <span
    key={color}
    className="px-3 py-1.5 bg-gray-100 text-gray-900 rounded-lg text-xs font-bold border-2 border-gray-200"
  >
                                {color}
                              </span>)}
                          </div>
                        </div>}
                      {selectedOrder.preOrderPreferences.material.length > 0 && <div>
                          <p className="text-gray-600 mb-2 font-bold">Chất liệu:</p>
                          <div className="flex flex-wrap gap-2">
                            {selectedOrder.preOrderPreferences.material.map(
    (material) => <span
      key={material}
      className="px-3 py-1.5 bg-gray-100 text-gray-900 rounded-lg text-xs font-bold border-2 border-gray-200"
    >
                                  {material}
                                </span>
  )}
                          </div>
                        </div>}
                    </div>
                  </div>}

                <div className="p-6 bg-orange-50">
                  <h3 className="mb-4 text-lg font-bold text-gray-900">Thao tác</h3>
                  <div className="flex gap-3">
                    {selectedOrder.status === "Ch\u1EDD duy\u1EC7t" && <>
                        <button
    onClick={() => handleApproveOrder(selectedOrder.id)}
    className="flex-1 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors flex items-center justify-center gap-2 font-bold border-2 border-green-700"
  >
                          <CheckCircle className="w-5 h-5" />
                          Duyệt đơn
                        </button>
                        <button
    onClick={() => handleRejectOrder(selectedOrder.id)}
    className="flex-1 py-3 border-2 border-red-500 text-red-600 rounded-xl hover:bg-red-50 transition-colors font-bold"
  >
                          Từ chối
                        </button>
                      </>}
                    {selectedOrder.status === "\u0110\xE3 x\xE1c nh\u1EADn" && <button className="flex-1 py-3 bg-orange-600 text-white rounded-xl hover:bg-orange-700 transition-colors font-bold border-2 border-orange-700">
                        Chuyển sang đang xử lý
                      </button>}
                    {selectedOrder.type === "pre-order" && selectedOrder.status === "\u0110ang t\xECm ki\u1EBFm" && <button className="flex-1 py-3 bg-orange-600 text-white rounded-xl hover:bg-orange-700 transition-colors font-bold border-2 border-orange-700">
                          Thêm sản phẩm gợi ý
                        </button>}
                  </div>
                </div>
              </div> : <div className="bg-white rounded-2xl border-2 border-orange-200 p-12 text-center">
                <Eye className="w-20 h-20 text-orange-400 mx-auto mb-4" />
                <p className="text-gray-600 font-medium text-lg">
                  Chọn một đơn hàng để xem chi tiết
                </p>
              </div>}
          </div>
        </div>
      </div>
    </div>;
}
export {
  ManagerOrdersPage as default
};
