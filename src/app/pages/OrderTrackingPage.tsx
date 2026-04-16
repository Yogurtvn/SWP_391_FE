import { useParams } from "react-router";
import { Check, Package, Truck, Home } from "lucide-react";

const orderStatuses = [
  {
    status: "Đã đặt",
    date: "10 Tháng 4, 2026",
    icon: Check,
    completed: true,
  },
  {
    status: "Đang xử lý",
    date: "11 Tháng 4, 2026",
    icon: Package,
    completed: true,
  },
  {
    status: "Đang giao",
    date: "12 Tháng 4, 2026",
    icon: Truck,
    completed: true,
  },
  {
    status: "Đã giao",
    date: "Dự kiến 15 Tháng 4, 2026",
    icon: Home,
    completed: false,
  },
];

export default function OrderTrackingPage() {
  const { orderId } = useParams();

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="mb-2">Theo Dõi Đơn Hàng</h1>
      <p className="text-muted-foreground mb-12">Đơn hàng #{orderId}</p>

      <div className="mb-12">
        <div className="relative">
          {orderStatuses.map((item, index) => (
            <div key={item.status} className="relative flex gap-6 pb-12 last:pb-0">
              <div className="flex flex-col items-center">
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
                    item.completed
                      ? "bg-accent text-white"
                      : "bg-secondary text-muted-foreground"
                  }`}
                >
                  <item.icon className="w-6 h-6" />
                </div>
                {index < orderStatuses.length - 1 && (
                  <div
                    className={`w-0.5 flex-1 mt-2 ${
                      item.completed ? "bg-accent" : "bg-secondary"
                    }`}
                    style={{ minHeight: "60px" }}
                  />
                )}
              </div>
              <div className="flex-1 pt-2">
                <h3 className="mb-1">{item.status}</h3>
                <p className="text-sm text-muted-foreground">{item.date}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        <div className="bg-secondary p-6 rounded-xl">
          <h3 className="mb-4">Sản Phẩm</h3>
          <div className="space-y-4">
            <div className="flex gap-4">
              <img
                src="https://images.unsplash.com/photo-1626104853817-343b24b5613f?w=80"
                alt="Product"
                className="w-16 h-16 object-cover rounded-lg"
              />
              <div className="flex-1">
                <p className="mb-1">Gọng Chữ Nhật Cổ Điển</p>
                <p className="text-sm text-muted-foreground">Đen, Tròng Cao Cấp</p>
                <p className="text-sm text-muted-foreground">SL: 1</p>
              </div>
              <p>$158.00</p>
            </div>
          </div>
          <div className="border-t border-border mt-4 pt-4">
            <div className="flex justify-between">
              <span>Tổng cộng</span>
              <span className="text-primary">$158.00</span>
            </div>
          </div>
        </div>

        <div className="bg-secondary p-6 rounded-xl">
          <h3 className="mb-4">Địa Chỉ Giao Hàng</h3>
          <div className="text-sm text-foreground/80">
            <p>Nguyễn Văn A</p>
            <p>123 Đường Chính</p>
            <p>Hồ Chí Minh, Việt Nam</p>
            <p className="mt-4">nguyenvana@email.com</p>
          </div>

          <div className="mt-6 pt-6 border-t border-border">
            <h3 className="mb-3">Mã Vận Đơn</h3>
            <code className="text-sm bg-background px-3 py-2 rounded">
              1Z999AA10123456784
            </code>
          </div>
        </div>
      </div>
    </div>
  );
}
