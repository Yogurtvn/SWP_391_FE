import { describe, expect, it } from "vitest";
import { normalizeServerCart } from "@/services/cartService";
import { buildOrderSummary, createCheckoutPayload } from "@/services/orderService";

describe("pre-order checkout flow helpers", () => {
  it("builds checkout payload with API orderType=preOrder", () => {
    const payload = createCheckoutPayload({
      cartItems: [
        { cartItemId: 21, quantity: 1 },
        { cartItemId: 22, quantity: 2 },
      ],
      orderType: "preorder",
      shippingInfo: {
        fullName: "Nguyen Van A",
        phone: "0901234567",
        address: "123 ABC Street",
        ward: "Ward 1",
        district: "District 1",
        city: "HCMC",
      },
      paymentMethod: "cod",
      shippingFee: 30000,
    });

    expect(payload).toEqual({
      cartItemIds: [21, 22],
      orderType: "preOrder",
      receiverName: "Nguyen Van A",
      receiverPhone: "0901234567",
      shippingAddress: "123 ABC Street, Ward 1, District 1, HCMC",
      shippingFee: 30000,
      paymentMethod: "cod",
    });
  });

  it("classifies insufficient stock preorder cart item for checkout", () => {
    const cart = normalizeServerCart({
      cartId: 1,
      items: [
        {
          cartItemId: 21,
          variantId: 101,
          productName: "Preorder frame",
          quantity: 2,
          stockQuantity: 1,
          isReadyAvailable: false,
          isPreOrderAllowed: true,
          expectedRestockDate: "2026-05-15T00:00:00",
          preOrderNote: "New stock soon",
          unitPrice: 390000,
          totalPrice: 780000,
        },
      ],
      subTotal: 780000,
    });

    expect(cart.items[0]).toMatchObject({
      orderType: "preOrder",
      availabilityStatus: "preorder",
      expectedRestockDate: "2026-05-15T00:00:00",
      preOrderNote: "New stock soon",
    });
  });

  it("keeps ready checkout when stock is enough even if preorder is enabled", () => {
    const cart = normalizeServerCart({
      cartId: 1,
      items: [
        {
          cartItemId: 31,
          variantId: 201,
          productName: "Ready frame",
          quantity: 1,
          stockQuantity: 4,
          isReadyAvailable: true,
          isPreOrderAllowed: true,
          unitPrice: 420000,
          totalPrice: 420000,
        },
      ],
      subTotal: 420000,
    });

    expect(cart.items[0]).toMatchObject({
      orderType: "ready",
      availabilityStatus: "available",
    });
  });

  it("summarizes backend AwaitingStock preorder response for success screen", () => {
    const summary = buildOrderSummary({
      checkoutResult: {
        orderId: 1005,
        orderType: "preOrder",
        orderStatus: "awaitingStock",
        totalAmount: 780000,
        payment: {
          paymentId: 3005,
          paymentStatus: "pending",
        },
      },
      cartItems: [{ quantity: 2, totalPrice: 780000 }],
      orderType: "preorder",
      shippingInfo: {
        fullName: "Nguyen Van A",
        phone: "0901234567",
        address: "123 ABC Street",
      },
      paymentMethod: "cod",
    });

    expect(summary).toMatchObject({
      orderId: 1005,
      orderType: "preOrder",
      orderStatus: "awaitingStock",
      orderStatusLabel: "Chờ bổ sung hàng",
      paymentStatus: "pending",
      total: 780000,
    });
  });
});
