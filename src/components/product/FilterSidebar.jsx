import { Checkbox } from "@/components/common/ui/checkbox";

const FRAME_SHAPE_OPTIONS = [
  { label: "Aviator", value: "aviator" },
  { label: "Round", value: "round" },
  { label: "Rectangular", value: "rectangular" },
  { label: "Cat-Eye", value: "cat-eye" },
  { label: "Wayfarer", value: "wayfarer" },
  { label: "Rimless", value: "rimless" },
];

const COLOR_OPTIONS = [
  { label: "Đen", value: "đen", swatch: "#111111" },
  { label: "Xám", value: "xám", swatch: "#707784" },
  { label: "Trắng", value: "trắng", swatch: "#F6F7FA" },
  { label: "Vàng", value: "vàng", swatch: "#F6D046" },
  { label: "Nâu", value: "nâu", swatch: "#7A5B2E" },
  { label: "Bạc", value: "bạc", swatch: "#D8DBE2" },
  { label: "Xanh navy", value: "xanh navy", swatch: "#1E3A8A" },
  { label: "Xanh dương", value: "xanh dương", swatch: "#2563EB" },
];

const SIZE_OPTIONS = ["48", "50", "52", "54", "56", "Oversize"];

const PRICE_RANGE_OPTIONS = [
  { label: "Dưới 500.000đ", min: 0, max: 500000 },
  { label: "500.000đ - 1.500.000đ", min: 500000, max: 1500000 },
  { label: "1.500.000đ - 3.000.000đ", min: 1500000, max: 3000000 },
  { label: "Trên 3.000.000đ", min: 3000000, max: null },
];

