import { Link } from "react-router";
import { toast } from "sonner";
import { Clock, Eye, Package, Settings, User } from "lucide-react";
import { useProfilePage } from "@/hooks/profile/useProfilePage";

export default function ProfilePage() {
  const { activeTab, profile, accountForm, recentOrders, ui, actions } = useProfilePage();

  async function handleSaveProfile() {
    try {
      await actions.saveAccount();
      toast.success("Da luu thong tin tai khoan.");
    } catch (error) {
      toast.error(resolveErrorMessage(error, ui.saveError || "Khong the luu thong tin tai khoan."));
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="mb-4">Tai Khoan Cua Toi</h1>
      <p className="mb-12 text-muted-foreground">{profile?.email || accountForm.email || "Dang tai thong tin..."}</p>

      <div className="grid gap-8 lg:grid-cols-4">
        <aside className="lg:col-span-1">
          <nav className="space-y-2">
            <TabButton
              active={activeTab === "orders"}
              icon={Package}
              label="Don hang"
              onClick={() => actions.setActiveTab("orders")}
            />
            <TabButton
              active={activeTab === "prescriptions"}
              icon={Eye}
              label="Don kinh"
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
              label="Thong tin tai khoan"
              onClick={() => actions.setActiveTab("account")}
            />
            <TabButton
              active={activeTab === "settings"}
              icon={Settings}
              label="Cai dat"
              onClick={() => actions.setActiveTab("settings")}
            />
          </nav>
        </aside>

        <div className="lg:col-span-3">
          {activeTab === "orders" ? (
            <section>
              <div className="mb-6 flex items-center justify-between gap-4">
                <h2>Lich Su Don Hang</h2>
                <Link to="/orders" className="text-sm text-primary hover:underline">
                  Xem tat ca
                </Link>
              </div>

              {ui.ordersError ? (
                <ErrorCard message={ui.ordersError} onRetry={actions.retryOrders} />
              ) : ui.ordersLoading ? (
                <LoadingCard message="Dang tai lich su don hang..." />
              ) : recentOrders.length === 0 ? (
                <EmptyCard
                  title="Ban chua co don hang nao"
                  description="Sau khi mua hang, lich su don hang se hien thi tai day."
                  actionLabel="Kham pha san pham"
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
                          <p className="mb-1">Don hang #{order.orderId}</p>
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
            <PlaceholderSection
              title="Don Kinh Da Luu"
              description="FE nay chua duoc map API don kinh. Hien tai backend va UI cho tab nay chua duoc noi data that."
            />
          ) : null}

          {activeTab === "pre-orders" ? (
            <div>
              <div className="mb-6 flex items-center justify-between">
                <h2>Pre-orders</h2>
                <Link
                  to="/profile/pre-orders"
                  className="rounded-lg bg-primary px-4 py-2 text-white transition-colors hover:bg-primary/90"
                >
                  Xem chi tiet
                </Link>
              </div>
              <PlaceholderSection
                title="Pre-order"
                description="Tab nay dang giu link sang trang pre-order rieng. Neu ban muon, minh co the map tiep pre-order API sau."
              />
            </div>
          ) : null}

          {activeTab === "account" ? (
            <section>
              <h2 className="mb-6">Thong Tin Tai Khoan</h2>

              {ui.profileError ? <ErrorCard message={ui.profileError} onRetry={actions.retryProfile} /> : null}

              <div className="space-y-6 rounded bg-secondary p-6">
                {ui.profileLoading && !profile ? <LoadingCard message="Dang tai thong tin tai khoan..." compact /> : null}

                <div className="grid gap-6 md:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm">Ho</label>
                    <input
                      type="text"
                      value={accountForm.firstName}
                      onChange={(event) => actions.setAccountField("firstName", event.target.value)}
                      className="w-full rounded-lg border border-border bg-white px-4 py-3 focus:border-primary focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm">Ten</label>
                    <input
                      type="text"
                      value={accountForm.lastName}
                      onChange={(event) => actions.setAccountField("lastName", event.target.value)}
                      className="w-full rounded-lg border border-border bg-white px-4 py-3 focus:border-primary focus:outline-none"
                    />
                  </div>
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
                  <label className="mb-2 block text-sm">So dien thoai</label>
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
                  {ui.saveStatus === "loading" ? "Dang luu..." : "Luu thay doi"}
                </button>
              </div>
            </section>
          ) : null}

          {activeTab === "settings" ? (
            <PlaceholderSection
              title="Cai Dat"
              description="Trang settings van dang la UI mock rieng. Neu can, minh co the tiep tuc map du lieu that cho trang nay sau."
            />
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
        Tai lai
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

function PlaceholderSection({ title, description }) {
  return (
    <div className="rounded-xl bg-secondary p-8">
      <h2 className="mb-3">{title}</h2>
      <p className="text-sm text-muted-foreground">{description}</p>
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
