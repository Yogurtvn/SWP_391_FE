import { Plus } from "lucide-react";
import { useState } from "react";

const filterCategories = [
  "Thương hiệu",
  "Kích thước",
  "Hình dạng",
  "Màu sắc",
  "Chất liệu",
  "Viền",
  "Giá",
  "Độ vừa",
  "Tính năng thêm",
  "Theo đơn kính",
];

export default function FilterSidebar() {
  const [openSections, setOpenSections] = useState<string[]>([]);

  const toggleSection = (title: string) => {
    setOpenSections((prev) =>
      prev.includes(title) ? prev.filter((t) => t !== title) : [...prev, title]
    );
  };

  return (
    <aside className="w-56 shrink-0">
      <div className="mb-6">
        <h3 className="text-sm" style={{ fontWeight: 600 }}>Bộ lọc (0)</h3>
      </div>
      <div className="border-t border-border">
        {filterCategories.map((category) => (
          <button
            key={category}
            onClick={() => toggleSection(category)}
            className="flex items-center justify-between w-full py-4 text-left border-b border-border hover:bg-secondary/30 transition-colors"
          >
            <span className="text-sm text-foreground">{category}</span>
            <Plus className="w-4 h-4 text-foreground" />
          </button>
        ))}
      </div>
    </aside>
  );
}
