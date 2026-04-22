import { Plus } from "lucide-react";
import { useState } from "react";
import { Checkbox } from "@/components/common/ui/checkbox";

const defaultOpenSections = ["category", "size", "color", "frameType", "price", "prescription"];

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
  const [openSections, setOpenSections] = useState(defaultOpenSections);

  const sections = [
    {
      id: "category",
      title: "Danh mục",
      content: (
        <div className="pt-3">
          <select
            value={filters.categoryId ?? ""}
            onChange={(event) => onCategoryChange(event.target.value)}
            className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm focus:outline-none focus:border-primary"
          >
            <option value="">Tất cả danh mục</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
          {categoriesLoading ? <p className="mt-2 text-xs text-muted-foreground">Đang tải danh mục...</p> : null}
        </div>
      ),
    },
    {
      id: "size",
      title: "Kích thước",
      content: (
        <div className="pt-3">
          <input
            type="text"
            value={filters.size}
            onChange={(event) => onSizeChange(event.target.value)}
            placeholder="VD: M, 52, Oversize"
            className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm focus:outline-none focus:border-primary"
          />
        </div>
      ),
    },
    {
      id: "color",
      title: "Màu sắc",
      content: (
        <div className="pt-3">
          <input
            type="text"
            value={filters.color}
            onChange={(event) => onColorChange(event.target.value)}
            placeholder="VD: Đen, Bạc, Vàng"
            className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm focus:outline-none focus:border-primary"
          />
        </div>
      ),
    },
    {
      id: "frameType",
      title: "Kiểu gọng",
      content: (
        <div className="pt-3">
          <input
            type="text"
            value={filters.frameType}
            onChange={(event) => onFrameTypeChange(event.target.value)}
            placeholder="VD: full, semi, rimless"
            className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm focus:outline-none focus:border-primary"
          />
        </div>
      ),
    },
    {
      id: "price",
      title: "Giá",
      content: (
        <div className="grid grid-cols-2 gap-3 pt-3">
          <input
            type="number"
            min="0"
            value={filters.minPrice ?? ""}
            onChange={(event) => onMinPriceChange(event.target.value)}
            placeholder="Từ"
            className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm focus:outline-none focus:border-primary"
          />
          <input
            type="number"
            min="0"
            value={filters.maxPrice ?? ""}
            onChange={(event) => onMaxPriceChange(event.target.value)}
            placeholder="Đến"
            className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm focus:outline-none focus:border-primary"
          />
        </div>
      ),
    },
    {
      id: "prescription",
      title: "Theo đơn kính",
      content: (
        <div className="flex items-center gap-3 pt-3">
          <Checkbox
            checked={Boolean(filters.prescriptionCompatible)}
            disabled={prescriptionFilterLocked}
            onCheckedChange={(checked) => onPrescriptionChange(Boolean(checked))}
          />
          <div>
            <p className="text-sm text-foreground">Chỉ hiện sản phẩm hỗ trợ đo kính</p>
            {prescriptionFilterLocked ? (
              <p className="text-xs text-muted-foreground">
                Danh mục hiện tại đang khóa sẵn bộ lọc này.
              </p>
            ) : null}
          </div>
        </div>
      ),
    },
  ];

  function toggleSection(sectionId) {
    setOpenSections((currentSections) =>
      currentSections.includes(sectionId)
        ? currentSections.filter((item) => item !== sectionId)
        : [...currentSections, sectionId],
    );
  }

  return (
    <aside className="w-56 shrink-0">
      <div className="mb-6">
        <h3 className="text-sm" style={{ fontWeight: 600 }}>
          Bộ lọc API
        </h3>
        <button type="button" onClick={onResetFilters} className="mt-2 text-xs text-primary hover:underline">
          Xóa bộ lọc
        </button>
      </div>
      <div className="border-t border-border">
        {sections.map((section) => (
          <div key={section.id} className="border-b border-border py-1">
            <button
              type="button"
              onClick={() => toggleSection(section.id)}
              className="flex items-center justify-between w-full py-4 text-left hover:bg-secondary/30 transition-colors"
            >
              <span className="text-sm text-foreground">{section.title}</span>
              <Plus
                className={`w-4 h-4 text-foreground transition-transform ${
                  openSections.includes(section.id) ? "rotate-45" : ""
                }`}
              />
            </button>
            {openSections.includes(section.id) ? section.content : null}
          </div>
        ))}
      </div>
    </aside>
  );
}

export { FilterSidebar as default };
