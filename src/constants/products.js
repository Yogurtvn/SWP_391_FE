const products = [
  // FRAME-ONLY - Gọng riêng
  {
    id: "f001",
    name: "G\u1ECDng Titan Ch\u1EEF Nh\u1EADt C\u1ED5 \u0110i\u1EC3n",
    type: "frame-only",
    category: "unisex",
    brand: "VisionDirect",
    price: 89e4,
    images: [
      "https://images.unsplash.com/photo-1716860836982-608d61f39be1?crop=center&fit=crop&w=800&h=600"
    ],
    description: "G\u1ECDng k\xEDnh titan si\xEAu nh\u1EB9 v\u1EDBi thi\u1EBFt k\u1EBF ch\u1EEF nh\u1EADt c\u1ED5 \u0111i\u1EC3n, ph\xF9 h\u1EE3p cho m\u1ECDi khu\xF4n m\u1EB7t.",
    inStock: true,
    quantity: 45,
    allowPreOrder: false,
    frameSpecs: {
      material: "titanium",
      frameWidth: 140,
      lensWidth: 52,
      lensHeight: 42,
      bridgeWidth: 18,
      templeLength: 145,
      weight: 18,
      colors: [
        { name: "\u0110en", hex: "#000000" },
        { name: "X\xE1m S\xFAng", hex: "#666666" },
        { name: "V\xE0ng H\u1ED3ng", hex: "#B76E79" }
      ]
    },
    prescriptionCompatible: true,
    rating: 4.8,
    reviewCount: 127,
    tags: ["titan", "nh\u1EB9", "sang tr\u1ECDng", "unisex"],
    isPremium: false
  },
  {
    id: "f002",
    name: "G\u1ECDng M\u1EAFt M\xE8o Acetate N\u1EEF",
    type: "frame-only",
    category: "women",
    brand: "VisionDirect",
    price: 69e4,
    originalPrice: 89e4,
    images: [
      "https://images.unsplash.com/photo-1764740113465-dc9e6b28cc9e?crop=center&fit=crop&w=800&h=600"
    ],
    description: "G\u1ECDng acetate cao c\u1EA5p v\u1EDBi thi\u1EBFt k\u1EBF m\u1EAFt m\xE8o quy\u1EBFn r\u0169, th\u1EC3 hi\u1EC7n phong c\xE1ch n\u1EEF t\xEDnh.",
    inStock: false,
    quantity: 0,
    allowPreOrder: false,
    frameSpecs: {
      material: "acetate",
      frameWidth: 136,
      lensWidth: 50,
      lensHeight: 44,
      bridgeWidth: 20,
      templeLength: 140,
      weight: 24,
      colors: [
        { name: "\u0110\u1ECF Burgundy", hex: "#800020" },
        { name: "\u0110en B\xF3ng", hex: "#000000" },
        { name: "H\u1ED3ng Nude", hex: "#E8C4B8" }
      ]
    },
    prescriptionCompatible: true,
    rating: 4.6,
    reviewCount: 89,
    tags: ["m\u1EAFt m\xE8o", "n\u1EEF t\xEDnh", "acetate", "th\u1EDDi trang"],
    isPremium: false
  },
  // COMPLETE-GLASSES - Kính hoàn chỉnh
  {
    id: "cg001",
    name: "K\xEDnh C\u1EADn G\u1ECDng Tr\xF2n Vintage",
    type: "complete-glasses",
    category: "unisex",
    brand: "VisionDirect",
    price: 129e4,
    images: [
      "https://images.unsplash.com/photo-1764737719221-1776b8077d79?crop=center&fit=crop&w=800&h=600"
    ],
    description: "K\xEDnh c\u1EADn ho\xE0n ch\u1EC9nh v\u1EDBi g\u1ECDng tr\xF2n vintage v\xE0 tr\xF2ng k\xEDnh ch\u1ED1ng \xE1nh s\xE1ng xanh.",
    inStock: true,
    quantity: 32,
    allowPreOrder: true,
    frameSpecs: {
      material: "metal",
      frameWidth: 134,
      lensWidth: 48,
      lensHeight: 48,
      bridgeWidth: 22,
      templeLength: 142,
      weight: 20,
      colors: [
        { name: "V\xE0ng Gold", hex: "#FFD700" },
        { name: "B\u1EA1c", hex: "#C0C0C0" },
        { name: "\u0110en Matte", hex: "#2C2C2C" }
      ]
    },
    includedLenses: {
      type: "single-vision",
      material: "cr39",
      coatings: ["anti-reflective", "blue-light", "scratch-resistant"],
      description: "Tr\xF2ng CR-39 ch\u1ED1ng \xE1nh s\xE1ng xanh, ch\u1ED1ng ph\u1EA3n chi\u1EBFu"
    },
    prescriptionCompatible: false,
    rating: 4.9,
    reviewCount: 234,
    tags: ["vintage", "tr\xF2n", "blue light", "ho\xE0n ch\u1EC9nh"],
    isPremium: false
  },
  {
    id: "cg002",
    name: "K\xEDnh \u0110\u1ECDc S\xE1ch G\u1ECDng Vu\xF4ng TR90",
    type: "complete-glasses",
    category: "unisex",
    brand: "VisionDirect",
    price: 99e4,
    images: [
      "https://images.unsplash.com/photo-1716860836982-608d61f39be1?crop=center&fit=crop&w=800&h=600"
    ],
    description: "K\xEDnh \u0111\u1ECDc s\xE1ch v\u1EDBi g\u1ECDng TR90 si\xEAu b\u1EC1n, tr\xF2ng ch\u1ED1ng m\u1ECFi m\u1EAFt.",
    inStock: true,
    quantity: 56,
    allowPreOrder: true,
    frameSpecs: {
      material: "tr90",
      frameWidth: 138,
      lensWidth: 51,
      lensHeight: 40,
      bridgeWidth: 19,
      templeLength: 143,
      weight: 16,
      colors: [
        { name: "\u0110en", hex: "#000000" },
        { name: "Xanh Navy", hex: "#003366" }
      ]
    },
    includedLenses: {
      type: "single-vision",
      material: "cr39",
      coatings: ["anti-reflective", "scratch-resistant"],
      description: "Tr\xF2ng CR-39 c\u01A1 b\u1EA3n ch\u1ED1ng ph\u1EA3n chi\u1EBFu"
    },
    prescriptionCompatible: false,
    rating: 4.7,
    reviewCount: 156,
    tags: ["\u0111\u1ECDc s\xE1ch", "TR90", "b\u1EC1n", "nh\u1EB9"],
    isPremium: false
  },
  // SUNGLASSES - Kính râm
  {
    id: "sg001",
    name: "K\xEDnh R\xE2m Phi C\xF4ng Classic",
    type: "sunglasses",
    category: "unisex",
    brand: "VisionDirect Premium",
    price: 159e4,
    images: [
      "https://images.unsplash.com/photo-1599243439680-1af420953c23?crop=center&fit=crop&w=800&h=600"
    ],
    description: "K\xEDnh r\xE2m phi c\xF4ng c\u1ED5 \u0111i\u1EC3n v\u1EDBi tr\xF2ng ph\xE2n c\u1EF1c ch\u1ED1ng UV400.",
    inStock: true,
    quantity: 28,
    allowPreOrder: true,
    frameSpecs: {
      material: "metal",
      frameWidth: 142,
      lensWidth: 58,
      lensHeight: 52,
      bridgeWidth: 14,
      templeLength: 145,
      weight: 28,
      colors: [
        { name: "V\xE0ng Gold", hex: "#FFD700" },
        { name: "\u0110en", hex: "#000000" },
        { name: "B\u1EA1c", hex: "#C0C0C0" }
      ]
    },
    includedLenses: {
      type: "single-vision",
      material: "polycarbonate",
      coatings: ["polarized", "uv-protection", "scratch-resistant"],
      description: "Tr\xF2ng ph\xE2n c\u1EF1c Polycarbonate ch\u1ED1ng UV400"
    },
    prescriptionCompatible: false,
    rating: 4.9,
    reviewCount: 312,
    tags: ["phi c\xF4ng", "ph\xE2n c\u1EF1c", "UV400", "c\u1ED5 \u0111i\u1EC3n"],
    isPremium: true
  },
  {
    id: "sg002",
    name: "K\xEDnh R\xE2m Vu\xF4ng Oversize N\u1EEF",
    type: "sunglasses",
    category: "women",
    brand: "VisionDirect",
    price: 119e4,
    images: [
      "https://images.unsplash.com/photo-1681147767903-9011e9bf9e83?w=600"
    ],
    description: "K\xEDnh r\xE2m vu\xF4ng oversize th\u1EDDi trang v\u1EDBi g\u1ECDng acetate cao c\u1EA5p.",
    inStock: false,
    quantity: 0,
    allowPreOrder: true,
    frameSpecs: {
      material: "acetate",
      frameWidth: 146,
      lensWidth: 56,
      lensHeight: 54,
      bridgeWidth: 18,
      templeLength: 145,
      weight: 32,
      colors: [
        { name: "\u0110en B\xF3ng", hex: "#000000" },
        { name: "N\xE2u Tortoise", hex: "#8B4513" },
        { name: "Xanh D\u01B0\u01A1ng", hex: "#1E3A8A" }
      ]
    },
    includedLenses: {
      type: "single-vision",
      material: "cr39",
      coatings: ["polarized", "uv-protection"],
      description: "Tr\xF2ng ph\xE2n c\u1EF1c ch\u1ED1ng UV"
    },
    prescriptionCompatible: false,
    rating: 4.6,
    reviewCount: 98,
    tags: ["oversize", "vu\xF4ng", "n\u1EEF", "th\u1EDDi trang"],
    isPremium: false
  },
  // MORE PRODUCTS
  {
    id: "f003",
    name: "G\u1ECDng Kim Lo\u1EA1i M\u1EA3nh D\xE1ng Oval",
    type: "frame-only",
    category: "women",
    brand: "VisionDirect",
    price: 59e4,
    images: [
      "https://images.unsplash.com/photo-1749032712013-6f21d1be6a6c?w=600"
    ],
    description: "G\u1ECDng kim lo\u1EA1i m\u1EA3nh nh\u1EB9 nh\xE0ng v\u1EDBi d\xE1ng oval thanh l\u1ECBch.",
    inStock: true,
    quantity: 67,
    allowPreOrder: false,
    frameSpecs: {
      material: "metal",
      frameWidth: 132,
      lensWidth: 50,
      lensHeight: 38,
      bridgeWidth: 20,
      templeLength: 138,
      weight: 15,
      colors: [
        { name: "V\xE0ng H\u1ED3ng", hex: "#E6A8A8" },
        { name: "B\u1EA1c", hex: "#C0C0C0" }
      ]
    },
    prescriptionCompatible: true,
    rating: 4.5,
    reviewCount: 73,
    tags: ["oval", "m\u1EA3nh", "n\u1EEF t\xEDnh", "nh\u1EB9"],
    isPremium: false
  },
  {
    id: "cg003",
    name: "K\xEDnh \u0110a Tr\xF2ng Cao C\u1EA5p Progressive",
    type: "complete-glasses",
    category: "unisex",
    brand: "VisionDirect Premium",
    price: 249e4,
    images: [
      "https://images.unsplash.com/photo-1715418554358-d34e420b18ab?w=600"
    ],
    description: "K\xEDnh \u0111a tr\xF2ng progressive cao c\u1EA5p cho ng\u01B0\u1EDDi l\xE3o th\u1ECB, chuy\u1EC3n ti\u1EBFp m\u01B0\u1EE3t m\xE0.",
    inStock: true,
    quantity: 18,
    allowPreOrder: true,
    frameSpecs: {
      material: "titanium",
      frameWidth: 138,
      lensWidth: 52,
      lensHeight: 42,
      bridgeWidth: 18,
      templeLength: 145,
      weight: 19,
      colors: [
        { name: "\u0110en", hex: "#000000" },
        { name: "N\xE2u", hex: "#654321" }
      ]
    },
    includedLenses: {
      type: "progressive",
      material: "high-index",
      coatings: ["anti-reflective", "blue-light", "scratch-resistant", "uv-protection"],
      description: "Tr\xF2ng High-Index 1.67 \u0111a tr\xF2ng Progressive v\u1EDBi coating cao c\u1EA5p"
    },
    prescriptionCompatible: false,
    rating: 5,
    reviewCount: 45,
    tags: ["progressive", "l\xE3o th\u1ECB", "cao c\u1EA5p", "high-index"],
    isPremium: true
  }
];
const lensPricing = {
  basePrice: {
    "single-vision": 5e5,
    "bifocal": 8e5,
    "progressive": 12e5
  },
  materialUpcharge: {
    "cr39": 0,
    "polycarbonate": 2e5,
    "high-index": 4e5,
    "trivex": 3e5,
    "glass": 1e5
  },
  coatingPrice: {
    "anti-reflective": 15e4,
    "scratch-resistant": 1e5,
    "uv-protection": 8e4,
    "blue-light": 2e5,
    "photochromic": 4e5,
    "polarized": 35e4
  }
};
const deliveryTimeConfig = {
  regular: 4,
  // 4 giờ cho đơn thường
  preOrder: 48,
  // 2 ngày cho pre-order
  prescription: 72
  // 3 ngày cho prescription order
};
export {
  deliveryTimeConfig,
  lensPricing,
  products
};