function FilterSidebar({
  filters,
  categories,
  categoriesLoading,
  prescriptionFilterLocked,
  onCategoryChange,
  onColorChange,
  onSizeChange,
  onFrameTypeChange,
  onMinPriceChange,
  onMaxPriceChange,
  onPrescriptionChange,
  onResetFilters,
}) {
  const selectedFrameType = normalizeToken(filters.frameType);
  const selectedColor = normalizeToken(filters.color);
  const selectedSize = normalizeToken(filters.size);
  const hasCategoryOptions = Array.isArray(categories) && categories.length > 0;

  function handleToggleFrameType(value) {
    const normalizedValue = normalizeToken(value);
    onFrameTypeChange(selectedFrameType === normalizedValue ? "" : value);
  }

  function handleToggleColor(value) {
    const normalizedValue = normalizeToken(value);
    onColorChange(selectedColor === normalizedValue ? "" : value);
  }

  function handleToggleSize(value) {
    const normalizedValue = normalizeToken(value);
    onSizeChange(selectedSize === normalizedValue ? "" : value);
  }

  function handlePriceRangeSelect(option) {
    onMinPriceChange(option.min ?? "");
    onMaxPriceChange(option.max ?? "");
  }

  return (
    <aside className="w-72 shrink-0 self-start rounded-2xl border border-border bg-white p-5 text-foreground">
      <div className="mb-6">
        <h3 className="text-sm uppercase tracking-wide text-muted-foreground">Bộ lọc</h3>
        <button
          type="button"
          onClick={onResetFilters}
          className="mt-2 text-sm text-primary transition-colors hover:text-primary/80"
        >
          Xóa bộ lọc
        </button>
      </div>

      <div className="space-y-6">
        {hasCategoryOptions ? (
          <section>
            <h4 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Danh mục</h4>
            <select
              value={filters.categoryId ?? ""}
              onChange={(event) => onCategoryChange(event.target.value)}
              className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm text-foreground outline-none transition-colors focus:border-primary"
            >
              <option value="">Tất cả danh mục</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
            {categoriesLoading ? <p className="mt-2 text-xs text-muted-foreground">Đang tải danh mục...</p> : null}
          </section>
        ) : null}

        <section>
          <h4 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Kiểu gọng</h4>
          <div className="space-y-2">
            {FRAME_SHAPE_OPTIONS.map((option) => (
              <label key={option.value} className="flex cursor-pointer items-center gap-3">
                <Checkbox
                  className="border-slate-300 bg-white data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                  checked={isSelectedValue(selectedFrameType, option.value)}
                  onCheckedChange={() => handleToggleFrameType(option.value)}
                />
                <span className="text-sm text-foreground">{option.label}</span>
              </label>
            ))}
          </div>
        </section>

        <section>
          <h4 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Màu gọng</h4>
          <div className="grid grid-cols-4 gap-3">
            {COLOR_OPTIONS.map((option) => {
              const selected = isSelectedValue(selectedColor, option.value);

              return (
                <button
                  key={option.value}
                  type="button"
                  title={option.label}
                  onClick={() => handleToggleColor(option.value)}
                  className={`h-7 w-7 rounded-full border transition ${
                    selected
                      ? "border-primary ring-2 ring-primary/40"
                      : "border-slate-300 hover:border-slate-500"
                  }`}
                  style={{ backgroundColor: option.swatch }}
                />
              );
            })}
          </div>
          <input
            type="text"
            value={filters.color ?? ""}
            onChange={(event) => onColorChange(event.target.value)}
            placeholder="Ví dụ: Đen"
            className="mt-3 w-full rounded-lg border border-border bg-white px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground outline-none transition-colors focus:border-primary"
          />
        </section>

        <section>
          <h4 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Kích thước</h4>
          <div className="grid grid-cols-2 gap-y-2">
            {SIZE_OPTIONS.map((sizeOption) => (
              <label key={sizeOption} className="flex cursor-pointer items-center gap-3">
                <Checkbox
                  className="border-slate-300 bg-white data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                  checked={isSelectedValue(selectedSize, sizeOption)}
                  onCheckedChange={() => handleToggleSize(sizeOption)}
                />
                <span className="text-sm text-foreground">{sizeOption}</span>
              </label>
            ))}
          </div>
          <input
            type="text"
            value={filters.size ?? ""}
            onChange={(event) => onSizeChange(event.target.value)}
            placeholder="Ví dụ: 52"
            className="mt-3 w-full rounded-lg border border-border bg-white px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground outline-none transition-colors focus:border-primary"
          />
        </section>

        <section>
          <h4 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Khoảng giá</h4>
          <div className="space-y-2">
            {PRICE_RANGE_OPTIONS.map((option) => {
              const isActive =
                Number(filters.minPrice ?? 0) === Number(option.min ?? 0) &&
                (option.max === null
                  ? filters.maxPrice == null
                  : Number(filters.maxPrice ?? 0) === Number(option.max));

              return (
                <button
                  key={option.label}
                  type="button"
                  onClick={() => handlePriceRangeSelect(option)}
                  className={`w-full rounded-lg border px-3 py-2 text-left text-sm transition ${
                    isActive
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border text-foreground hover:bg-secondary/50"
                  }`}
                >
                  {option.label}
                </button>
              );
            })}
          </div>

          <div className="mt-3 grid grid-cols-2 gap-3">
            <input
              type="number"
              min="0"
              value={filters.minPrice ?? ""}
              onChange={(event) => onMinPriceChange(event.target.value)}
              placeholder="Từ"
              className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground outline-none transition-colors focus:border-primary"
            />
            <input
              type="number"
              min="0"
              value={filters.maxPrice ?? ""}
              onChange={(event) => onMaxPriceChange(event.target.value)}
              placeholder="Đến"
              className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground outline-none transition-colors focus:border-primary"
            />
          </div>
        </section>

        <section>
          <h4 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Hỗ trợ theo toa
          </h4>
          <label className="flex cursor-pointer items-start gap-3">
            <Checkbox
              className="mt-0.5 border-slate-300 bg-white data-[state=checked]:bg-primary data-[state=checked]:border-primary"
              checked={Boolean(filters.prescriptionCompatible)}
              disabled={prescriptionFilterLocked}
              onCheckedChange={(checked) => onPrescriptionChange(Boolean(checked))}
            />
            <span className="text-sm text-foreground">Chỉ hiển thị sản phẩm hỗ trợ đo kính</span>
          </label>
          {prescriptionFilterLocked ? (
            <p className="mt-2 text-xs text-muted-foreground">Danh mục hiện tại đã tự khóa bộ lọc này.</p>
          ) : null}
        </section>
      </div>
    </aside>
  );
}

function normalizeToken(value) {
  return String(value ?? "")
    .trim()
    .toLowerCase();
}

function isSelectedValue(value, targetValue) {
  const normalizedTarget = normalizeToken(targetValue);
  return normalizeToken(value) === normalizedTarget;
}

export { FilterSidebar as default };
