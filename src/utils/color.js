const HEX_COLOR_REGEX = /^#([a-fA-F0-9]{3}|[a-fA-F0-9]{6})$/;

const COLOR_HEX_BY_KEY = {
  den: "#111827",
  black: "#111827",
  blackmatte: "#111827",
  denbong: "#111827",

  trang: "#f3f4f6",
  white: "#f3f4f6",

  transparent: "#e5e7eb",
  clear: "#e5e7eb",
  trong: "#e5e7eb",
  trongsuot: "#e5e7eb",
  khongmau: "#e5e7eb",

  xam: "#6b7280",
  gray: "#6b7280",
  grey: "#6b7280",
  xamsuong: "#4b5563",
  xamchi: "#5b6472",
  khoi: "#8b95a5",
  khoinhat: "#cbd2dc",

  bac: "#c0c0c0",
  silver: "#c0c0c0",

  vang: "#facc15",
  vanggold: "#facc15",
  gold: "#facc15",
  yellow: "#facc15",

  nau: "#8b5a2b",
  naukhoi: "#7a6754",
  brown: "#8b5a2b",
  nauptortoise: "#8b5a2b",
  tortoise: "#8b5a2b",

  do: "#dc2626",
  red: "#dc2626",
  doburgundy: "#800020",
  burgundy: "#800020",
  maroon: "#800020",

  xanhlam: "#2563eb",
  xanhduong: "#2563eb",
  xanhbien: "#0ea5e9",
  blue: "#2563eb",
  xanh: "#2563eb",
  cyan: "#0891b2",

  xanhnavy: "#1e3a8a",
  navy: "#1e3a8a",

  xanhla: "#16a34a",
  green: "#16a34a",
  olive: "#4d7c0f",

  hong: "#ec4899",
  pink: "#ec4899",
  rose: "#e11d48",

  be: "#d2b48c",
  beige: "#d2b48c",
  nude: "#e8c4b8",

  doimau: "#8b5cf6",
  photochromic: "#8b5cf6",
  champagne: "#f7e7ce",
  tim: "#7c3aed",
  purple: "#7c3aed",
  violet: "#7c3aed",

  cam: "#ea580c",
  orange: "#ea580c",
};

function normalizeColorKey(value) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/\u0111/g, "d")
    .replace(/\u0110/g, "d")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "d")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "");
}

export function resolveColorHex(value) {
  const rawValue = String(value ?? "").trim();

  if (!rawValue) {
    return null;
  }

  if (HEX_COLOR_REGEX.test(rawValue)) {
    return rawValue;
  }

  const normalized = normalizeColorKey(rawValue);

  if (!normalized) {
    return null;
  }

  if (COLOR_HEX_BY_KEY[normalized]) {
    return COLOR_HEX_BY_KEY[normalized];
  }

  if (normalized.includes("nau") && normalized.includes("khoi")) {
    return COLOR_HEX_BY_KEY.naukhoi;
  }

  if (normalized.includes("den") || normalized.includes("black")) return COLOR_HEX_BY_KEY.black;

  if (
    normalized.includes("trong") ||
    normalized.includes("clear") ||
    normalized.includes("transparent") ||
    normalized.includes("khongmau")
  ) {
    return COLOR_HEX_BY_KEY.clear;
  }

  if (normalized.includes("trang") || normalized.includes("white")) return COLOR_HEX_BY_KEY.white;

  if (normalized.includes("khoinhat") || normalized.includes("lightsmoke")) return COLOR_HEX_BY_KEY.khoinhat;
  if (normalized.includes("xamchi") || normalized.includes("charcoal")) return COLOR_HEX_BY_KEY.xamchi;
  if (normalized.includes("khoi") || normalized.includes("smoke")) return COLOR_HEX_BY_KEY.khoi;

  if (normalized.includes("xam") || normalized.includes("gray") || normalized.includes("grey")) {
    return COLOR_HEX_BY_KEY.gray;
  }

  if (normalized.includes("bac") || normalized.includes("silver")) return COLOR_HEX_BY_KEY.silver;

  if (normalized.includes("vang") || normalized.includes("gold") || normalized.includes("champagne")) {
    return COLOR_HEX_BY_KEY.gold;
  }

  if (normalized.includes("nau") || normalized.includes("brown") || normalized.includes("tortoise")) {
    return COLOR_HEX_BY_KEY.brown;
  }

  if (
    normalized.includes("do") ||
    normalized.includes("red") ||
    normalized.includes("burgundy") ||
    normalized.includes("maroon")
  ) {
    return COLOR_HEX_BY_KEY.red;
  }

  if (normalized.includes("xanhnavy") || normalized.includes("navy")) return COLOR_HEX_BY_KEY.navy;

  if (
    normalized.includes("xanhbien") ||
    normalized.includes("oceanblue") ||
    normalized.includes("seablue")
  ) {
    return COLOR_HEX_BY_KEY.xanhbien;
  }

  if (
    normalized.includes("xanhduong") ||
    normalized.includes("xanhlam") ||
    normalized.includes("blue") ||
    normalized.includes("cyan")
  ) {
    return COLOR_HEX_BY_KEY.blue;
  }

  if (normalized.includes("xanhla") || normalized.includes("green") || normalized.includes("olive")) {
    return COLOR_HEX_BY_KEY.green;
  }

  if (normalized.includes("hong") || normalized.includes("pink") || normalized.includes("rose")) {
    return COLOR_HEX_BY_KEY.pink;
  }

  if (normalized.includes("be") || normalized.includes("beige") || normalized.includes("nude")) {
    return COLOR_HEX_BY_KEY.beige;
  }

  if (
    normalized.includes("tim") ||
    normalized.includes("purple") ||
    normalized.includes("violet") ||
    normalized.includes("doimau") ||
    normalized.includes("photochromic")
  ) {
    return COLOR_HEX_BY_KEY.purple;
  }

  if (normalized.includes("cam") || normalized.includes("orange")) return COLOR_HEX_BY_KEY.orange;

  return "#9ca3af";
}
