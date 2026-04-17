import { Plus } from "lucide-react";
import { useState } from "react";
const filterCategories = [
  "Th\u01B0\u01A1ng hi\u1EC7u",
  "K\xEDch th\u01B0\u1EDBc",
  "H\xECnh d\u1EA1ng",
  "M\xE0u s\u1EAFc",
  "Ch\u1EA5t li\u1EC7u",
  "Vi\u1EC1n",
  "Gi\xE1",
  "\u0110\u1ED9 v\u1EEBa",
  "T\xEDnh n\u0103ng th\xEAm",
  "Theo \u0111\u01A1n k\xEDnh"
];
function FilterSidebar() {
  const [openSections, setOpenSections] = useState([]);
  const toggleSection = (title) => {
    setOpenSections(
      (prev) => prev.includes(title) ? prev.filter((t) => t !== title) : [...prev, title]
    );
  };
  return <aside className="w-56 shrink-0">
      <div className="mb-6">
        <h3 className="text-sm" style={{ fontWeight: 600 }}>Bộ lọc (0)</h3>
      </div>
      <div className="border-t border-border">
        {filterCategories.map((category) => <button
    key={category}
    onClick={() => toggleSection(category)}
    className="flex items-center justify-between w-full py-4 text-left border-b border-border hover:bg-secondary/30 transition-colors"
  >
            <span className="text-sm text-foreground">{category}</span>
            <Plus className="w-4 h-4 text-foreground" />
          </button>)}
      </div>
    </aside>;
}
export {
  FilterSidebar as default
};
