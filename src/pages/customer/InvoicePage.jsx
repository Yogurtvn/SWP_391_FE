import { Link } from "react-router";
import { AlertCircle, Check, Download, Printer } from "lucide-react";
import { useOrderTracking } from "@/hooks/order/useOrderTracking";
import { selectAuthState } from "@/store/auth/authSlice";
import { useAppSelector } from "@/store/hooks";

function InvoicePage() {
  const { order, authRequired, ui, actions } = useOrderTracking();
  const auth = useAppSelector(selectAuthState);

  if (authRequired) {
    return (
      <StateCard
        title="Cần đăng nhập để xem hóa đơn"
        description="Hóa đơn chỉ hiển thị cho tài khoản đã đăng nhập."
      />
    );
  }

  if (ui.isLoading) {
    return (
      <PageShell>
        <div className="rounded-2xl border border-border bg-white p-8 text-center">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-primary/20 border-t-primary" />
          <p className="text-muted-foreground">Đang tải hóa đơn...</p>
        </div>
      </PageShell>
    );
  }

  if (ui.error || !order) {
    return (
      <PageShell>
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
          <div className="mb-4 flex items-start gap-3">
            <AlertCircle className="mt-0.5 h-5 w-5 text-red-600" />
            <div>
              <h1 className="mb-1 text-xl">Không thể mở hóa đơn</h1>
              <p className="text-sm text-red-700">{ui.error || "Dữ liệu hóa đơn chưa sẵn sàng."}</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={actions.retry}
              className="rounded-lg bg-primary px-4 py-2 text-white hover:bg-primary/90"
            >
              Tải lại
            </button>
            <Link to="/orders" className="rounded-lg border border-border px-4 py-2 hover:bg-secondary">
              Về đơn hàng
            </Link>
          </div>
        </div>
      </PageShell>
    );
  }

  const subtotal = order.items.reduce((sum, item) => sum + Number(item.lineTotal ?? 0), 0);
  const shippingFee = Math.max(0, Number(order.shippingFee ?? 0));
  const voucherDiscountAmount = Math.max(0, Number(order.voucherDiscountAmount ?? 0));
  const customerEmail = auth.user?.email?.trim() || "Chưa cập nhật";
  const statusLabel = order.payment?.paymentStatusLabel || order.orderStatusLabel;
  const isPaid = normalizeValue(order.payment?.paymentStatus) === "completed" || normalizeValue(order.orderStatus) === "completed";

  function handlePrint() {
    window.print();
  }

  function handleDownload() {
    window.alert("Tính năng tải PDF sẽ được cập nhật sau.");
  }

  return (
    <PageShell>
      <div className="overflow-hidden rounded-lg border-2 border-border bg-white print:border-0">
        <div className="border-b border-border bg-secondary/30 p-8 print:bg-white">
          <div className="mb-6 flex items-start justify-between">
            <div>
              <h1 className="mb-2">Hóa Đơn</h1>
              <p className="text-sm text-muted-foreground">#{order.orderId}</p>
            </div>
            <div className="flex gap-2 print:hidden">
              <button
                type="button"
                onClick={handlePrint}
                className="rounded border border-border p-2 transition-colors hover:bg-secondary"
              >
                <Printer className="h-5 w-5" />
              </button>
              <button
                type="button"
                onClick={handleDownload}
                className="rounded border border-border p-2 transition-colors hover:bg-secondary"
              >
                <Download className="h-5 w-5" />
              </button>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <p className="mb-2 text-sm text-muted-foreground">Từ:</p>
              <p className="mb-1">VisionDirect</p>
              <p className="text-sm text-muted-foreground">456 Đường XYZ</p>
              <p className="text-sm text-muted-foreground">Quận 3, TP.HCM</p>
              <p className="text-sm text-muted-foreground">contact@visiondirect.com</p>
            </div>
            <div>
              <p className="mb-2 text-sm text-muted-foreground">Đến:</p>
              <p className="mb-1">{order.receiverName}</p>
              <p className="text-sm text-muted-foreground">{order.shippingAddress}</p>
              <p className="text-sm text-muted-foreground">{customerEmail}</p>
              <p className="text-sm text-muted-foreground">{order.receiverPhone}</p>
            </div>
          </div>
        </div>

        <div className="border-b border-border p-8">
          <div className="mb-6 grid grid-cols-1 gap-6 md:grid-cols-3">
            <div>
              <p className="mb-1 text-sm text-muted-foreground">Số đơn hàng</p>
              <p>#{order.orderId}</p>
            </div>
            <div>
              <p className="mb-1 text-sm text-muted-foreground">Ngày hóa đơn</p>
              <p>{formatDate(order.createdAt)}</p>
            </div>
            <div>
              <p className="mb-1 text-sm text-muted-foreground">Trạng thái</p>
              <div className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm ${isPaid ? "bg-green-100 text-green-800" : "bg-amber-100 text-amber-800"}`}>
                <Check className="h-4 w-4" />
                <span>{statusLabel}</span>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="pb-3 text-left text-sm text-muted-foreground">Sản phẩm</th>
                  <th className="pb-3 text-center text-sm text-muted-foreground">Số lượng</th>
                  <th className="pb-3 text-right text-sm text-muted-foreground">Đơn giá</th>
                  <th className="pb-3 text-right text-sm text-muted-foreground">Thành tiền</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {order.items.map((item) => (
                  <tr key={item.orderItemId}>
                    <td className="py-4">
                      <p className="mb-1">{item.productName}</p>
                      <p className="text-sm text-muted-foreground">
                        {buildItemSubtitle(item)}
                      </p>
                    </td>
                    <td className="py-4 text-center">{item.quantity}</td>
                    <td className="py-4 text-right">{formatCurrency(item.unitPrice)}</td>
                    <td className="py-4 text-right">{formatCurrency(item.lineTotal)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="p-8">
          <div className="ml-auto max-w-sm space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Tạm tính</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Phí ship</span>
              <span className={shippingFee > 0 ? "" : "text-accent"}>
                {shippingFee > 0 ? formatCurrency(shippingFee) : "Miễn phí"}
              </span>
            </div>
            {voucherDiscountAmount > 0 ? (
              <div className="flex items-center justify-between text-sm text-emerald-700">
                <span>Giảm từ voucher</span>
                <span>-{formatCurrency(voucherDiscountAmount)}</span>
              </div>
            ) : null}
            <div className="flex items-center justify-between border-t border-border pt-3">
              <span className="text-lg">Tổng cộng</span>
              <span className="text-2xl text-primary">{formatCurrency(order.totalAmount)}</span>
            </div>
          </div>
        </div>

        <div className="border-t border-border bg-secondary/30 p-8 print:bg-white">
          <p className="mb-2 text-sm text-muted-foreground">
            <strong>Lưu ý:</strong>
          </p>
          <ul className="list-inside list-disc space-y-1 text-sm text-muted-foreground">
            <li>Hóa đơn được tạo từ dữ liệu đơn hàng trên hệ thống.</li>
            <li>Vui lòng giữ hóa đơn để hỗ trợ đối soát và bảo hành.</li>
            <li>Liên hệ: contact@visiondirect.com hoặc 1900-xxxx.</li>
          </ul>
        </div>
      </div>
    </PageShell>
  );
}

function PageShell({ children }) {
  return <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">{children}</div>;
}

function StateCard({ title, description }) {
  return (
    <PageShell>
      <div className="rounded-2xl border border-border bg-white p-8 text-center">
        <h1 className="mb-3 text-2xl">{title}</h1>
        <p className="mb-6 text-muted-foreground">{description}</p>
        <div className="flex justify-center gap-3">
          <Link to="/login" className="rounded-lg bg-primary px-4 py-2 text-white hover:bg-primary/90">
            Đăng nhập
          </Link>
          <Link to="/shop" className="rounded-lg border border-border px-4 py-2 hover:bg-secondary">
            Quay lại cửa hàng
          </Link>
        </div>
      </div>
    </PageShell>
  );
}

function buildItemSubtitle(item) {
  const parts = [];

  if (item.sku) {
    parts.push(`SKU: ${item.sku}`);
  }

  if (item.selectedColor) {
    parts.push(`Màu: ${item.selectedColor}`);
  }

  if (item.lensPrice > 0) {
    parts.push(`Giá tròng: ${formatCurrency(item.lensPrice)}`);
  }

  return parts.length > 0 ? parts.join(" | ") : "Mặc định";
}

function normalizeValue(value) {
  return String(value ?? "").trim().toLowerCase();
}

function formatDate(value) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Chưa cập nhật";
  }

  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "Asia/Ho_Chi_Minh",
  }).format(date);
}

function formatCurrency(value) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(Number(value ?? 0));
}

export { InvoicePage as default };
