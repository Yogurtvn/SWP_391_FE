import { CartItem } from './product';

export type OrderStatus = 
  | 'pending'       // Chờ xác nhận
  | 'confirmed'     // Đã xác nhận
  | 'processing'    // Đang xử lý (gia công tròng nếu có)
  | 'ready'         // Sẵn sàng giao
  | 'shipping'      // Đang giao
  | 'delivered'     // Đã giao
  | 'cancelled';    // Đã hủy

export type PaymentMethod = 
  | 'cod'           // Thanh toán khi nhận hàng
  | 'bank-transfer' // Chuyển khoản
  | 'credit-card'   // Thẻ tín dụng
  | 'momo'          // Ví MoMo
  | 'zalopay';      // ZaloPay

export type PaymentStatus = 
  | 'pending'       // Chờ thanh toán
  | 'paid'          // Đã thanh toán
  | 'failed';       // Thanh toán thất bại

export interface ShippingAddress {
  fullName: string;
  phone: string;
  email: string;
  address: string;
  ward: string;     // Phường/Xã
  district: string; // Quận/Huyện
  city: string;     // Tỉnh/Thành phố
  notes?: string;   // Ghi chú giao hàng
}

export interface DeliveryInfo {
  estimatedDate: string;  // ISO date string
  estimatedHours: number; // Số giờ ước tính từ lúc xác nhận
  actualDeliveryDate?: string; // Ngày giao thực tế
  trackingNumber?: string;     // Mã vận đơn
  courier?: string;            // Đơn vị vận chuyển
}

export interface Order {
  id: string;
  orderNumber: string;  // Mã đơn hàng (VD: ORD-20260415-001)
  
  // Khách hàng
  userId: string;
  customerEmail: string;
  
  // Sản phẩm
  items: CartItem[];
  
  // Giá
  subtotal: number;     // Tổng tiền hàng
  shippingFee: number;  // Phí vận chuyển
  discount: number;     // Giảm giá
  total: number;        // Tổng thanh toán
  
  // Trạng thái
  status: OrderStatus;
  
  // Thanh toán
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  
  // Giao hàng
  shippingAddress: ShippingAddress;
  deliveryInfo: DeliveryInfo;
  
  // Thời gian
  createdAt: string;    // Thời điểm đặt hàng
  confirmedAt?: string; // Thời điểm xác nhận
  deliveredAt?: string; // Thời điểm giao hàng
  
  // Ghi chú
  customerNotes?: string;
  internalNotes?: string; // Ghi chú nội bộ (chỉ manager/admin thấy)
  
  // Có prescription order không
  hasPrescription: boolean;
  hasPreOrder: boolean;
}

// Cấu hình thời gian giao hàng
export interface DeliveryTimeConfig {
  regular: number;      // Giờ - Đơn hàng thường (mặc định 4)
  preOrder: number;     // Giờ - Pre-order (mặc định 48)
  prescription: number; // Giờ - Prescription order (mặc định 72)
}
