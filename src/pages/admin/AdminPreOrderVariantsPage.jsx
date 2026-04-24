import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router";
import { useSelector } from "react-redux";
import { Clock3, Eye, Loader2, PackagePlus, RefreshCw, Search, X } from "lucide-react";
import { AdminErrorBanner, AdminPageShell, AdminPagination, AdminSection, adminStyles } from "@/components/admin/admin-ui";
import { usePopupDialog } from "@/components/common/ui/usePopupDialog";
import {
  createStockReceipt,
  getAllOrders,
  getInventories,
  getOrderItems,
  getProductById,
  getVariantById,
} from "@/services/adminService";
import { selectAuthState } from "@/store/auth/authSlice";

const PAGE_SIZE = 10;
const INACTIVE_PRE_ORDER_STATUSES = new Set(["completed", "cancelled", "failed", "rejected"]);

function normalizeValue(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[\s_-]+/g, "");
}

function formatCurrency(value) {
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(Number(value || 0));
}

function formatDateTime(value) {
  if (!value) {
    return "-";
  }

  return new Date(value).toLocaleString("vi-VN");
}

function formatDate(value) {
  if (!value) {
    return "-";
  }

  return new Date(value).toLocaleDateString("vi-VN");
}

function buildVariantLabel(row) {
  const parts = [];
  if (row.color) parts.push(`Màu: ${row.color}`);
  if (row.size) parts.push(`Size: ${row.size}`);
  if (row.frameType) parts.push(`Kiểu: ${row.frameType}`);
  return parts.length ? parts.join(" | ") : "Không có thuộc tính";
}

async function fetchAllPages(loader) {
  const items = [];
  let currentPage = 1;
  let totalPages = 1;

  while (currentPage <= totalPages) {
    const response = await loader(currentPage);
    const pageItems = Array.isArray(response?.items) ? response.items : [];
    items.push(...pageItems);

    const detectedTotalPages = Number(response?.totalPages ?? response?.totalPage ?? 1);
    if (!Number.isFinite(detectedTotalPages) || detectedTotalPages < 1) {
      break;
    }

    totalPages = detectedTotalPages;
    if (currentPage >= totalPages) {
      break;
    }

    currentPage += 1;
  }

  return items;
}

function isActivePreOrderOrder(order) {
  const orderType = normalizeValue(order?.orderType ?? order?.type);
  if (orderType !== "preorder") {
    return false;
  }

  const status = normalizeValue(order?.orderStatus ?? order?.status);
  return !INACTIVE_PRE_ORDER_STATUSES.has(status);
}

function ensureDemandEntry(map, key) {
  if (!map.has(key)) {
    map.set(key, {
      orderIds: new Set(),
      totalQuantity: 0,
      orderRows: new Map(),
    });
  }

  return map.get(key);
}

function mergeDemand(entry, order, quantity) {
  if (!Number.isFinite(quantity) || quantity <= 0) {
    return;
  }

  const orderId = Number(order?.orderId ?? order?.id ?? 0);
  if (!Number.isFinite(orderId) || orderId <= 0) {
    return;
  }

  entry.orderIds.add(orderId);
  entry.totalQuantity += quantity;

  const existing = entry.orderRows.get(orderId) ?? {
    orderId,
    customerName: order?.receiverName || order?.customerName || "-",
    orderStatus: order?.orderStatus || order?.status || "-",
    createdAt: order?.createdAt || null,
    totalAmount: Number(order?.totalAmount || order?.total || 0),
    quantity: 0,
  };

  existing.quantity += quantity;
  entry.orderRows.set(orderId, existing);
}

function statusClass(status) {
  const normalized = normalizeValue(status);
  if (["pending", "awaitingstock", "processing"].includes(normalized)) {
    return "border-amber-200 bg-amber-50 text-amber-700";
  }
  if (["confirmed", "shipped", "delivered"].includes(normalized)) {
    return "border-sky-200 bg-sky-50 text-sky-700";
  }
  if (["completed"].includes(normalized)) {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }
  if (["cancelled", "failed"].includes(normalized)) {
    return "border-red-200 bg-red-50 text-red-700";
  }
  return "border-slate-200 bg-slate-50 text-slate-700";
}

export default function AdminPreOrderVariantsPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { accessToken, isReady } = useSelector(selectAuthState);
  const { popupAlert, popupForm, popupElement } = usePopupDialog();
  const orderBasePath = location.pathname.startsWith("/staff") ? "/staff/orders" : "/admin/orders";

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedOrdersRow, setSelectedOrdersRow] = useState(null);
  const [selectedVariantRow, setSelectedVariantRow] = useState(null);
  const [importingVariantId, setImportingVariantId] = useState(null);

  const loadData = useCallback(async () => {
    if (!accessToken) {
      setError("Không có access token.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const inventoryItems = await fetchAllPages((pageNumber) =>
        getInventories(
          {
            page: pageNumber,
            pageSize: 100,
            isPreOrderAllowed: true,
            sortBy: "variantId",
            sortOrder: "asc",
          },
          accessToken,
        ),
      );

      const variantEntries = await Promise.all(
        inventoryItems.map(async (item) => {
          try {
            const detail = await getVariantById(item.variantId, accessToken);
            return [Number(item.variantId), detail];
          } catch {
            return [Number(item.variantId), null];
          }
        }),
      );
      const variantMap = new Map(variantEntries);

      const productIds = Array.from(
        new Set(
          variantEntries
            .map(([, detail]) => Number(detail?.productId))
            .filter((id) => Number.isFinite(id) && id > 0),
        ),
      );

      const productEntries = await Promise.all(
        productIds.map(async (productId) => {
          try {
            const detail = await getProductById(productId, accessToken);
            return [productId, detail];
          } catch {
            return [productId, null];
          }
        }),
      );
      const productMap = new Map(productEntries);

      const preOrderCandidates = await fetchAllPages((pageNumber) =>
        getAllOrders(
          {
            page: pageNumber,
            pageSize: 100,
            orderType: "preOrder",
            orderStatus: "awaitingStock",
            sortBy: "createdAt",
            sortOrder: "desc",
          },
          accessToken,
        ),
      );

      const activePreOrders = preOrderCandidates.filter(isActivePreOrderOrder);
      const orderItemsEntries = await Promise.all(
        activePreOrders.map(async (order) => {
          const orderId = Number(order?.orderId ?? order?.id ?? 0);
          if (!Number.isFinite(orderId) || orderId <= 0) {
            return { order, items: [] };
          }

          try {
            const result = await getOrderItems(orderId, accessToken);
            return { order, items: Array.isArray(result?.items) ? result.items : [] };
          } catch {
            return { order, items: [] };
          }
        }),
      );

      const demandByVariantId = new Map();
      const demandBySku = new Map();

      for (const { order, items } of orderItemsEntries) {
        for (const item of items) {
          const quantity = Number(item?.quantity ?? 0);
          if (!Number.isFinite(quantity) || quantity <= 0) {
            continue;
          }

          const variantId = Number(item?.variantId ?? item?.productVariantId ?? item?.variantID ?? 0);
          const sku = normalizeValue(item?.sku);

          if (Number.isFinite(variantId) && variantId > 0) {
            const entry = ensureDemandEntry(demandByVariantId, variantId);
            mergeDemand(entry, order, quantity);
          } else if (sku) {
            const entry = ensureDemandEntry(demandBySku, sku);
            mergeDemand(entry, order, quantity);
          }
        }
      }

      const mergedRows = inventoryItems.map((inventory) => {
        const variantId = Number(inventory?.variantId ?? 0);
        const sku = inventory?.sku || variantMap.get(variantId)?.sku || "-";
        const normalizedSku = normalizeValue(sku);
        const demand = demandByVariantId.get(variantId) ?? demandBySku.get(normalizedSku);
        const variantDetail = variantMap.get(variantId) ?? null;
        const product = variantDetail?.productId ? productMap.get(Number(variantDetail.productId)) : null;

        const currentStock = Number(inventory?.quantity ?? variantDetail?.quantity ?? 0);
        const preOrderQuantity = Number(demand?.totalQuantity ?? 0);
        const neededImportQuantity = Math.max(0, preOrderQuantity - Math.max(0, currentStock));

        return {
          variantId,
          sku,
          productName: variantDetail?.productName || product?.productName || "-",
          currentStock,
          preOrderOrderCount: Number(demand?.orderIds?.size ?? 0),
          preOrderQuantity,
          neededImportQuantity,
          expectedRestockDate: inventory?.expectedRestockDate ?? variantDetail?.expectedRestockDate ?? null,
          preOrderNote: inventory?.preOrderNote ?? variantDetail?.preOrderNote ?? "",
          color: variantDetail?.color || inventory?.color || "",
          size: variantDetail?.size || inventory?.size || "",
          frameType: variantDetail?.frameType || inventory?.frameType || "",
          price: Number(variantDetail?.price ?? 0),
          relatedOrders: demand
            ? Array.from(demand.orderRows.values()).sort(
                (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime(),
              )
            : [],
          variantDetail,
        };
      });

      mergedRows.sort((a, b) => {
        if (b.neededImportQuantity !== a.neededImportQuantity) {
          return b.neededImportQuantity - a.neededImportQuantity;
        }
        if (b.preOrderOrderCount !== a.preOrderOrderCount) {
          return b.preOrderOrderCount - a.preOrderOrderCount;
        }
        return a.variantId - b.variantId;
      });

      setRows(mergedRows);
    } catch (loadError) {
      setRows([]);
      setError(loadError?.message || "Không tải được danh sách pre-order variants.");
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    if (!isReady) {
      return;
    }

    void loadData();
  }, [isReady, loadData]);

  const filteredRows = useMemo(() => {
    const query = normalizeValue(searchQuery);
    if (!query) {
      return rows;
    }

    return rows.filter((row) => {
      const content = normalizeValue(
        `${row.productName} ${row.sku} ${row.variantId} ${row.color} ${row.size} ${row.frameType}`,
      );
      return content.includes(query);
    });
  }, [rows, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / PAGE_SIZE));
  const paginatedRows = useMemo(
    () => filteredRows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [filteredRows, page],
  );

  useEffect(() => {
    setPage(1);
  }, [searchQuery]);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  async function handleImportStock(row) {
    if (!accessToken) {
      await popupAlert("Không có access token.");
      return;
    }

    if (!Number.isFinite(row.variantId) || row.variantId <= 0) {
      await popupAlert("Không xác định được variant ID để nhập hàng.");
      return;
    }

    const formValues = await popupForm({
      title: "Nhập hàng cho variant",
      message: `SKU: ${row.sku}\nVariant ID: ${row.variantId}\nNhu cầu đề xuất: ${row.neededImportQuantity}`,
      okText: "Nhập hàng",
      fields: [
        {
          name: "quantityReceived",
          label: "Số lượng nhập",
          type: "number",
          min: 1,
          required: true,
          validate: (value) => {
            const parsed = Number(value);
            if (Number.isNaN(parsed) || parsed <= 0) {
              return "Số lượng nhập phải lớn hơn 0.";
            }
            return "";
          },
        },
        {
          name: "note",
          label: "Ghi chú",
          type: "text",
          placeholder: "Nhập theo nhu cầu pre-order",
        },
      ],
      initialValues: {
        quantityReceived: String(Math.max(1, row.neededImportQuantity)),
        note: row.preOrderNote || "",
      },
    });

    if (!formValues) {
      return;
    }

    setImportingVariantId(row.variantId);
    try {
      await createStockReceipt(
        {
          variantId: row.variantId,
          quantityReceived: Number(formValues.quantityReceived),
          note: formValues.note?.trim() || null,
        },
        accessToken,
      );
      await popupAlert("Nhập hàng thành công.");
      await loadData();
    } catch (actionError) {
      await popupAlert(actionError?.message || "Không thể nhập hàng cho variant này.");
    } finally {
      setImportingVariantId(null);
    }
  }

  return (
    <AdminPageShell
      title="Theo Dõi Pre-order Variants"
      actions={
        <button type="button" className={adminStyles.secondaryButton} onClick={() => void loadData()} disabled={loading}>
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Tải lại
        </button>
      }
    >
      <AdminErrorBanner message={error} />

      <AdminSection
        subtitle={`Tổng biến thể pre-order: ${filteredRows.length} | Cần nhập thêm: ${filteredRows.reduce(
          (sum, item) => sum + item.neededImportQuantity,
          0,
        )}`}
      >
        <label className="relative block">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Tìm theo tên sản phẩm, SKU, variant ID..."
            className={`${adminStyles.input} pl-12`}
          />
        </label>
      </AdminSection>

      <div className={adminStyles.tableWrapper}>
        <table className={adminStyles.table}>
          <thead className={adminStyles.tableHead}>
            <tr>
              <th className={adminStyles.th}>Sản phẩm / Variant</th>
              <th className={adminStyles.th}>Tồn kho</th>
              <th className={adminStyles.th}>Đơn đang đặt</th>
              <th className={adminStyles.th}>SL khách đặt</th>
              <th className={adminStyles.th}>Cần nhập</th>
              <th className={adminStyles.th}>Restock dự kiến</th>
              <th className={`${adminStyles.th} text-right`}>Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {loading ? (
              <tr>
                <td colSpan={7} className={adminStyles.emptyState}>
                  <Loader2 className="mx-auto h-8 w-8 animate-spin text-orange-500" />
                </td>
              </tr>
            ) : null}

            {!loading && paginatedRows.length === 0 ? (
              <tr>
                <td colSpan={7} className={adminStyles.emptyState}>
                  Không có biến thể pre-order nào.
                </td>
              </tr>
            ) : null}

            {paginatedRows.map((row) => (
              <tr key={`${row.variantId}-${row.sku}`} className="transition hover:bg-orange-50/40">
                <td className={adminStyles.td}>
                  <p className="font-bold text-[#11284b]">{row.productName}</p>
                  <p className="text-sm text-slate-500">SKU: {row.sku}</p>
                  <p className="text-sm text-slate-500">Variant ID: {row.variantId}</p>
                  <p className="text-xs text-slate-500">{buildVariantLabel(row)}</p>
                </td>
                <td className={adminStyles.td}>
                  <span className="inline-flex rounded-full border border-slate-300 bg-slate-50 px-3 py-1 text-xs font-bold text-slate-700">
                    {row.currentStock}
                  </span>
                </td>
                <td className={adminStyles.td}>
                  <span className="inline-flex rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700">
                    {row.preOrderOrderCount} đơn
                  </span>
                </td>
                <td className={`${adminStyles.td} font-semibold text-[#11284b]`}>{row.preOrderQuantity}</td>
                <td className={adminStyles.td}>
                  <span
                    className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold ${
                      row.neededImportQuantity > 0
                        ? "border-red-200 bg-red-50 text-red-700"
                        : "border-emerald-200 bg-emerald-50 text-emerald-700"
                    }`}
                  >
                    {row.neededImportQuantity}
                  </span>
                </td>
                <td className={adminStyles.td}>{formatDate(row.expectedRestockDate)}</td>
                <td className={`${adminStyles.td} text-right`}>
                  <div className="flex flex-wrap justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => void handleImportStock(row)}
                      className="inline-flex items-center gap-1 rounded-[1rem] border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-700 transition hover:bg-emerald-100 disabled:opacity-50"
                      disabled={importingVariantId === row.variantId}
                    >
                      <PackagePlus className="h-4 w-4" />
                      {importingVariantId === row.variantId ? "Đang nhập..." : "Nhập hàng"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedOrdersRow(row)}
                      className="inline-flex items-center gap-1 rounded-[1rem] border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-bold text-amber-700 transition hover:bg-amber-100"
                    >
                      <Clock3 className="h-4 w-4" />
                      Đơn pre-order
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedVariantRow(row)}
                      className="inline-flex items-center gap-1 rounded-[1rem] border border-sky-200 bg-sky-50 px-3 py-2 text-xs font-bold text-sky-700 transition hover:bg-sky-100"
                    >
                      <Eye className="h-4 w-4" />
                      Chi tiết variant
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <AdminPagination
          page={page}
          totalPages={totalPages}
          onPageChange={setPage}
          summary={`Trang ${page} / ${totalPages} - hiển thị ${paginatedRows.length} / ${filteredRows.length} biến thể`}
        />
      </div>

      {selectedOrdersRow ? (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 p-4">
          <div className="max-h-[90vh] w-full max-w-5xl overflow-y-auto rounded-[1.6rem] border border-orange-200 bg-white shadow-2xl">
            <div className="sticky top-0 z-10 flex items-start justify-between border-b border-slate-200 bg-white px-6 py-4">
              <div>
                <h3 className="text-2xl font-bold text-[#11284b]">Đơn pre-order của variant</h3>
                <p className="mt-1 text-sm text-slate-500">
                  SKU: {selectedOrdersRow.sku} | Variant ID: {selectedOrdersRow.variantId}
                </p>
              </div>
              <button
                type="button"
                className={adminStyles.secondaryButton}
                onClick={() => setSelectedOrdersRow(null)}
              >
                <X className="h-4 w-4" />
                Đóng
              </button>
            </div>

            <div className="p-6">
              {(selectedOrdersRow.relatedOrders ?? []).length === 0 ? (
                <p className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500">
                  Chưa có đơn pre-order đang mở cho variant này.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className={adminStyles.table}>
                    <thead className={adminStyles.tableHead}>
                      <tr>
                        <th className={adminStyles.th}>Mã đơn</th>
                        <th className={adminStyles.th}>Khách hàng</th>
                        <th className={adminStyles.th}>Trạng thái</th>
                        <th className={adminStyles.th}>SL đặt</th>
                        <th className={adminStyles.th}>Tổng tiền</th>
                        <th className={adminStyles.th}>Thời gian</th>
                        <th className={`${adminStyles.th} text-right`}>Chi tiết</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {selectedOrdersRow.relatedOrders.map((order) => (
                        <tr key={order.orderId}>
                          <td className={`${adminStyles.td} font-semibold text-[#11284b]`}>#{order.orderId}</td>
                          <td className={adminStyles.td}>{order.customerName || "-"}</td>
                          <td className={adminStyles.td}>
                            <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold ${statusClass(order.orderStatus)}`}>
                              {order.orderStatus || "-"}
                            </span>
                          </td>
                          <td className={adminStyles.td}>{order.quantity}</td>
                          <td className={adminStyles.td}>{formatCurrency(order.totalAmount)}</td>
                          <td className={adminStyles.td}>{formatDateTime(order.createdAt)}</td>
                          <td className={`${adminStyles.td} text-right`}>
                            <button
                              type="button"
                              className={adminStyles.smallButton}
                              onClick={() => {
                                setSelectedOrdersRow(null);
                                navigate(`${orderBasePath}/${order.orderId}`);
                              }}
                            >
                              Xem đơn
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : null}

      {selectedVariantRow ? (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-3xl rounded-[1.6rem] border border-orange-200 bg-white p-6 shadow-2xl">
            <div className="mb-5 flex items-start justify-between gap-3">
              <div>
                <h3 className="text-2xl font-bold text-[#11284b]">Chi tiết product variant</h3>
                <p className="mt-1 text-sm text-slate-500">{selectedVariantRow.productName}</p>
              </div>
              <button
                type="button"
                className={adminStyles.secondaryButton}
                onClick={() => setSelectedVariantRow(null)}
              >
                <X className="h-4 w-4" />
                Đóng
              </button>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-xl border border-orange-100 bg-[#fffaf4] p-4">
                <p className="text-xs font-bold uppercase text-slate-500">Variant ID</p>
                <p className="mt-2 text-sm font-semibold text-[#11284b]">{selectedVariantRow.variantId}</p>
              </div>
              <div className="rounded-xl border border-orange-100 bg-[#fffaf4] p-4">
                <p className="text-xs font-bold uppercase text-slate-500">SKU</p>
                <p className="mt-2 text-sm font-semibold text-[#11284b]">{selectedVariantRow.sku}</p>
              </div>
              <div className="rounded-xl border border-orange-100 bg-[#fffaf4] p-4">
                <p className="text-xs font-bold uppercase text-slate-500">Màu</p>
                <p className="mt-2 text-sm text-slate-700">{selectedVariantRow.color || "-"}</p>
              </div>
              <div className="rounded-xl border border-orange-100 bg-[#fffaf4] p-4">
                <p className="text-xs font-bold uppercase text-slate-500">Size</p>
                <p className="mt-2 text-sm text-slate-700">{selectedVariantRow.size || "-"}</p>
              </div>
              <div className="rounded-xl border border-orange-100 bg-[#fffaf4] p-4">
                <p className="text-xs font-bold uppercase text-slate-500">Frame type</p>
                <p className="mt-2 text-sm text-slate-700">{selectedVariantRow.frameType || "-"}</p>
              </div>
              <div className="rounded-xl border border-orange-100 bg-[#fffaf4] p-4">
                <p className="text-xs font-bold uppercase text-slate-500">Giá</p>
                <p className="mt-2 text-sm font-semibold text-[#11284b]">{formatCurrency(selectedVariantRow.price)}</p>
              </div>
              <div className="rounded-xl border border-orange-100 bg-[#fffaf4] p-4">
                <p className="text-xs font-bold uppercase text-slate-500">Tồn kho hiện tại</p>
                <p className="mt-2 text-sm text-slate-700">{selectedVariantRow.currentStock}</p>
              </div>
              <div className="rounded-xl border border-orange-100 bg-[#fffaf4] p-4">
                <p className="text-xs font-bold uppercase text-slate-500">Restock dự kiến</p>
                <p className="mt-2 text-sm text-slate-700">{formatDate(selectedVariantRow.expectedRestockDate)}</p>
              </div>
            </div>

            <div className="mt-4 rounded-xl border border-orange-100 bg-[#fffaf4] p-4">
              <p className="text-xs font-bold uppercase text-slate-500">Ghi chú pre-order</p>
              <p className="mt-2 text-sm text-slate-700">{selectedVariantRow.preOrderNote || "-"}</p>
            </div>
          </div>
        </div>
      ) : null}

      {popupElement}
    </AdminPageShell>
  );
}
