import { Link } from "react-router";
import { toast } from "sonner";
import { Clock, Eye, Package, Settings, User } from "lucide-react";
import { useProfilePage } from "@/hooks/profile/useProfilePage";

export default function ProfilePage() {
  const { activeTab, profile, accountForm, recentOrders, preOrders, prescriptions, ui, actions } = useProfilePage();

  async function handleSaveProfile() {
    try {
      await actions.saveAccount();
      toast.success("Đã lưu thông tin tài khoản.");
    } catch (error) {
      toast.error(resolveErrorMessage(error, ui.saveError || "Không thể lưu thông tin tài khoản."));
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="mb-4">Tài Khoản Của Tôi</h1>
      <p className="mb-12 text-muted-foreground">{profile?.email || accountForm.email || "Đang tải thông tin..."}</p>

      <div className="grid gap-8 lg:grid-cols-4">
        <aside className="lg:col-span-1">
          <nav className="space-y-2">
            <TabButton
              active={activeTab === "orders"}
              icon={Package}
              label="Đơn hàng"
              onClick={() => actions.setActiveTab("orders")}
            />
            <TabButton
              active={activeTab === "prescriptions"}
              icon={Eye}
              label="Đơn kính"
              onClick={() => actions.setActiveTab("prescriptions")}
            />
            <TabButton
              active={activeTab === "pre-orders"}
              icon={Clock}
              label="Pre-orders"
              onClick={() => actions.setActiveTab("pre-orders")}
            />
            <TabButton
              active={activeTab === "account"}
              icon={User}
              label="Thông tin tài khoản"
              onClick={() => actions.setActiveTab("account")}
            />
            <TabButton
              active={activeTab === "settings"}
              icon={Settings}
              label="Cài đặt"
              onClick={() => actions.setActiveTab("settings")}
            />
          </nav>
        </aside>

        <div className="lg:col-span-3">
          {activeTab === "orders" ? (
            <section>
              <div className="mb-6 flex items-center justify-between gap-4">
                <h2>Lịch Sử Đơn Hàng</h2>
                <Link to="/orders" className="text-sm text-primary hover:underline">
                  Xem tất cả
                </Link>
              </div>

              {ui.ordersError ? (
                <ErrorCard message={ui.ordersError} onRetry={actions.retryOrders} />
              ) : ui.ordersLoading ? (
                <LoadingCard message="Đang tải lịch sử đơn hàng..." />
              ) : recentOrders.length === 0 ? (
                <EmptyCard
                  title="Bạn chưa có đơn hàng nào"
                  description="Sau khi mua hàng, lịch sử đơn hàng sẽ hiển thị tại đây."
                  actionLabel="Khám phá sản phẩm"
                  actionTo="/shop"
                />
              ) : (
                <div className="space-y-4">
                  {recentOrders.map((order) => (
                    <Link
                      key={order.orderId}
                      to={`/orders/${order.orderId}`}
                      className="block rounded-xl bg-secondary p-6 transition-colors hover:bg-muted"
                    >
                      <div className="flex items-center gap-6">
                        <img
                          src={order.firstItemImage}
                          alt={order.firstItemName}
                          className="h-16 w-16 rounded-lg object-cover"
                        />
                        <div className="flex-1">
                          <p className="mb-1">Đơn hàng #{order.orderId}</p>
                          <p className="text-sm text-muted-foreground">{order.createdAtLabel}</p>
                        </div>
                        <div className="text-right">
                          <p className="mb-1">{formatCurrency(order.totalAmount)}</p>
                          <span className={`inline-block rounded-full px-3 py-1 text-xs ${getStatusColor(order.statusKey)}`}>
                            {order.statusLabel}
                          </span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </section>
          ) : null}

          {activeTab === "prescriptions" ? (
            <section>
              <div className="mb-6 flex items-center justify-between gap-4">
                <h2>Đơn Kính Đã Lưu</h2>
                <Link to="/orders" className="text-sm text-primary hover:underline">
                  Xem đơn hàng
                </Link>
              </div>

              {ui.prescriptionsError ? (
                <ErrorCard message={ui.prescriptionsError} onRetry={actions.retryPrescriptions} />
              ) : ui.prescriptionsLoading ? (
                <LoadingCard message="Đang tải danh sách đơn kính..." />
              ) : prescriptions.length === 0 ? (
                <EmptyCard
                  title="Bạn chưa có đơn kính nào"
                  description="Các đơn kính theo toa sẽ hiển thị tại đây sau khi bạn đặt kính."
                  actionLabel="Chọn gọng kính"
                  actionTo="/shop/eyeglasses"
                />
              ) : (
                <div className="space-y-4">
                  {prescriptions.map((prescription) => (
                    <Link
                      key={`${prescription.prescriptionId}-${prescription.orderId}`}
                      to={prescription.orderId ? `/orders/${prescription.orderId}` : "/orders"}
                      className="block rounded-xl bg-secondary p-6 transition-colors hover:bg-muted"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-4">
                        <div>
                          <p className="mb-1">Đơn kính #{prescription.prescriptionId}</p>
                          <p className="text-sm text-muted-foreground">
                            {prescription.lensTypeCode || "Tròng kính"} · {prescription.createdAtLabel || "Chưa cập nhật"}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="mb-1">{formatCurrency(prescription.totalLensPrice)}</p>
                          <span className={`inline-block rounded-full px-3 py-1 text-xs ${getPrescriptionStatusColor(prescription.prescriptionStatus)}`}>
                            {prescription.prescriptionStatusLabel}
                          </span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </section>
          ) : null}

          {activeTab === "pre-orders" ? (
            <section>
              <div className="mb-6 flex items-center justify-between gap-4">
                <h2>Pre-orders</h2>
                <Link
                  to="/profile/pre-orders"
                  className="rounded-lg bg-primary px-4 py-2 text-white transition-colors hover:bg-primary/90"
                >
                  Xem chi tiết
                </Link>
              </div>

              {ui.preOrdersError ? (
                <ErrorCard message={ui.preOrdersError} onRetry={actions.retryOrders} />
              ) : ui.preOrdersLoading ? (
                <LoadingCard message="Đang tải danh sách pre-order..." />
              ) : preOrders.length === 0 ? (
                <EmptyCard
                  title="Bạn chưa có pre-order nào"
                  description="Các đơn đặt trước thật từ backend sẽ hiển thị tại đây."
                  actionLabel="Xem sản phẩm"
                  actionTo="/shop"
                />
              ) : (
                <div className="space-y-4">
                  {preOrders.map((order) => (
                    <Link
                      key={order.orderId}
                      to={`/orders/${order.orderId}`}
                      className="block rounded-xl bg-secondary p-6 transition-colors hover:bg-muted"
                    >
                      <div className="flex items-center gap-6">
                        <img
                          src={order.firstItemImage}
                          alt={order.firstItemName}
                          className="h-16 w-16 rounded-lg object-cover"
                        />
                        <div className="flex-1">
                          <p className="mb-1">Pre-order #{order.orderId}</p>
                          <p className="text-sm text-muted-foreground">{order.createdAtLabel}</p>
                        </div>
                        <div className="text-right">
                          <p className="mb-1">{formatCurrency(order.totalAmount)}</p>
                          <span className={`inline-block rounded-full px-3 py-1 text-xs ${getStatusColor(order.statusKey)}`}>
                            {order.statusLabel}
                          </span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </section>
          ) : null}

          {activeTab === "account" ? (
            <section>
              <h2 className="mb-6">Thông Tin Tài Khoản</h2>

              {ui.profileError ? <ErrorCard message={ui.profileError} onRetry={actions.retryProfile} /> : null}

              <div className="space-y-6 rounded bg-secondary p-6">
                {ui.profileLoading && !profile ? <LoadingCard message="Đang tải thông tin tài khoản..." compact /> : null}

                <div>
                  <label className="mb-2 block text-sm">Họ và tên</label>
                  <input
                    type="text"
                    value={accountForm.fullName}
                    onChange={(event) => actions.setAccountField("fullName", event.target.value)}
                    className="w-full rounded-lg border border-border bg-white px-4 py-3 focus:border-primary focus:outline-none"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm">Email</label>
                  <input
                    type="email"
                    value={accountForm.email}
                    readOnly
                    className="w-full rounded-lg border border-border bg-white px-4 py-3 text-muted-foreground focus:outline-none"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm">Số điện thoại</label>
                  <input
                    type="tel"
                    value={accountForm.phone}
                    onChange={(event) => actions.setAccountField("phone", event.target.value)}
                    className="w-full rounded-lg border border-border bg-white px-4 py-3 focus:border-primary focus:outline-none"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleSaveProfile}
                  disabled={ui.saveStatus === "loading"}
                  className="rounded-lg bg-primary px-6 py-3 text-white transition-colors hover:bg-primary/90 disabled:opacity-60"
                >
                  {ui.saveStatus === "loading" ? "Đang lưu..." : "Lưu thay đổi"}
                </button>
              </div>
            </section>
          ) : null}

          {activeTab === "settings" ? (
            <section>
              <h2 className="mb-6">Cài Đặt</h2>
              <div className="rounded-xl bg-secondary p-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <InfoRow label="Email đăng nhập" value={accountForm.email || profile?.email || "Chưa cập nhật"} />
                  <InfoRow label="Số điện thoại" value={accountForm.phone || profile?.phone || "Chưa cập nhật"} />
                  <InfoRow label="Tên tài khoản" value={accountForm.fullName || profile?.fullName || "Chưa cập nhật"} />
                  <InfoRow label="Mã người dùng" value={profile?.userId ? `#${profile.userId}` : "Chưa cập nhật"} />
                </div>
              </div>
            </section>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function TabButton({ active, icon: Icon, label, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left transition-colors ${
        active ? "bg-primary text-white" : "hover:bg-secondary"
      }`}
    >
      <Icon className="h-5 w-5" />
      {label}
    </button>
  );
}

function ErrorCard({ message, onRetry }) {
  return (
    <div className="rounded-xl border border-red-200 bg-red-50 p-5">
      <p className="mb-4 text-sm text-red-700">{message}</p>
      <button
        type="button"
        onClick={onRetry}
        className="rounded-lg bg-red-600 px-4 py-2 text-white hover:bg-red-700"
      >
        Tải lại
      </button>
    </div>
  );
}

function LoadingCard({ message, compact = false }) {
  return (
    <div className={`rounded-xl bg-white/70 text-center ${compact ? "p-4" : "p-8"}`}>
      <div className="mx-auto mb-3 h-8 w-8 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );
}

function EmptyCard({ title, description, actionLabel, actionTo }) {
  return (
    <div className="rounded-xl bg-secondary p-8 text-center">
      <Package className="mx-auto mb-4 h-14 w-14 text-muted-foreground opacity-50" />
      <p className="mb-2">{title}</p>
      <p className="mb-5 text-sm text-muted-foreground">{description}</p>
      <Link
        to={actionTo}
        className="inline-block rounded-lg bg-primary px-5 py-2 text-white transition-colors hover:bg-primary/90"
      >
        {actionLabel}
      </Link>
    </div>
  );
}

function getStatusColor(statusKey) {
  switch (statusKey) {
    case "delivered":
      return "bg-green-100 text-green-700";
    case "shipping":
      return "bg-blue-100 text-blue-700";
    case "cancelled":
      return "bg-red-100 text-red-700";
    default:
      return "bg-amber-100 text-amber-700";
  }
}

function InfoRow({ label, value }) {
  return (
    <div className="rounded-lg bg-white p-4">
      <p className="mb-1 text-sm text-muted-foreground">{label}</p>
      <p>{value}</p>
    </div>
  );
}

function getPrescriptionStatusColor(status) {
  switch (String(status ?? "").trim().toLowerCase()) {
    case "approved":
    case "inproduction":
      return "bg-green-100 text-green-700";
    case "needmoreinfo":
      return "bg-amber-100 text-amber-700";
    case "rejected":
      return "bg-red-100 text-red-700";
    default:
      return "bg-blue-100 text-blue-700";
  }
}

function formatCurrency(value) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(Number(value ?? 0));
}

function resolveErrorMessage(error, fallbackMessage) {
  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message;
  }

  if (typeof error === "string" && error.trim().length > 0) {
    return error;
  }

  return fallbackMessage;
}


