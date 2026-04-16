import { useState } from "react";
import { useNavigate } from "react-router";
import { useCart } from "@/store/cart/CartContext";
import {
  CreditCard,
  Lock,
  Truck,
  Wallet,
  MapPin,
  Phone,
  Mail,
  User,
  Building,
  CheckCircle,
  AlertCircle,
} from "lucide-react";

export default function CheckoutPage() {
  const navigate = useNavigate();
  const { items, getTotal, clearCart } = useCart();
  const [isProcessing, setIsProcessing] = useState(false);

  const [shippingInfo, setShippingInfo] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    district: "",
    ward: "",
  });

  const [paymentMethod, setPaymentMethod] = useState<"online" | "cod">("cod");
  const [cardInfo, setCardInfo] = useState({
    cardNumber: "",
    cardName: "",
    expiryDate: "",
    cvv: "",
  });

  const subtotal = getTotal();
  const shippingFee = subtotal > 500000 ? 0 : 30000;
  const total = subtotal + shippingFee;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);

    // Simulate order processing
    setTimeout(() => {
      clearCart();
      navigate("/orders/ORD-12345");
    }, 2000);
  };

  const isFormValid = () => {
    const isShippingValid =
      shippingInfo.firstName &&
      shippingInfo.lastName &&
      shippingInfo.email &&
      shippingInfo.phone &&
      shippingInfo.address &&
      shippingInfo.city;

    if (paymentMethod === "online") {
      const isCardValid =
        cardInfo.cardNumber &&
        cardInfo.cardName &&
        cardInfo.expiryDate &&
        cardInfo.cvv;
      return isShippingValid && isCardValid;
    }

    return isShippingValid;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  if (items.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center py-16">
          <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl mb-2">Giỏ hàng trống</h2>
          <p className="text-gray-600 mb-6">
            Bạn chưa có sản phẩm nào trong giỏ hàng
          </p>
          <button
            onClick={() => navigate("/shop")}
            className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
          >
            Tiếp tục mua sắm
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl mb-2">Thanh Toán</h1>
          <p className="text-gray-600">
            Hoàn tất đơn hàng của bạn trong vài bước đơn giản
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Left Column - Forms */}
            <div className="lg:col-span-2 space-y-6">
              {/* Shipping Information */}
              <div className="bg-white rounded-2xl border-2 border-gray-200 p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                    <MapPin className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-xl">Thông Tin Giao Hàng</h2>
                    <p className="text-sm text-gray-600">
                      Nhập địa chỉ nhận hàng của bạn
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  {/* Name Fields */}
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block mb-2 text-sm font-medium text-gray-700">
                        <User className="w-4 h-4 inline mr-1" />
                        Họ <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={shippingInfo.firstName}
                        onChange={(e) =>
                          setShippingInfo({
                            ...shippingInfo,
                            firstName: e.target.value,
                          })
                        }
                        placeholder="Nhập họ của bạn"
                        className="w-full px-4 py-3 bg-white border-2 border-gray-300 rounded-xl focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                      />
                    </div>
                    <div>
                      <label className="block mb-2 text-sm font-medium text-gray-700">
                        Tên <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={shippingInfo.lastName}
                        onChange={(e) =>
                          setShippingInfo({
                            ...shippingInfo,
                            lastName: e.target.value,
                          })
                        }
                        placeholder="Nhập tên của bạn"
                        className="w-full px-4 py-3 bg-white border-2 border-gray-300 rounded-xl focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                      />
                    </div>
                  </div>

                  {/* Contact Fields */}
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block mb-2 text-sm font-medium text-gray-700">
                        <Mail className="w-4 h-4 inline mr-1" />
                        Email <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="email"
                        required
                        value={shippingInfo.email}
                        onChange={(e) =>
                          setShippingInfo({
                            ...shippingInfo,
                            email: e.target.value,
                          })
                        }
                        placeholder="example@email.com"
                        className="w-full px-4 py-3 bg-white border-2 border-gray-300 rounded-xl focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                      />
                    </div>
                    <div>
                      <label className="block mb-2 text-sm font-medium text-gray-700">
                        <Phone className="w-4 h-4 inline mr-1" />
                        Số điện thoại <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="tel"
                        required
                        value={shippingInfo.phone}
                        onChange={(e) =>
                          setShippingInfo({
                            ...shippingInfo,
                            phone: e.target.value,
                          })
                        }
                        placeholder="0123 456 789"
                        className="w-full px-4 py-3 bg-white border-2 border-gray-300 rounded-xl focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                      />
                    </div>
                  </div>

                  {/* Address Field */}
                  <div>
                    <label className="block mb-2 text-sm font-medium text-gray-700">
                      <Building className="w-4 h-4 inline mr-1" />
                      Địa chỉ <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={shippingInfo.address}
                      onChange={(e) =>
                        setShippingInfo({
                          ...shippingInfo,
                          address: e.target.value,
                        })
                      }
                      placeholder="Số nhà, tên đường"
                      className="w-full px-4 py-3 bg-white border-2 border-gray-300 rounded-xl focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                    />
                  </div>

                  {/* Location Fields */}
                  <div className="grid md:grid-cols-3 gap-4">
                    <div>
                      <label className="block mb-2 text-sm font-medium text-gray-700">
                        Phường/Xã
                      </label>
                      <input
                        type="text"
                        value={shippingInfo.ward}
                        onChange={(e) =>
                          setShippingInfo({
                            ...shippingInfo,
                            ward: e.target.value,
                          })
                        }
                        placeholder="Phường 1"
                        className="w-full px-4 py-3 bg-white border-2 border-gray-300 rounded-xl focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                      />
                    </div>
                    <div>
                      <label className="block mb-2 text-sm font-medium text-gray-700">
                        Quận/Huyện
                      </label>
                      <input
                        type="text"
                        value={shippingInfo.district}
                        onChange={(e) =>
                          setShippingInfo({
                            ...shippingInfo,
                            district: e.target.value,
                          })
                        }
                        placeholder="Quận 1"
                        className="w-full px-4 py-3 bg-white border-2 border-gray-300 rounded-xl focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                      />
                    </div>
                    <div>
                      <label className="block mb-2 text-sm font-medium text-gray-700">
                        Tỉnh/Thành phố <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={shippingInfo.city}
                        onChange={(e) =>
                          setShippingInfo({
                            ...shippingInfo,
                            city: e.target.value,
                          })
                        }
                        placeholder="TP. Hồ Chí Minh"
                        className="w-full px-4 py-3 bg-white border-2 border-gray-300 rounded-xl focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Payment Method */}
              <div className="bg-white rounded-2xl border-2 border-gray-200 p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                    <Wallet className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-xl">Phương Thức Thanh Toán</h2>
                    <p className="text-sm text-gray-600">
                      Chọn cách thanh toán phù hợp
                    </p>
                  </div>
                </div>

                {/* Payment Options */}
                <div className="space-y-3 mb-6">
                  {/* COD Option */}
                  <label
                    className={`flex items-center gap-4 p-4 border-2 rounded-xl cursor-pointer transition-all ${
                      paymentMethod === "cod"
                        ? "border-primary bg-primary/5"
                        : "border-gray-300 hover:border-gray-400"
                    }`}
                  >
                    <input
                      type="radio"
                      name="payment"
                      value="cod"
                      checked={paymentMethod === "cod"}
                      onChange={(e) =>
                        setPaymentMethod(e.target.value as "cod" | "online")
                      }
                      className="w-5 h-5 text-primary"
                    />
                    <Truck className="w-6 h-6 text-gray-600" />
                    <div className="flex-1">
                      <p className="font-medium">Thanh toán khi nhận hàng</p>
                      <p className="text-sm text-gray-600">
                        Thanh toán bằng tiền mặt khi nhận hàng
                      </p>
                    </div>
                    {paymentMethod === "cod" && (
                      <CheckCircle className="w-6 h-6 text-primary" />
                    )}
                  </label>

                  {/* Online Payment Option */}
                  <label
                    className={`flex items-center gap-4 p-4 border-2 rounded-xl cursor-pointer transition-all ${
                      paymentMethod === "online"
                        ? "border-primary bg-primary/5"
                        : "border-gray-300 hover:border-gray-400"
                    }`}
                  >
                    <input
                      type="radio"
                      name="payment"
                      value="online"
                      checked={paymentMethod === "online"}
                      onChange={(e) =>
                        setPaymentMethod(e.target.value as "cod" | "online")
                      }
                      className="w-5 h-5 text-primary"
                    />
                    <CreditCard className="w-6 h-6 text-gray-600" />
                    <div className="flex-1">
                      <p className="font-medium">Thanh toán bằng MOMO</p>
                      <p className="text-sm text-gray-600">
                        Ví điện tử MOMO - Nhanh chóng & Tiện lợi
                      </p>
                    </div>
                    {paymentMethod === "online" && (
                      <CheckCircle className="w-6 h-6 text-primary" />
                    )}
                  </label>
                </div>

                {/* Card Details (if online selected) */}
                {paymentMethod === "online" && (
                  <div className="pt-6 border-t-2 border-gray-200">
                    <div className="flex items-center gap-2 mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <Lock className="w-4 h-4 text-blue-600" />
                      <span className="text-sm text-blue-900">
                        Thông tin thanh toán được mã hóa và bảo mật
                      </span>
                    </div>

                    <div className="space-y-4">
                      {/* Card Number */}
                      <div>
                        <label className="block mb-2 text-sm font-medium text-gray-700">
                          Số thẻ <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            required={paymentMethod === "online"}
                            value={cardInfo.cardNumber}
                            onChange={(e) =>
                              setCardInfo({
                                ...cardInfo,
                                cardNumber: e.target.value,
                              })
                            }
                            placeholder="1234 5678 9012 3456"
                            maxLength={19}
                            className="w-full px-4 py-3 pr-12 bg-white border-2 border-gray-300 rounded-xl focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                          />
                          <CreditCard className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        </div>
                      </div>

                      {/* Card Name */}
                      <div>
                        <label className="block mb-2 text-sm font-medium text-gray-700">
                          Tên chủ thẻ <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          required={paymentMethod === "online"}
                          value={cardInfo.cardName}
                          onChange={(e) =>
                            setCardInfo({
                              ...cardInfo,
                              cardName: e.target.value,
                            })
                          }
                          placeholder="NGUYEN VAN A"
                          className="w-full px-4 py-3 bg-white border-2 border-gray-300 rounded-xl focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all uppercase"
                        />
                      </div>

                      {/* Expiry & CVV */}
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block mb-2 text-sm font-medium text-gray-700">
                            Ngày hết hạn <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            required={paymentMethod === "online"}
                            value={cardInfo.expiryDate}
                            onChange={(e) =>
                              setCardInfo({
                                ...cardInfo,
                                expiryDate: e.target.value,
                              })
                            }
                            placeholder="MM / YY"
                            maxLength={7}
                            className="w-full px-4 py-3 bg-white border-2 border-gray-300 rounded-xl focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                          />
                        </div>
                        <div>
                          <label className="block mb-2 text-sm font-medium text-gray-700">
                            CVV <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            required={paymentMethod === "online"}
                            value={cardInfo.cvv}
                            onChange={(e) =>
                              setCardInfo({ ...cardInfo, cvv: e.target.value })
                            }
                            placeholder="123"
                            maxLength={4}
                            className="w-full px-4 py-3 bg-white border-2 border-gray-300 rounded-xl focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right Column - Order Summary */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-2xl border-2 border-gray-200 p-6 shadow-sm sticky top-24">
                <h2 className="text-xl mb-6">Tóm Tắt Đơn Hàng</h2>

                {/* Cart Items */}
                <div className="space-y-4 mb-6 max-h-64 overflow-y-auto">
                  {items.map((item) => (
                    <div key={item.id} className="flex gap-3">
                      <img
                        src={
                          item.product.image ||
                          "https://images.unsplash.com/photo-1626104853817-343b24b5613f?w=80"
                        }
                        alt={item.product.name}
                        className="w-16 h-16 object-cover rounded-lg border-2 border-gray-200"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate mb-1">
                          {item.product.name}
                        </p>
                        <p className="text-xs text-gray-600 mb-1">
                          Số lượng: {item.quantity}
                        </p>
                        <p className="text-sm font-medium text-primary">
                          {formatCurrency(item.totalPrice)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="border-t-2 border-gray-200 pt-4 space-y-3">
                  {/* Subtotal */}
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Tạm tính:</span>
                    <span className="font-medium">
                      {formatCurrency(subtotal)}
                    </span>
                  </div>

                  {/* Shipping */}
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Phí vận chuyển:</span>
                    <span className="font-medium">
                      {shippingFee === 0 ? (
                        <span className="text-green-600">Miễn phí</span>
                      ) : (
                        formatCurrency(shippingFee)
                      )}
                    </span>
                  </div>

                  {/* Free shipping notice */}
                  {shippingFee > 0 && (
                    <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
                      <p className="text-xs text-amber-800">
                        💡 Mua thêm{" "}
                        <span className="font-bold">
                          {formatCurrency(500000 - subtotal)}
                        </span>{" "}
                        để được miễn phí vận chuyển!
                      </p>
                    </div>
                  )}

                  {/* Total */}
                  <div className="pt-3 border-t-2 border-gray-200">
                    <div className="flex justify-between items-center">
                      <span className="text-base font-medium">Tổng cộng:</span>
                      <span className="text-2xl font-bold text-primary">
                        {formatCurrency(total)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={!isFormValid() || isProcessing}
                  className="w-full mt-6 px-6 py-4 bg-primary text-white rounded-xl hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-medium text-lg shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30"
                >
                  {isProcessing ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg
                        className="animate-spin h-5 w-5"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                          fill="none"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                      Đang xử lý...
                    </span>
                  ) : (
                    "Đặt Hàng Ngay"
                  )}
                </button>

                {/* Security Notice */}
                <div className="mt-4 flex items-center justify-center gap-2 text-xs text-gray-500">
                  <Lock className="w-3 h-3" />
                  <span>Thanh toán an toàn và bảo mật</span>
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}