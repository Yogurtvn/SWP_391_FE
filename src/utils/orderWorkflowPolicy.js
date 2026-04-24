function normalizeToken(value) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[\s_-]+/g, "");
}

function normalizeOrderType(value) {
  return normalizeToken(value);
}

function normalizeOrderStatus(value) {
  return normalizeToken(value);
}

function normalizePaymentMethod(value) {
  const normalized = normalizeToken(value);
  if (normalized === "vnpay") {
    return "payos";
  }
  return normalized;
}

function normalizePaymentStatus(value) {
  return normalizeToken(value);
}

function toApiOrderStatusToken(status) {
  const normalized = normalizeOrderStatus(status);
  if (normalized === "awaitingstock") {
    return "awaitingStock";
  }
  return normalized;
}

function toApiShippingStatusToken(status) {
  return normalizeToken(status);
}

function collectPayments(order) {
  const payments = [];

  if (order?.payment) {
    payments.push(order.payment);
  }

  if (Array.isArray(order?.payments)) {
    payments.push(...order.payments);
  }

  if (payments.length === 0 && (order?.paymentMethod || order?.paymentStatus)) {
    payments.push({
      paymentMethod: order?.paymentMethod,
      paymentStatus: order?.paymentStatus,
    });
  }

  return payments;
}

function collectPrescriptionItems(order) {
  return Array.isArray(order?.items)
    ? order.items
      .map((item) => item?.prescription)
      .filter(Boolean)
    : [];
}

function isOnlinePaymentMethod(paymentMethod) {
  return normalizePaymentMethod(paymentMethod) !== "cod";
}

function hasOnlinePayment(payments) {
  return payments.some((payment) => isOnlinePaymentMethod(payment?.paymentMethod));
}

function hasCompletedOnlinePayment(payments) {
  return payments.some(
    (payment) =>
      isOnlinePaymentMethod(payment?.paymentMethod)
      && normalizePaymentStatus(payment?.paymentStatus) === "completed",
  );
}

function canCancelByPaymentRule(payments) {
  if (payments.length === 0) {
    return true;
  }

  if (hasCompletedOnlinePayment(payments)) {
    return false;
  }

  const hasNotCompletedPayment = payments.some(
    (payment) => normalizePaymentStatus(payment?.paymentStatus) !== "completed",
  );
  const hasCodPending = payments.some(
    (payment) =>
      normalizePaymentMethod(payment?.paymentMethod) === "cod"
      && normalizePaymentStatus(payment?.paymentStatus) === "pending",
  );

  return hasNotCompletedPayment || hasCodPending;
}

function canMovePreOrderToAwaitingStock(payments) {
  if (!hasOnlinePayment(payments)) {
    return true;
  }

  return hasCompletedOnlinePayment(payments);
}

function areAllPrescriptionItemsApproved(order) {
  if (normalizeOrderType(order?.orderType) !== "prescription") {
    return true;
  }

  const prescriptions = collectPrescriptionItems(order);
  return prescriptions.length > 0
    && prescriptions.every((item) => normalizeToken(item?.prescriptionStatus) === "approved");
}

function isPrescriptionCustomerCancellationWindowOpen(order) {
  if (
    normalizeOrderType(order?.orderType) !== "prescription"
    || normalizeOrderStatus(order?.orderStatus) !== "pending"
  ) {
    return false;
  }

  const prescriptions = collectPrescriptionItems(order);
  return prescriptions.length > 0
    && prescriptions.every((item) => normalizeToken(item?.prescriptionStatus) === "submitted");
}

function canCustomerCancelByOrderStatus(order) {
  const orderType = normalizeOrderType(order?.orderType);
  const orderStatus = normalizeOrderStatus(order?.orderStatus);

  if (orderType === "ready") {
    return orderStatus === "pending";
  }

  if (orderType === "preorder") {
    return orderStatus === "pending" || orderStatus === "awaitingstock";
  }

  if (orderType === "prescription") {
    return orderStatus === "pending";
  }

  return false;
}

const ORDER_TRANSITIONS_BY_TYPE = {
  ready: {
    pending: ["processing", "cancelled"],
    processing: ["shipped", "cancelled"],
    shipped: ["completed", "cancelled"],
    completed: [],
    cancelled: [],
  },
  preorder: {
    pending: ["awaitingstock", "cancelled"],
    awaitingstock: ["cancelled"],
    processing: ["shipped", "cancelled"],
    shipped: ["completed"],
    completed: [],
    cancelled: [],
  },
  prescription: {
    pending: ["processing", "cancelled"],
    processing: ["shipped", "cancelled"],
    shipped: ["completed"],
    completed: [],
    cancelled: [],
  },
};

const SHIPPING_TRANSITIONS_BY_ORDER_STATUS = {
  processing: ["pending", "picking", "delivering", "delivered", "failed"],
  shipped: ["picking", "delivering", "delivered", "failed"],
};

export function getAllowedAdminOrderTransitions(order) {
  const orderType = normalizeOrderType(order?.orderType);
  const currentStatus = normalizeOrderStatus(order?.orderStatus);
  const baseTransitions = ORDER_TRANSITIONS_BY_TYPE[orderType]?.[currentStatus] ?? [];
  const payments = collectPayments(order);

  return baseTransitions
    .filter((nextStatus) => {
      if (nextStatus === "cancelled") {
        return canCancelByPaymentRule(payments);
      }

      if (orderType === "preorder" && currentStatus === "pending" && nextStatus === "awaitingstock") {
        return canMovePreOrderToAwaitingStock(payments);
      }

      if (orderType === "prescription" && currentStatus === "pending" && nextStatus === "processing") {
        return areAllPrescriptionItemsApproved(order);
      }

      return true;
    })
    .map(toApiOrderStatusToken);
}

export function getAllowedShippingStatuses(order) {
  const orderStatus = normalizeOrderStatus(order?.orderStatus);
  const statuses = SHIPPING_TRANSITIONS_BY_ORDER_STATUS[orderStatus] ?? [];
  return statuses.map(toApiShippingStatusToken);
}

export function canCustomerCancelOrder(order) {
  const payments = collectPayments(order);
  const orderType = normalizeOrderType(order?.orderType);

  if (!canCustomerCancelByOrderStatus(order)) {
    return false;
  }

  if (orderType === "prescription" && !isPrescriptionCustomerCancellationWindowOpen(order)) {
    return false;
  }

  return canCancelByPaymentRule(payments);
}

