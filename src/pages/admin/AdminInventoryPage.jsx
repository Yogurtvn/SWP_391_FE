import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, Boxes, PackagePlus, Search, Sparkles } from "lucide-react";
import { AdminErrorBanner, AdminPageShell, AdminPagination, AdminSection, adminStyles } from "@/components/admin/admin-ui";
import { useAdminInventoryPage } from "@/hooks/admin/useAdminInventoryPage";

const PAGE_SIZE = 10;
const LOW_STOCK_THRESHOLD = 10;

function formatDateTime(value) {
  if (!value) {
    return "-";
  }

  const rawValue = String(value ?? "").trim();
  const noTimezoneIsoPattern = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?$/;
  const normalizedValue = noTimezoneIsoPattern.test(rawValue) ? `${rawValue}Z` : rawValue;
  const date = value instanceof Date ? value : new Date(normalizedValue);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return new Intl.DateTimeFormat("vi-VN", {
    timeZone: "Asia/Ho_Chi_Minh",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    day: "numeric",
    month: "numeric",
    year: "numeric",
    hour12: false,
  }).format(date);
}

function resolveRecordedValue(value) {
  return String(value ?? "").trim() || "Chưa xác định";
}

function normalizeSearchValue(value) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function resolveInventoryProductGroupKey(item) {
  const productId = Number(item?.productId ?? 0);
  if (Number.isFinite(productId) && productId > 0) {
    return `product-${productId}`;
  }

  const normalizedName = normalizeSearchValue(item?.productName);
  const normalizedImage = String(item?.productImageUrl ?? "").trim().toLowerCase();
  if (normalizedName || normalizedImage) {
    return `fallback-${normalizedName}|${normalizedImage}`;
  }

  return `variant-${Number(item?.variantId ?? 0) || 0}`;
}

function formatNumber(value) {
  return new Intl.NumberFormat("vi-VN").format(Number(value ?? 0));
}

