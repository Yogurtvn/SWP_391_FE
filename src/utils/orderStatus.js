function normalizeStatusValue(value) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[\s_-]+/g, "");
}

const ORDER_STATUS_MAP = {
  pending: {
    label: "Chờ duyệt",
    className: "border-amber-300 bg-amber-100 text-amber-800",
  },
  confirmed: {
    label: "Đã xác nhận",
    className: "border-sky-300 bg-sky-100 text-sky-800",
  },
  awaitingstock: {
    label: "Chờ hàng",
    className: "border-orange-300 bg-orange-100 text-orange-800",
  },
  processing: {
    label: "Đang xử lý",
    className: "border-violet-300 bg-violet-100 text-violet-800",
  },
  shipped: {
    label: "Đang giao",
    className: "border-indigo-300 bg-indigo-100 text-indigo-800",
  },
  delivering: {
    label: "Đang giao",
    className: "border-indigo-300 bg-indigo-100 text-indigo-800",
  },
  completed: {
    label: "Hoàn thành",
    className: "border-emerald-300 bg-emerald-100 text-emerald-800",
  },
  delivered: {
    label: "Hoàn thành",
    className: "border-emerald-300 bg-emerald-100 text-emerald-800",
  },
  cancelled: {
    label: "Đã hủy",
    className: "border-rose-300 bg-rose-100 text-rose-800",
  },
  failed: {
    label: "Thất bại",
    className: "border-red-300 bg-red-100 text-red-800",
  },
};

const SHIPPING_STATUS_MAP = {
  pending: {
    label: "Chờ lấy hàng",
    className: "border-amber-300 bg-amber-100 text-amber-800",
  },
  picking: {
    label: "Đang lấy hàng",
    className: "border-sky-300 bg-sky-100 text-sky-800",
  },
  delivering: {
    label: "Đang giao",
    className: "border-indigo-300 bg-indigo-100 text-indigo-800",
  },
  delivered: {
    label: "Đã giao",
    className: "border-emerald-300 bg-emerald-100 text-emerald-800",
  },
  failed: {
    label: "Giao thất bại",
    className: "border-red-300 bg-red-100 text-red-800",
  },
};

const FALLBACK_STATUS = {
  label: "Đang cập nhật",
  className: "border-gray-300 bg-gray-100 text-gray-800",
};

export function getOrderStatusPresentation(status) {
  const normalized = normalizeStatusValue(status);

  if (!normalized) {
    return FALLBACK_STATUS;
  }

  return ORDER_STATUS_MAP[normalized] ?? {
    label: status,
    className: FALLBACK_STATUS.className,
  };
}

export function getShippingStatusPresentation(status) {
  const normalized = normalizeStatusValue(status);

  if (!normalized) {
    return FALLBACK_STATUS;
  }

  return SHIPPING_STATUS_MAP[normalized] ?? {
    label: status,
    className: FALLBACK_STATUS.className,
  };
}
