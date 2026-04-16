// Loại sản phẩm
export type ProductType = 
  | 'frame-only'        // Gọng riêng
  | 'lenses-only'       // Tròng riêng
  | 'complete-glasses'  // Kính hoàn chỉnh (gọng + tròng)
  | 'sunglasses';       // Kính râm/mát

export type ProductCategory = 
  | 'men' 
  | 'women' 
  | 'unisex';

export type FrameMaterial = 
  | 'acetate'    // Nhựa acetate
  | 'metal'      // Kim loại
  | 'titanium'   // Titan
  | 'tr90'       // TR90
  | 'wood'       // Gỗ
  | 'mixed';     // Hỗn hợp

export type LensType = 
  | 'single-vision'  // Đơn tròng
  | 'bifocal'        // Hai tròng
  | 'progressive';   // Đa tròng

export type LensMaterial = 
  | 'cr39'       // Nhựa CR-39
  | 'polycarbonate'  // Polycarbonate
  | 'high-index'     // High-index 1.67, 1.74
  | 'trivex'         // Trivex
  | 'glass';         // Thủy tinh

export type LensCoating = 
  | 'anti-reflective'  // Chống phản chiếu
  | 'scratch-resistant' // Chống trầy
  | 'uv-protection'    // Chống UV
  | 'blue-light'       // Chống ánh sáng xanh
  | 'photochromic'     // Đổi màu
  | 'polarized';       // Phân cực

// Thông số gọng
export interface FrameSpecs {
  material: FrameMaterial;
  frameWidth: number;      // mm
  lensWidth: number;       // mm
  lensHeight: number;      // mm
  bridgeWidth: number;     // mm
  templeLength: number;    // mm
  weight: number;          // grams
  colors: Array<{
    name: string;
    hex: string;
    image?: string;
  }>;
}

// Tròng kính đi kèm (cho complete-glasses)
export interface IncludedLenses {
  type: LensType;
  material: LensMaterial;
  coatings: LensCoating[];
  description: string;
}

// Sản phẩm
export interface Product {
  id: string;
  name: string;
  type: ProductType;
  category: ProductCategory;
  brand: string;
  price: number;
  images: string[];
  description: string;
  
  // Kho hàng
  inStock: boolean;
  quantity: number;
  allowPreOrder: boolean;  // Chỉ true cho complete-glasses và sunglasses
  
  // Thông số gọng (cho frame-only, complete-glasses, sunglasses)
  frameSpecs?: FrameSpecs;
  
  // Tròng đi kèm (cho complete-glasses)
  includedLenses?: IncludedLenses;
  
  // Có hỗ trợ đặt tròng theo đơn không (cho frame-only)
  prescriptionCompatible: boolean;
  
  // Rating
  rating: number;
  reviewCount: number;
  
  // Tags
  tags: string[];
  
  // Giá gốc (nếu đang giảm giá)
  originalPrice?: number;
  
  // Premium brand
  isPremium: boolean;
}

// Thông số đơn thuốc cho 1 mắt
export interface EyePrescription {
  sph: number;      // Sphere (độ cận/viễn)
  cyl?: number;     // Cylinder (độ loạn)
  axis?: number;    // Axis (trục loạn) 0-180
  add?: number;     // Addition (độ cộng cho lão)
}

// Thông số đơn thuốc đầy đủ
export interface PrescriptionDetails {
  rightEye: EyePrescription;
  leftEye: EyePrescription;
  pd: number;                    // Pupillary Distance (khoảng cách đồng tử)
  
  // Lựa chọn tròng
  lensType: LensType;
  lensMaterial: LensMaterial;
  coatings: LensCoating[];
  
  // Giá tròng
  lensBasePrice: number;         // Giá cơ bản
  coatingPrice: number;          // Giá coating
  totalLensPrice: number;        // Tổng giá tròng
}

// Item trong giỏ hàng
export type OrderType = 'regular' | 'pre-order' | 'prescription';

export interface CartItem {
  id: string;  // Unique ID cho cart item
  product: Product;
  quantity: number;
  orderType: OrderType;
  selectedColor?: string;  // Màu đã chọn
  
  // Nếu là prescription order
  prescriptionDetails?: PrescriptionDetails;
  
  // Tổng giá (bao gồm cả tròng nếu có)
  totalPrice: number;
}