export default function AdminInventoryPage() {
  const {
    inventories,
    receipts,
    receiptForm,
    skuOptions,
    receiptDetail,
    ui,
    actions,
    popupElement,
  } = useAdminInventoryPage();

  const [page, setPage] = useState(1);
  const [inventorySearchQuery, setInventorySearchQuery] = useState("");
  const [preOrderFilter, setPreOrderFilter] = useState("all");
  const [stockFilter, setStockFilter] = useState("all");

  const selectedReceiptVariant = useMemo(() => {
    const normalizedSku = normalizeSearchValue(receiptForm.sku);
    if (!normalizedSku) {
      return null;
    }

    return (
      inventories.find((item) => normalizeSearchValue(item?.sku) === normalizedSku) ??
      null
    );
  }, [inventories, receiptForm.sku]);

  const latestReceiptByVariantId = useMemo(() => {
    const map = new Map();

    receipts.forEach((receipt) => {
      const variantId = Number(receipt?.variantId ?? 0);
      if (!Number.isFinite(variantId) || variantId <= 0) {
        return;
      }

      const receivedAt = new Date(receipt?.receivedDate ?? 0).getTime();
      const normalizedReceivedAt = Number.isFinite(receivedAt) ? receivedAt : -1;
      const current = map.get(variantId);

      if (!current || normalizedReceivedAt > current.receivedAt) {
        map.set(variantId, {
          receivedAt: normalizedReceivedAt,
          recordedByName: receipt?.recordedByName,
          recordedByRole: receipt?.recordedByRole,
        });
      }
    });

    return map;
  }, [receipts]);

  const inventoryStats = useMemo(() => {
    const totalVariants = inventories.length;
    const totalQuantity = inventories.reduce((sum, item) => sum + Number(item?.quantity ?? 0), 0);
    const preOrderEnabled = inventories.filter((item) => Boolean(item?.isPreOrderAllowed)).length;
    const lowStock = inventories.filter((item) => {
      const quantity = Number(item?.quantity ?? 0);
      return quantity > 0 && quantity <= LOW_STOCK_THRESHOLD;
    }).length;
    const outOfStock = inventories.filter((item) => Number(item?.quantity ?? 0) <= 0).length;

    return {
      totalVariants,
      totalQuantity,
      preOrderEnabled,
      lowStock,
      outOfStock,
    };
  }, [inventories]);

  const filteredInventories = useMemo(() => {
    const normalizedQuery = normalizeSearchValue(inventorySearchQuery);

    return inventories.filter((item) => {
      const quantity = Number(item?.quantity ?? 0);
      const isPreOrderAllowed = Boolean(item?.isPreOrderAllowed);

      const matchesPreOrder =
        preOrderFilter === "all" ||
        (preOrderFilter === "enabled" && isPreOrderAllowed) ||
        (preOrderFilter === "disabled" && !isPreOrderAllowed);

      const matchesStock =
        stockFilter === "all" ||
        (stockFilter === "inStock" && quantity > 0) ||
        (stockFilter === "outStock" && quantity <= 0) ||
        (stockFilter === "lowStock" && quantity > 0 && quantity <= LOW_STOCK_THRESHOLD);

      if (!matchesPreOrder || !matchesStock) {
        return false;
      }

      if (!normalizedQuery) {
        return true;
      }

      const searchableText = [
        item?.sku,
        item?.variantId,
        item?.productId,
        item?.productName,
        item?.preOrderNote,
        item?.expectedRestockDate,
      ]
        .map((value) => normalizeSearchValue(value))
        .join(" ");

      return searchableText.includes(normalizedQuery);
    }).sort((a, b) => {
      const leftProductId = Number(a?.productId ?? 0);
      const rightProductId = Number(b?.productId ?? 0);
      const leftVariantId = Number(a?.variantId ?? 0);
      const rightVariantId = Number(b?.variantId ?? 0);

      const normalizedLeftProductId =
        Number.isFinite(leftProductId) && leftProductId > 0 ? leftProductId : Number.MAX_SAFE_INTEGER;
      const normalizedRightProductId =
        Number.isFinite(rightProductId) && rightProductId > 0 ? rightProductId : Number.MAX_SAFE_INTEGER;

      if (normalizedLeftProductId !== normalizedRightProductId) {
        return normalizedLeftProductId - normalizedRightProductId;
      }

      return leftVariantId - rightVariantId;
    });
  }, [inventories, inventorySearchQuery, preOrderFilter, stockFilter]);

  const productVariantCountByGroupKey = useMemo(() => {
    const counts = new Map();

    inventories.forEach((item) => {
      const groupKey = resolveInventoryProductGroupKey(item);
      counts.set(groupKey, (counts.get(groupKey) ?? 0) + 1);
    });

    return counts;
  }, [inventories]);

  const totalPages = Math.max(1, Math.ceil(filteredInventories.length / PAGE_SIZE));
  const paginatedInventories = useMemo(
    () => filteredInventories.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [filteredInventories, page],
  );

  useEffect(() => {
    setPage(1);
  }, [inventorySearchQuery, preOrderFilter, stockFilter]);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  return (
    <AdminPageShell
      title="Quản Lý Kho"
      actions={(
        <button type="button" onClick={actions.retry} className={adminStyles.secondaryButton}>
          Tải lại dữ liệu
        </button>
      )}
    >
      <AdminErrorBanner message={ui.error} />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={Boxes}
          title="Tổng biến thể"
          value={formatNumber(inventoryStats.totalVariants)}
          subtitle="Đang theo dõi trong kho"
          tone="blue"
        />
        <StatCard
          icon={PackagePlus}
          title="Tổng tồn"
          value={formatNumber(inventoryStats.totalQuantity)}
          subtitle="Số lượng sản phẩm hiện có"
          tone="emerald"
        />
        <StatCard
          icon={Sparkles}
          title="Pre-order bật"
          value={formatNumber(inventoryStats.preOrderEnabled)}
          subtitle="Biến thể cho phép đặt trước"
          tone="orange"
        />
        <StatCard
          icon={AlertTriangle}
          title="Sắp hết / Hết"
          value={`${formatNumber(inventoryStats.lowStock)} / ${formatNumber(inventoryStats.outOfStock)}`}
          subtitle={`Ngưỡng cảnh báo <= ${LOW_STOCK_THRESHOLD}`}
          tone="rose"
        />
      </section>

      <AdminSection
        title="Nhập kho nhanh"
        subtitle="Nhập SKU để tự map Variant ID, sau đó tạo phiếu nhập ngay."
      >
        <form onSubmit={actions.createReceipt} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div className="space-y-2">
              <FieldLabel text="SKU" />
              <input
                type="text"
                list="inventory-sku-options"
                autoComplete="off"
                spellCheck={false}
                value={receiptForm.sku}
                onChange={(event) => actions.setReceiptSku(event.target.value)}
                placeholder="Nhập SKU"
                className={adminStyles.input}
                required
              />
              <datalist id="inventory-sku-options">
                {skuOptions.map((sku) => (
                  <option key={sku} value={sku} />
                ))}
              </datalist>
            </div>

            <div className="space-y-2">
              <FieldLabel text="Variant ID" />
              <input
                value={receiptForm.variantId}
                readOnly
                placeholder="Variant ID tự điền"
                className={`${adminStyles.input} bg-slate-50`}
              />
            </div>

            <div className="space-y-2">
              <FieldLabel text="Số lượng nhập" />
              <input
                type="number"
                min="1"
                value={receiptForm.quantityReceived}
                onChange={(event) => actions.setReceiptField("quantityReceived", event.target.value)}
                placeholder="VD: 20"
                className={adminStyles.input}
                required
              />
            </div>

            <div className="space-y-2">
              <FieldLabel text="Ghi chú" />
              <input
                value={receiptForm.note}
                onChange={(event) => actions.setReceiptField("note", event.target.value)}
                placeholder="Ghi chú phiếu nhập"
                className={adminStyles.input}
              />
            </div>
          </div>

          {receiptForm.sku ? (
            selectedReceiptVariant ? (
              <div className="rounded-[1.1rem] border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                SKU khớp với Variant #{selectedReceiptVariant.variantId} - Tồn hiện tại:{" "}
                <span className="font-bold">{formatNumber(selectedReceiptVariant.quantity)}</span>
              </div>
            ) : (
              <div className="rounded-[1.1rem] border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                Chưa tìm thấy Variant ID tương ứng cho SKU này. Kiểm tra lại mã SKU.
              </div>
            )
          ) : null}

          <button
            type="submit"
            className="inline-flex items-center gap-2 rounded-[1.2rem] bg-emerald-600 px-5 py-3 text-base font-bold text-white shadow-[0_12px_24px_rgba(5,150,105,0.2)] transition hover:bg-emerald-700"
          >
            <PackagePlus className="h-5 w-5" />
            Tạo phiếu nhập
          </button>
        </form>
      </AdminSection>

      <AdminSection
        title="Danh sách tồn kho"
        subtitle="Tìm nhanh SKU, lọc pre-order và lọc mức tồn kho để thao tác thuận tiện hơn."
        actions={(
          <button
            type="button"
            onClick={() => {
              setInventorySearchQuery("");
              setPreOrderFilter("all");
              setStockFilter("all");
            }}
            className={adminStyles.secondaryButton}
          >
            Xóa bộ lọc
          </button>
        )}
      >
        <div className="mb-4 grid gap-3 lg:grid-cols-[1fr_auto_auto]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={inventorySearchQuery}
              onChange={(event) => setInventorySearchQuery(event.target.value)}
              placeholder="Tìm theo SKU, Variant ID, tên sản phẩm, ghi chú..."
              className={`${adminStyles.input} pl-11`}
            />
          </div>

          <select
            value={preOrderFilter}
            onChange={(event) => setPreOrderFilter(event.target.value)}
            className={adminStyles.input}
          >
            <option value="all">Pre-order: Tất cả</option>
            <option value="enabled">Pre-order: Bật</option>
            <option value="disabled">Pre-order: Tắt</option>
          </select>

          <select
            value={stockFilter}
            onChange={(event) => setStockFilter(event.target.value)}
            className={adminStyles.input}
          >
            <option value="all">Tồn kho: Tất cả</option>
            <option value="inStock">Tồn kho: Còn hàng</option>
            <option value="lowStock">Tồn kho: Sắp hết</option>
            <option value="outStock">Tồn kho: Hết hàng</option>
          </select>
        </div>

        <p className="mb-4 text-sm font-medium text-slate-500">
          Hiển thị <span className="font-bold text-slate-700">{paginatedInventories.length}</span> /{" "}
          <span className="font-bold text-slate-700">{filteredInventories.length}</span> biến thể phù hợp.
        </p>

        <div className={adminStyles.tableWrapper}>
          <table className={adminStyles.table}>
            <thead className="bg-slate-50/90">
              <tr>
                <th className={adminStyles.th}>Sản phẩm</th>
                <th className={adminStyles.th}>SKU / Variant</th>
                <th className={adminStyles.th}>Tồn kho</th>
                <th className={adminStyles.th}>Pre-order</th>
                <th className={adminStyles.th}>Ngày dự kiến có hàng</th>
                <th className={adminStyles.th}>Người nhập gần nhất</th>
                <th className={adminStyles.th}>Ghi chú pre-order</th>
                <th className={adminStyles.th}>Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {!ui.isLoading && filteredInventories.length === 0 ? (
                <tr>
                  <td colSpan={8} className={adminStyles.emptyState}>
                    Không có dữ liệu phù hợp bộ lọc.
                  </td>
                </tr>
              ) : null}

              {paginatedInventories.map((item) => {
                const latestReceipt = latestReceiptByVariantId.get(Number(item.variantId));
                const isInStock = Number(item?.quantity ?? 0) > 0;

                return (
                  <tr key={item.variantId} className="transition hover:bg-orange-50/40">
                    <td className={adminStyles.td}>
                      <ProductCell
                        productName={item.productName}
                        imageUrl={item.productImageUrl}
                        productId={item.productId}
                        variantCount={productVariantCountByGroupKey.get(resolveInventoryProductGroupKey(item)) ?? 0}
                      />
                    </td>
                    <td className={adminStyles.td}>
                      <p className="font-bold text-slate-900">{item.sku || "-"}</p>
                      <p className="mt-1 text-xs font-semibold text-slate-500">
                        {Number(item?.productId ?? 0) > 0 ? `SP #${item.productId}` : "SP chưa rõ"}
                      </p>
                      <p className="mt-1 text-sm text-slate-500">Variant #{item.variantId}</p>
                    </td>
                    <td className={adminStyles.td}>
                      <StockBadge quantity={item.quantity} />
                    </td>
                    <td className={adminStyles.td}>
                      <PreOrderBadge enabled={item.isPreOrderAllowed} />
                    </td>
                    <td className={adminStyles.td}>
                      {item.isPreOrderAllowed ? formatDateTime(item.expectedRestockDate) : "-"}
                    </td>
                    <td className={adminStyles.td}>
                      <ImporterCell
                        name={latestReceipt?.recordedByName}
                        role={latestReceipt?.recordedByRole}
                      />
                    </td>
                    <td className={adminStyles.td}>
                      {item.preOrderNote ? (
                        <p className="max-w-[22rem] text-sm leading-6 text-slate-600">
                          {item.preOrderNote}
                        </p>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>
                    <td className={adminStyles.td}>
                      <button
                        type="button"
                        onClick={() => actions.editPreOrder(item)}
                        disabled={isInStock}
                        title={isInStock ? "Biến thể còn hàng nên không thể sửa pre-order." : undefined}
                        className="inline-flex items-center justify-center rounded-[1rem] border border-orange-200 bg-orange-50 px-4 py-2 text-sm font-bold text-orange-700 shadow-[0_6px_12px_rgba(249,115,22,0.08)] transition hover:bg-orange-100 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Sửa pre-order
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          <AdminPagination
            page={page}
            totalPages={totalPages}
            onPageChange={setPage}
            summary={`Trang ${page} / ${totalPages} - hiển thị ${paginatedInventories.length} / ${filteredInventories.length} dòng`}
          />
        </div>
      </AdminSection>

      <AdminSection title="Phiếu nhập gần đây" subtitle="Kiểm tra lịch sử nhập hàng và người ghi nhận gần nhất.">
        <div className="overflow-x-auto">
          <table className={adminStyles.table}>
            <thead className={adminStyles.tableHead}>
              <tr>
                <th className={adminStyles.th}>Mã phiếu</th>
                <th className={adminStyles.th}>Sản phẩm / Variant</th>
                <th className={adminStyles.th}>SKU</th>
                <th className={adminStyles.th}>Số lượng</th>
                <th className={adminStyles.th}>Ngày nhận</th>
                <th className={adminStyles.th}>Người nhập</th>
                <th className={adminStyles.th}>Vai trò</th>
                <th className={adminStyles.th}>Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {!ui.isLoading && receipts.length === 0 ? (
                <tr>
                  <td colSpan={8} className={adminStyles.emptyState}>
                    Không có phiếu nhập.
                  </td>
                </tr>
              ) : null}

              {receipts.map((receipt) => (
                <tr key={receipt.receiptId} className="transition hover:bg-orange-50/30">
                  <td className={`${adminStyles.td} font-bold text-slate-900`}>#{receipt.receiptId}</td>
                  <td className={adminStyles.td}>
                    <ProductCell
                      productName={receipt.productName}
                      imageUrl={receipt.productImageUrl}
                    />
                    <p className="mt-1 text-xs text-slate-500">Variant #{receipt.variantId}</p>
                  </td>
                  <td className={adminStyles.td}>{receipt.sku || "-"}</td>
                  <td className={adminStyles.td}>
                    <QuantityPill value={receipt.quantityReceived} />
                  </td>
                  <td className={adminStyles.td}>{formatDateTime(receipt.receivedDate)}</td>
                  <td className={adminStyles.td}>{resolveRecordedValue(receipt.recordedByName)}</td>
                  <td className={adminStyles.td}>
                    <RoleBadge role={resolveRecordedValue(receipt.recordedByRole)} />
                  </td>
                  <td className={adminStyles.td}>
                    <button
                      type="button"
                      onClick={() => actions.viewReceiptDetail(receipt.receiptId)}
                      disabled={ui.isLoadingReceiptDetail}
                      className={adminStyles.smallButton}
                    >
                      Chi tiết
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </AdminSection>

      {receiptDetail ? (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/45 p-4">
          <div className="w-full max-w-2xl rounded-[1.6rem] border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <h3 className="text-xl font-bold text-[#11284b]">Chi tiết phiếu nhập #{receiptDetail.receiptId}</h3>
                <p className="mt-1 text-sm text-slate-500">
                  Thông tin người ghi nhận được lấy trực tiếp từ response BE.
                </p>
              </div>
              <button type="button" onClick={actions.closeReceiptDetail} className={adminStyles.secondaryButton}>
                Đóng
              </button>
            </div>

            <div className="grid gap-3 text-sm md:grid-cols-2">
              <DetailItem label="Receipt ID" value={receiptDetail.receiptId} />
              <DetailItem label="Sản phẩm" value={receiptDetail.productName || "-"} />
              <DetailItem label="SKU" value={receiptDetail.sku || "-"} />
              <DetailItem label="Variant ID" value={receiptDetail.variantId} />
              <DetailItem label="Số lượng" value={receiptDetail.quantityReceived} />
              <DetailItem label="Ngày nhận" value={formatDateTime(receiptDetail.receivedDate)} />
              <DetailItem label="Người nhập hàng" value={resolveRecordedValue(receiptDetail.recordedByName)} />
              <DetailItem label="Vai trò" value={resolveRecordedValue(receiptDetail.recordedByRole)} />
              <DetailItem label="User ID ghi nhận" value={resolveRecordedValue(receiptDetail.recordedByUserId)} />
              <DetailItem label="Ghi chú" value={resolveRecordedValue(receiptDetail.note || "-")} />
            </div>
          </div>
        </div>
      ) : null}

      {popupElement}
    </AdminPageShell>
  );
}

function FieldLabel({ text }) {
  return <p className="text-sm font-bold text-slate-700">{text}</p>;
}

function StatCard({ icon: Icon, title, value, subtitle, tone = "blue" }) {
  const toneClasses = {
    blue: "from-blue-500/10 to-blue-50 text-blue-700",
    emerald: "from-emerald-500/10 to-emerald-50 text-emerald-700",
    orange: "from-orange-500/10 to-orange-50 text-orange-700",
    rose: "from-rose-500/10 to-rose-50 text-rose-700",
  };

  return (
    <div className={`${adminStyles.card} overflow-hidden`}>
      <div className="p-5">
        <div className="mb-3 flex items-center justify-between">
          <div className={`rounded-xl bg-gradient-to-br p-2.5 ${toneClasses[tone] ?? toneClasses.blue}`}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
        <p className="text-sm font-semibold text-slate-500">{title}</p>
        <p className="mt-1 text-2xl font-bold text-slate-900">{value}</p>
        <p className="mt-2 text-xs text-slate-500">{subtitle}</p>
      </div>
    </div>
  );
}

function StockBadge({ quantity }) {
  const normalizedQuantity = Number(quantity ?? 0);
  const isOutOfStock = normalizedQuantity <= 0;
  const isLowStock = normalizedQuantity > 0 && normalizedQuantity <= LOW_STOCK_THRESHOLD;

  if (isOutOfStock) {
    return <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-bold text-red-700">Hết hàng</span>;
  }

  if (isLowStock) {
    return (
      <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-700">
        {formatNumber(normalizedQuantity)} (Sắp hết)
      </span>
    );
  }

  return (
    <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700">
      {formatNumber(normalizedQuantity)}
    </span>
  );
}

function PreOrderBadge({ enabled }) {
  return enabled ? (
    <span className="rounded-full bg-orange-100 px-3 py-1 text-xs font-bold text-orange-700">Bật</span>
  ) : (
    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">Tắt</span>
  );
}

function RoleBadge({ role }) {
  const normalizedRole = normalizeSearchValue(role);
  const isAdminRole = normalizedRole.includes("admin");

  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-bold ${
        isAdminRole ? "bg-indigo-100 text-indigo-700" : "bg-slate-100 text-slate-600"
      }`}
    >
      {role}
    </span>
  );
}

function QuantityPill({ value }) {
  return (
    <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700">
      +{formatNumber(value)}
    </span>
  );
}

function ProductCell({ productName, imageUrl, productId, variantCount }) {
  const resolvedName = String(productName ?? "").trim() || "Chưa xác định";
  const fallbackLetter = resolvedName.charAt(0).toUpperCase() || "?";
  const hasValidProductId = Number(productId ?? 0) > 0;
  const hasSiblingVariant = Number(variantCount ?? 0) > 1;

  return (
    <div className="flex items-center gap-3">
      {imageUrl ? (
        <img
          src={imageUrl}
          alt={resolvedName}
          className="h-11 w-11 rounded-lg border border-slate-200 object-cover"
        />
      ) : (
        <div className="flex h-11 w-11 items-center justify-center rounded-lg border border-slate-200 bg-slate-100 text-sm font-bold text-slate-600">
          {fallbackLetter}
        </div>
      )}
      <div>
        <p className="font-semibold text-slate-900">{resolvedName}</p>
        <div className="mt-1 flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-semibold text-blue-700">
            {hasValidProductId ? `SP #${productId}` : "SP chưa rõ"}
          </span>
          {hasSiblingVariant ? (
            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-600">
              {variantCount} biến thể cùng sản phẩm
            </span>
          ) : null}
        </div>
      </div>
    </div>
  );
}
function DetailItem({ label, value }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 font-medium text-slate-800">{value}</p>
    </div>
  );
}

function ImporterCell({ name, role }) {
  const resolvedName = resolveRecordedValue(name);
  const resolvedRole = resolveRecordedValue(role);

  return (
    <div className="leading-6">
      <p className="font-semibold text-slate-900">{resolvedName}</p>
      <p className="text-xs text-slate-500">{resolvedRole}</p>
    </div>
  );
}
