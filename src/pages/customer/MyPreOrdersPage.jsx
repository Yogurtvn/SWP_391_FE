import { useState, useEffect } from "react";
import { Link } from "react-router";
import { Package, Clock, CheckCircle, XCircle, AlertCircle } from "lucide-react";
function MyPreOrdersPage() {
  const [preOrders, setPreOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  useEffect(() => {
    const orders = JSON.parse(localStorage.getItem("preOrders") || "[]");
    setPreOrders(orders);
  }, []);
  const getStatusIcon = (status) => {
    switch (status) {
      case "Ch\u1EDD x\u1EED l\xFD":
        return <Clock className="w-5 h-5 text-yellow-600" />;
      case "\u0110ang t\xECm ki\u1EBFm":
        return <AlertCircle className="w-5 h-5 text-blue-600" />;
      case "\u0110\xE3 t\xECm th\u1EA5y":
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case "Kh\xF4ng t\xECm th\u1EA5y":
        return <XCircle className="w-5 h-5 text-red-600" />;
      default:
        return <Package className="w-5 h-5 text-gray-600" />;
    }
  };
  const getStatusColor = (status) => {
    switch (status) {
      case "Ch\u1EDD x\u1EED l\xFD":
        return "bg-yellow-100 text-yellow-800 border-yellow-300";
      case "\u0110ang t\xECm ki\u1EBFm":
        return "bg-blue-100 text-blue-800 border-blue-300";
      case "\u0110\xE3 t\xECm th\u1EA5y":
        return "bg-green-100 text-green-800 border-green-300";
      case "Kh\xF4ng t\xECm th\u1EA5y":
        return "bg-red-100 text-red-800 border-red-300";
      default:
        return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };
  return <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-8">
        <h1 className="mb-3">Pre-orders của tôi</h1>
        <p className="text-muted-foreground">
          Theo dõi các yêu cầu đặt trước kính theo đơn của bạn
        </p>
      </div>

      {preOrders.length === 0 ? <div className="text-center py-16 bg-secondary rounded-lg">
          <Package className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <p className="text-lg mb-2">Chưa có pre-order nào</p>
          <p className="text-muted-foreground mb-6">
            Không tìm thấy kính phù hợp? Tạo yêu cầu đặt trước ngay
          </p>
          <Link
    to="/pre-order"
    className="inline-block px-6 py-3 bg-primary text-white rounded hover:bg-primary/90 transition-colors"
  >
            Tạo Pre-order
          </Link>
        </div> : <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 space-y-4">
            {preOrders.map((order) => <button
    key={order.id}
    onClick={() => setSelectedOrder(order)}
    className={`w-full p-4 border-2 rounded-lg text-left transition-all ${selectedOrder?.id === order.id ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"}`}
  >
                <div className="flex items-start gap-3 mb-3">
                  {getStatusIcon(order.status)}
                  <div className="flex-1">
                    <p className="text-sm mb-1">ID: {order.id}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(order.createdAt).toLocaleDateString("vi-VN")}
                    </p>
                  </div>
                </div>
                <div
    className={`text-xs px-2 py-1 rounded border inline-block ${getStatusColor(
      order.status
    )}`}
  >
                  {order.status}
                </div>
              </button>)}
          </div>

          <div className="lg:col-span-2">
            {selectedOrder ? <div className="bg-white border-2 border-border rounded-lg overflow-hidden">
                <div className="p-6 border-b border-border bg-secondary/30">
                  <div className="flex items-center justify-between mb-4">
                    <h2>Chi tiết Pre-order</h2>
                    <div
    className={`text-sm px-3 py-1.5 rounded border ${getStatusColor(
      selectedOrder.status
    )}`}
  >
                      {selectedOrder.status}
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Ngày tạo: {new Date(selectedOrder.createdAt).toLocaleString("vi-VN")}
                  </p>
                </div>

                <div className="p-6 border-b border-border">
                  <h3 className="mb-4">Thông Tin Đơn Kính</h3>
                  <div className="bg-secondary p-4 rounded-lg space-y-2 text-sm">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-muted-foreground mb-1">Mắt Phải (OD)</p>
                        <p>SPH: {selectedOrder.prescription.odSph}</p>
                        <p>CYL: {selectedOrder.prescription.odCyl || "\u2014"}</p>
                        <p>AXIS: {selectedOrder.prescription.odAxis || "\u2014"}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground mb-1">Mắt Trái (OS)</p>
                        <p>SPH: {selectedOrder.prescription.osSph}</p>
                        <p>CYL: {selectedOrder.prescription.osCyl || "\u2014"}</p>
                        <p>AXIS: {selectedOrder.prescription.osAxis || "\u2014"}</p>
                      </div>
                    </div>
                    <div className="border-t border-border pt-2">
                      <p>Khoảng Cách Đồng Tử: {selectedOrder.prescription.pd} mm</p>
                    </div>
                  </div>
                </div>

                <div className="p-6 border-b border-border">
                  <h3 className="mb-4">Yêu Cầu Về Kính</h3>
                  <div className="space-y-3 text-sm">
                    <div>
                      <p className="text-muted-foreground mb-1">Hình dạng:</p>
                      <div className="flex flex-wrap gap-2">
                        {selectedOrder.preferences.shape.map((shape) => <span
    key={shape}
    className="px-2 py-1 bg-primary/10 text-primary rounded text-xs"
  >
                            {shape}
                          </span>)}
                      </div>
                    </div>
                    {selectedOrder.preferences.color.length > 0 && <div>
                        <p className="text-muted-foreground mb-1">Màu sắc:</p>
                        <div className="flex flex-wrap gap-2">
                          {selectedOrder.preferences.color.map((color) => <span
    key={color}
    className="px-2 py-1 bg-secondary text-foreground rounded text-xs"
  >
                              {color}
                            </span>)}
                        </div>
                      </div>}
                    {selectedOrder.preferences.material.length > 0 && <div>
                        <p className="text-muted-foreground mb-1">Chất liệu:</p>
                        <div className="flex flex-wrap gap-2">
                          {selectedOrder.preferences.material.map((material) => <span
    key={material}
    className="px-2 py-1 bg-secondary text-foreground rounded text-xs"
  >
                              {material}
                            </span>)}
                        </div>
                      </div>}
                    {selectedOrder.preferences.frameType && <div>
                        <p className="text-muted-foreground mb-1">Loại viền:</p>
                        <p>
                          {selectedOrder.preferences.frameType === "full" ? "G\u1ECDng \u0111\u1EA7y \u0111\u1EE7" : selectedOrder.preferences.frameType === "semi" ? "G\u1ECDng n\u1EEDa vi\u1EC1n" : "Kh\xF4ng g\u1ECDng"}
                        </p>
                      </div>}
                    {selectedOrder.preferences.notes && <div>
                        <p className="text-muted-foreground mb-1">Ghi chú:</p>
                        <p className="bg-secondary p-3 rounded">
                          {selectedOrder.preferences.notes}
                        </p>
                      </div>}
                  </div>
                </div>

                {selectedOrder.matchedProducts && selectedOrder.matchedProducts.length > 0 && <div className="p-6 bg-green-50">
                    <h3 className="mb-4 text-green-900">Sản Phẩm Được Gợi Ý</h3>
                    <div className="grid md:grid-cols-2 gap-4">
                      {selectedOrder.matchedProducts.map((product) => <Link
    key={product.id}
    to={`/product/${product.id}`}
    className="flex gap-3 p-3 bg-white rounded-lg border-2 border-green-200 hover:border-green-400 transition-colors"
  >
                          <img
    src={product.image}
    alt={product.name}
    className="w-20 h-20 object-cover rounded"
  />
                          <div className="flex-1">
                            <p className="mb-1 text-sm">{product.name}</p>
                            <p className="text-primary">${product.price}</p>
                          </div>
                        </Link>)}
                    </div>
                  </div>}
              </div> : <div className="bg-secondary rounded-lg p-12 text-center">
                <Package className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  Chọn một pre-order để xem chi tiết
                </p>
              </div>}
          </div>
        </div>}
    </div>;
}
export {
  MyPreOrdersPage as default
};
