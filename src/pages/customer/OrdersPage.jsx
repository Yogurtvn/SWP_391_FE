import { Link } from "react-router";
import { ChevronRight, Eye, Package, Search } from "lucide-react";
import { useOrdersPage } from "@/hooks/order/useOrdersPage";

export default function OrdersPage() {
  const { isAuthenticated, orders, filters, ui, actions } = useOrdersPage();

  if (!isAuthenticated) {
    return (
      <StateCard
        title="Can dang nhap de xem don hang"
        description="Danh sach don hang cua ban chi hien thi sau khi dang nhap."
        primaryAction={{
          label: "Dang nhap",
          to: "/login",
        }}
        secondaryAction={{
          label: "Quay lai cua hang",
          to: "/shop",
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="mb-2 text-3xl">Don Hang Cua Toi</h1>
          <p className="text-muted-foreground">Quan ly va theo doi tat ca don hang co san cua ban.</p>
        </div>

        <div className="mb-6 flex flex-col gap-4 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Tim ma don hang..."
              value={filters.searchQuery}
              onChange={(event) => actions.setSearchQuery(event.target.value)}
              className="w-full rounded-lg border border-border py-2 pl-10 pr-4 focus:border-primary focus:outline-none"
            />
          </div>

          <select
            value={filters.filterStatus}
            onChange={(event) => actions.setFilterStatus(event.target.value)}
            className="rounded-lg border border-border px-4 py-2 focus:border-primary focus:outline-none"
          >
            <option value="all">Tat ca trang thai</option>
            <option value="processing">Dang xu ly</option>
            <option value="shipping">Dang giao hang</option>
            <option value="delivered">Da giao hang</option>
            <option value="cancelled">Da huy</option>
          </select>
        </div>

        {ui.error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 p-6">
            <p className="mb-4 text-sm text-red-700">{ui.error}</p>
            <button
              type="button"
              onClick={actions.retry}
              className="rounded-lg bg-red-600 px-4 py-2 text-white hover:bg-red-700"
            >
              Tai lai
            </button>
          </div>
        ) : ui.isLoading ? (
          <LoadingState />
        ) : ui.isEmpty ? (
          <EmptyState searchQuery={filters.searchQuery} filterStatus={filters.filterStatus} />
        ) : (
          <div className="space-y-5">
            {orders.map((order) => (
              <div
                key={order.orderId}
                className="overflow-hidden rounded-lg border border-border bg-white transition-shadow hover:shadow-md"
              >
                <div className="flex flex-wrap items-center justify-between gap-4 bg-secondary px-6 py-4">
                  <div className="flex flex-wrap items-center gap-8">
                    <Column label="Ma don hang" value={`#${order.orderId}`} />
                    <Column label="Ngay dat" value={formatDate(order.createdAt)} />
                    <Column label="Tong tien" value={formatCurrency(order.totalAmount)} isAccent />
                  </div>
                  <span className={`rounded-full px-3 py-1 text-xs font-medium ${getStatusColor(order.statusKey)}`}>
                    {order.statusLabel}
                  </span>
                </div>

                <div className="px-6 py-5">
                  <div className="flex items-center gap-4">
                    <img
                      src={order.firstItemImage}
                      alt={order.firstItemName}
                      className="h-20 w-20 rounded-lg object-cover"
                    />
                    <div className="flex-1">
                      <p className="font-medium">{order.firstItemName}</p>
                      <p className="text-sm text-muted-foreground">So luong: {order.firstItemQuantity}</p>
                      {order.itemCount > 1 ? (
                        <p className="text-sm text-muted-foreground">Tong cong {order.itemCount} san pham trong don</p>
                      ) : null}
                    </div>
                  </div>

                  <div className="mt-4 flex gap-3 border-t border-border pt-4">
                    <Link
                      to={`/orders/${order.orderId}`}
                      className="flex items-center gap-2 rounded-lg border border-border px-4 py-2 transition-colors hover:bg-secondary"
                    >
                      <Eye className="h-4 w-4" />
                      <span className="text-sm">Chi tiet</span>
                    </Link>
                    <Link
                      to={`/invoice/${order.orderId}`}
                      className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-white transition-colors hover:bg-primary/90"
                    >
                      <span className="text-sm">Xem hoa don</span>
                      <ChevronRight className="h-4 w-4" />
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StateCard({ title, description, primaryAction, secondaryAction }) {
  return (
    <div className="min-h-screen bg-white">
      <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-border bg-secondary/40 p-10 text-center">
          <Package className="mx-auto mb-4 h-16 w-16 text-muted-foreground opacity-60" />
          <h1 className="mb-3 text-3xl">{title}</h1>
          <p className="mx-auto mb-6 max-w-2xl text-muted-foreground">{description}</p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link
              to={primaryAction.to}
              className="rounded-lg bg-primary px-6 py-3 text-white transition-colors hover:bg-primary/90"
            >
              {primaryAction.label}
            </Link>
            <Link
              to={secondaryAction.to}
              className="rounded-lg border border-border px-6 py-3 transition-colors hover:bg-secondary"
            >
              {secondaryAction.label}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="rounded-lg bg-secondary/60 p-12 text-center">
      <div className="mx-auto mb-4 h-10 w-10 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
      <p className="text-muted-foreground">Dang tai danh sach don hang...</p>
    </div>
  );
}

function EmptyState({ searchQuery, filterStatus }) {
  return (
    <div className="rounded-lg bg-secondary p-12 text-center">
      <Package className="mx-auto mb-4 h-16 w-16 text-muted-foreground opacity-50" />
      <p className="mb-4 text-muted-foreground">
        {searchQuery || filterStatus !== "all"
          ? "Khong tim thay don hang phu hop"
          : "Ban chua co don hang nao"}
      </p>
      {!searchQuery && filterStatus === "all" ? (
        <Link
          to="/shop"
          className="inline-block rounded-lg bg-primary px-6 py-2 text-white transition-colors hover:bg-primary/90"
        >
          Kham Pha San Pham
        </Link>
      ) : null}
    </div>
  );
}

function Column({ label, value, isAccent = false }) {
  return (
    <div>
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className={isAccent ? "font-semibold text-primary" : "font-semibold"}>{value}</p>
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

function formatDate(value) {
  if (!value) {
    return "Chua cap nhat";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Chua cap nhat";
  }

  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}
