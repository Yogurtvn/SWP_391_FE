import { useState, useMemo } from "react";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  X,
  Filter,
  Upload,
  Image as ImageIcon,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Palette
} from "lucide-react";
const CATEGORIES = ["K\xEDnh c\u1EADn", "K\xEDnh r\xE2m", "G\u1ECDng k\xEDnh", "K\xEDnh cao c\u1EA5p"];
const MATERIALS = ["Nh\u1EF1a", "Kim lo\u1EA1i", "Titanium", "Acetate", "TR90"];
const SHAPES = ["Ch\u1EEF nh\u1EADt", "Tr\xF2n", "Oval", "M\u1EAFt m\xE8o", "Aviator", "Vu\xF4ng"];
const COLORS = [
  { name: "\u0110en", code: "#000000" },
  { name: "N\xE2u", code: "#8B4513" },
  { name: "Xanh navy", code: "#001F3F" },
  { name: "X\xE1m", code: "#808080" },
  { name: "V\xE0ng gold", code: "#FFD700" },
  { name: "B\u1EA1c", code: "#C0C0C0" },
  { name: "\u0110\u1ECF", code: "#DC143C" },
  { name: "Xanh l\xE1", code: "#228B22" },
  { name: "H\u1ED3ng", code: "#FF69B4" },
  { name: "Be", code: "#D2B48C" }
];
const ITEMS_PER_PAGE = 10;
function ManagerInventoryPage() {
  const [products, setProducts] = useState([
    {
      id: "1",
      sku: "GK-001",
      name: "G\u1ECDng Ch\u1EEF Nh\u1EADt C\u1ED5 \u0110i\u1EC3n",
      description: "G\u1ECDng k\xEDnh ch\u1EEF nh\u1EADt thanh l\u1ECBch, ph\xF9 h\u1EE3p cho m\xF4i tr\u01B0\u1EDDng c\xF4ng s\u1EDF",
      category: "K\xEDnh c\u1EADn",
      price: 189e4,
      material: "Acetate",
      shape: "Ch\u1EEF nh\u1EADt",
      width: 140,
      height: 45,
      colors: [
        {
          colorName: "\u0110en",
          colorCode: "#000000",
          stock: 25,
          images: ["https://images.unsplash.com/photo-1626104853817-343b24b5613f?w=400"]
        },
        {
          colorName: "N\xE2u",
          colorCode: "#8B4513",
          stock: 20,
          images: ["https://images.unsplash.com/photo-1626104853817-343b24b5613f?w=400"]
        }
      ],
      createdAt: /* @__PURE__ */ new Date("2024-01-15"),
      updatedAt: /* @__PURE__ */ new Date("2024-01-15")
    },
    {
      id: "2",
      sku: "GK-002",
      name: "M\u1EAFt M\xE8o Hi\u1EC7n \u0110\u1EA1i",
      description: "Thi\u1EBFt k\u1EBF m\u1EAFt m\xE8o th\u1EDDi th\u01B0\u1EE3ng, t\xF4n l\xEAn n\xE9t \u0111\u1EB9p n\u1EEF t\xEDnh",
      category: "K\xEDnh c\u1EADn",
      price: 21e5,
      material: "Kim lo\u1EA1i",
      shape: "M\u1EAFt m\xE8o",
      width: 135,
      height: 42,
      colors: [
        {
          colorName: "V\xE0ng gold",
          colorCode: "#FFD700",
          stock: 15,
          images: ["https://images.unsplash.com/photo-1654274285614-37cad6007665?w=400"]
        }
      ],
      createdAt: /* @__PURE__ */ new Date("2024-01-20"),
      updatedAt: /* @__PURE__ */ new Date("2024-01-20")
    }
  ]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterMaterial, setFilterMaterial] = useState("all");
  const [filterShape, setFilterShape] = useState("all");
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const [formData, setFormData] = useState({
    sku: "",
    name: "",
    description: "",
    category: "",
    price: "",
    material: "",
    shape: "",
    width: "",
    height: ""
  });
  const [formColors, setFormColors] = useState([]);
  const [currentColorForm, setCurrentColorForm] = useState({
    colorName: "",
    colorCode: "#000000",
    stock: "",
    images: []
  });
  const getTotalStock = (product) => {
    return product.colors.reduce((sum, color) => sum + color.stock, 0);
  };
  const filteredAndSortedProducts = useMemo(() => {
    let result = [...products];
    if (searchQuery) {
      result = result.filter(
        (p) => p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.sku.toLowerCase().includes(searchQuery.toLowerCase()) || p.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    if (filterCategory !== "all") {
      result = result.filter((p) => p.category === filterCategory);
    }
    if (filterMaterial !== "all") {
      result = result.filter((p) => p.material === filterMaterial);
    }
    if (filterShape !== "all") {
      result = result.filter((p) => p.shape === filterShape);
    }
    result.sort((a, b) => {
      let compareA = a[sortBy];
      let compareB = b[sortBy];
      if (sortBy === "stock") {
        compareA = getTotalStock(a);
        compareB = getTotalStock(b);
      } else if (sortBy === "createdAt") {
        compareA = new Date(a.createdAt).getTime();
        compareB = new Date(b.createdAt).getTime();
      }
      if (sortOrder === "asc") {
        return compareA > compareB ? 1 : -1;
      } else {
        return compareA < compareB ? 1 : -1;
      }
    });
    return result;
  }, [products, searchQuery, filterCategory, filterMaterial, filterShape, sortBy, sortOrder]);
  const paginatedProducts = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredAndSortedProducts.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredAndSortedProducts, currentPage]);
  const totalPages = Math.ceil(filteredAndSortedProducts.length / ITEMS_PER_PAGE);
  const handleAddNew = () => {
    setEditingProduct(null);
    setFormData({
      sku: "",
      name: "",
      description: "",
      category: "",
      price: "",
      material: "",
      shape: "",
      width: "",
      height: ""
    });
    setFormColors([]);
    setCurrentColorForm({
      colorName: "",
      colorCode: "#000000",
      stock: "",
      images: []
    });
    setShowModal(true);
  };
  const handleEdit = (product) => {
    setEditingProduct(product);
    setFormData({
      sku: product.sku,
      name: product.name,
      description: product.description,
      category: product.category,
      price: product.price.toString(),
      material: product.material,
      shape: product.shape,
      width: product.width.toString(),
      height: product.height.toString()
    });
    setFormColors([...product.colors]);
    setCurrentColorForm({
      colorName: "",
      colorCode: "#000000",
      stock: "",
      images: []
    });
    setShowModal(true);
  };
  const handleDelete = (id) => {
    if (confirm("B\u1EA1n c\xF3 ch\u1EAFc mu\u1ED1n x\xF3a s\u1EA3n ph\u1EA9m n\xE0y?")) {
      setProducts(products.filter((p) => p.id !== id));
    }
  };
  const handleImageUpload = (e) => {
    const files = e.target.files;
    if (!files) return;
    const filePromises = Array.from(files).map((file) => {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          resolve(reader.result);
        };
        reader.readAsDataURL(file);
      });
    });
    Promise.all(filePromises).then((results) => {
      setCurrentColorForm((prev) => ({
        ...prev,
        images: [...prev.images, ...results]
      }));
    });
  };
  const removeImage = (index) => {
    setCurrentColorForm((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };
  const addColorVariant = () => {
    if (!currentColorForm.colorName || !currentColorForm.stock || currentColorForm.images.length === 0) {
      alert("Vui l\xF2ng \u0111i\u1EC1n \u0111\u1EA7y \u0111\u1EE7 th\xF4ng tin m\xE0u s\u1EAFc");
      return;
    }
    setFormColors([
      ...formColors,
      {
        colorName: currentColorForm.colorName,
        colorCode: currentColorForm.colorCode,
        stock: parseInt(currentColorForm.stock),
        images: currentColorForm.images
      }
    ]);
    setCurrentColorForm({
      colorName: "",
      colorCode: "#000000",
      stock: "",
      images: []
    });
  };
  const removeColorVariant = (index) => {
    setFormColors(formColors.filter((_, i) => i !== index));
  };
  const handleSubmit = (e) => {
    e.preventDefault();
    if (formColors.length === 0) {
      alert("Vui l\xF2ng th\xEAm \xEDt nh\u1EA5t 1 m\xE0u s\u1EAFc");
      return;
    }
    const productData = {
      id: editingProduct?.id || Date.now().toString(),
      sku: formData.sku,
      name: formData.name,
      description: formData.description,
      category: formData.category,
      price: parseFloat(formData.price),
      material: formData.material,
      shape: formData.shape,
      width: parseFloat(formData.width),
      height: parseFloat(formData.height),
      colors: formColors,
      createdAt: editingProduct?.createdAt || /* @__PURE__ */ new Date(),
      updatedAt: /* @__PURE__ */ new Date()
    };
    if (editingProduct) {
      setProducts(products.map((p) => p.id === editingProduct.id ? productData : p));
    } else {
      setProducts([productData, ...products]);
    }
    setShowModal(false);
  };
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND"
    }).format(amount);
  };
  const resetFilters = () => {
    setFilterCategory("all");
    setFilterMaterial("all");
    setFilterShape("all");
    setSortBy("createdAt");
    setSortOrder("desc");
    setCurrentPage(1);
  };
  const activeFilterCount = [filterCategory, filterMaterial, filterShape].filter(
    (f) => f !== "all"
  ).length;
  return <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {
    /* Header */
  }
        <div className="bg-white rounded-2xl border-2 border-gray-300 shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl mb-2 font-bold text-gray-900">Quản Lý Sản Phẩm</h1>
              <p className="text-gray-600">
                Tổng số: <span className="font-bold text-primary">{filteredAndSortedProducts.length}</span> sản phẩm
              </p>
            </div>
            <button
    onClick={handleAddNew}
    className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-xl hover:bg-primary/90 transition-all shadow-lg shadow-primary/30 font-medium border-2 border-primary"
  >
              <Plus className="w-5 h-5" />
              Thêm Sản Phẩm
            </button>
          </div>
        </div>

        {
    /* Search & Filters */
  }
        <div className="bg-white rounded-2xl border-2 border-gray-300 shadow-sm p-6 mb-6">
          {
    /* Search Bar */
  }
          <div className="relative mb-4">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
    type="text"
    placeholder="Tìm kiếm theo tên, SKU, mô tả..."
    value={searchQuery}
    onChange={(e) => setSearchQuery(e.target.value)}
    className="w-full pl-12 pr-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
  />
          </div>

          {
    /* Filter Toggle */
  }
          <div className="flex items-center justify-between">
            <button
    onClick={() => setShowFilters(!showFilters)}
    className="flex items-center gap-2 px-4 py-2 border-2 border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
  >
              <Filter className="w-4 h-4" />
              Bộ Lọc
              {activeFilterCount > 0 && <span className="px-2 py-0.5 bg-primary text-white rounded-full text-xs font-bold">
                  {activeFilterCount}
                </span>}
              <ChevronDown
    className={`w-4 h-4 transition-transform ${showFilters ? "rotate-180" : ""}`}
  />
            </button>

            {activeFilterCount > 0 && <button
    onClick={resetFilters}
    className="text-sm text-primary hover:underline font-medium"
  >
                Xóa bộ lọc
              </button>}
          </div>

          {
    /* Filters Panel */
  }
          {showFilters && <div className="grid md:grid-cols-4 gap-4 mt-4 pt-4 border-t-2 border-gray-200">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Danh mục</label>
                <select
    value={filterCategory}
    onChange={(e) => setFilterCategory(e.target.value)}
    className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-primary"
  >
                  <option value="all">Tất cả</option>
                  {CATEGORIES.map((cat) => <option key={cat} value={cat}>
                      {cat}
                    </option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Chất liệu</label>
                <select
    value={filterMaterial}
    onChange={(e) => setFilterMaterial(e.target.value)}
    className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-primary"
  >
                  <option value="all">Tất cả</option>
                  {MATERIALS.map((mat) => <option key={mat} value={mat}>
                      {mat}
                    </option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Hình dạng</label>
                <select
    value={filterShape}
    onChange={(e) => setFilterShape(e.target.value)}
    className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-primary"
  >
                  <option value="all">Tất cả</option>
                  {SHAPES.map((shape) => <option key={shape} value={shape}>
                      {shape}
                    </option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Sắp xếp</label>
                <select
    value={`${sortBy}-${sortOrder}`}
    onChange={(e) => {
      const [by, order] = e.target.value.split("-");
      setSortBy(by);
      setSortOrder(order);
    }}
    className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-primary"
  >
                  <option value="createdAt-desc">Mới nhất</option>
                  <option value="createdAt-asc">Cũ nhất</option>
                  <option value="name-asc">Tên A-Z</option>
                  <option value="name-desc">Tên Z-A</option>
                  <option value="price-asc">Giá tăng dần</option>
                  <option value="price-desc">Giá giảm dần</option>
                  <option value="stock-asc">Tồn kho thấp</option>
                  <option value="stock-desc">Tồn kho cao</option>
                </select>
              </div>
            </div>}
        </div>

        {
    /* Products Table */
  }
        <div className="bg-white rounded-2xl border-2 border-gray-300 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-100 border-b-2 border-gray-300">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-bold text-gray-900">Sản phẩm</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-gray-900">SKU</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-gray-900">Danh mục</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-gray-900">Chất liệu</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-gray-900">Giá</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-gray-900">Màu sắc</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-gray-900">Tồn kho</th>
                  <th className="px-6 py-4 text-right text-sm font-bold text-gray-900">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y-2 divide-gray-200">
                {paginatedProducts.length === 0 ? <tr>
                    <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                      Không tìm thấy sản phẩm nào
                    </td>
                  </tr> : paginatedProducts.map((product) => <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <img
    src={product.colors[0]?.images[0] || ""}
    alt={product.name}
    className="w-16 h-16 object-cover rounded-lg border-2 border-gray-200"
  />
                          <div>
                            <p className="font-bold text-gray-900">{product.name}</p>
                            <p className="text-xs text-gray-500 mt-1">{product.shape}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-600">
                        {product.sku}
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-bold border-2 border-blue-200">
                          {product.category}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-700">
                        {product.material}
                      </td>
                      <td className="px-6 py-4 text-sm font-bold text-primary">
                        {formatCurrency(product.price)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-1">
                          {product.colors.slice(0, 3).map((color, idx) => <div
    key={idx}
    className="w-6 h-6 rounded-full border-2 border-gray-300"
    style={{ backgroundColor: color.colorCode }}
    title={color.colorName}
  />)}
                          {product.colors.length > 3 && <div className="w-6 h-6 rounded-full bg-gray-200 border-2 border-gray-300 flex items-center justify-center text-xs font-bold">
                              +{product.colors.length - 3}
                            </div>}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span
    className={`px-3 py-1 rounded-full text-xs font-bold border-2 ${getTotalStock(product) < 20 ? "bg-red-100 text-red-800 border-red-300" : "bg-green-100 text-green-800 border-green-300"}`}
  >
                          {getTotalStock(product)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
    onClick={() => handleEdit(product)}
    className="p-2 hover:bg-gray-100 rounded-lg transition-colors border-2 border-transparent hover:border-primary"
  >
                            <Edit className="w-5 h-5 text-primary" />
                          </button>
                          <button
    onClick={() => handleDelete(product.id)}
    className="p-2 hover:bg-gray-100 rounded-lg transition-colors border-2 border-transparent hover:border-red-500"
  >
                            <Trash2 className="w-5 h-5 text-red-600" />
                          </button>
                        </div>
                      </td>
                    </tr>)}
              </tbody>
            </table>
          </div>

          {
    /* Pagination */
  }
          {totalPages > 1 && <div className="border-t-2 border-gray-300 px-6 py-4 bg-gray-50">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-600">
                  Hiển thị{" "}
                  <span className="font-bold">
                    {(currentPage - 1) * ITEMS_PER_PAGE + 1}
                  </span>{" "}
                  -{" "}
                  <span className="font-bold">
                    {Math.min(currentPage * ITEMS_PER_PAGE, filteredAndSortedProducts.length)}
                  </span>{" "}
                  trong tổng số{" "}
                  <span className="font-bold">{filteredAndSortedProducts.length}</span>
                </p>

                <div className="flex items-center gap-2">
                  <button
    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
    disabled={currentPage === 1}
    className="p-2 border-2 border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>

                  <div className="flex items-center gap-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
    if (page === 1 || page === totalPages || page >= currentPage - 1 && page <= currentPage + 1) {
      return <button
        key={page}
        onClick={() => setCurrentPage(page)}
        className={`px-3 py-1 rounded-lg font-medium border-2 transition-colors ${currentPage === page ? "bg-primary text-white border-primary" : "border-gray-300 hover:bg-gray-100"}`}
      >
                            {page}
                          </button>;
    } else if (page === currentPage - 2 || page === currentPage + 2) {
      return <span key={page}>...</span>;
    }
    return null;
  })}
                  </div>

                  <button
    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
    disabled={currentPage === totalPages}
    className="p-2 border-2 border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>}
        </div>

        {
    /* Add/Edit Modal */
  }
        {showModal && <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto border-2 border-gray-300 shadow-2xl">
              <div className="sticky top-0 bg-white flex items-center justify-between p-6 border-b-2 border-gray-300 z-10">
                <h2 className="text-2xl font-bold text-gray-900">
                  {editingProduct ? "Ch\u1EC9nh S\u1EEDa S\u1EA3n Ph\u1EA9m" : "Th\xEAm S\u1EA3n Ph\u1EA9m M\u1EDBi"}
                </h2>
                <button
    onClick={() => setShowModal(false)}
    className="p-2 hover:bg-gray-100 rounded-lg transition-colors border-2 border-transparent hover:border-gray-300"
  >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6">
                {
    /* Basic Info */
  }
                <div className="mb-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                      <ImageIcon className="w-4 h-4 text-primary" />
                    </div>
                    Thông Tin Cơ Bản
                  </h3>
                  <div className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">
                          Tên sản phẩm <span className="text-red-500">*</span>
                        </label>
                        <input
    type="text"
    required
    value={formData.name}
    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
    placeholder="VD: Gọng kính chữ nhật cổ điển"
    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
  />
                      </div>

                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">
                          SKU <span className="text-red-500">*</span>
                        </label>
                        <input
    type="text"
    required
    value={formData.sku}
    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
    placeholder="VD: GK-001"
    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
  />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">
                        Mô tả <span className="text-red-500">*</span>
                      </label>
                      <textarea
    required
    value={formData.description}
    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
    placeholder="Mô tả chi tiết về sản phẩm..."
    rows={3}
    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
  />
                    </div>

                    <div className="grid md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">
                          Danh mục <span className="text-red-500">*</span>
                        </label>
                        <select
    required
    value={formData.category}
    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:border-primary"
  >
                          <option value="">Chọn danh mục</option>
                          {CATEGORIES.map((cat) => <option key={cat} value={cat}>
                              {cat}
                            </option>)}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">
                          Chất liệu <span className="text-red-500">*</span>
                        </label>
                        <select
    required
    value={formData.material}
    onChange={(e) => setFormData({ ...formData, material: e.target.value })}
    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:border-primary"
  >
                          <option value="">Chọn chất liệu</option>
                          {MATERIALS.map((mat) => <option key={mat} value={mat}>
                              {mat}
                            </option>)}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">
                          Hình dạng <span className="text-red-500">*</span>
                        </label>
                        <select
    required
    value={formData.shape}
    onChange={(e) => setFormData({ ...formData, shape: e.target.value })}
    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:border-primary"
  >
                          <option value="">Chọn hình dạng</option>
                          {SHAPES.map((shape) => <option key={shape} value={shape}>
                              {shape}
                            </option>)}
                        </select>
                      </div>
                    </div>

                    <div className="grid md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">
                          Giá (VNĐ) <span className="text-red-500">*</span>
                        </label>
                        <input
    type="number"
    required
    value={formData.price}
    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
    placeholder="1890000"
    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
  />
                      </div>

                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">
                          Chiều rộng (mm) <span className="text-red-500">*</span>
                        </label>
                        <input
    type="number"
    required
    value={formData.width}
    onChange={(e) => setFormData({ ...formData, width: e.target.value })}
    placeholder="140"
    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
  />
                      </div>

                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">
                          Chiều cao (mm) <span className="text-red-500">*</span>
                        </label>
                        <input
    type="number"
    required
    value={formData.height}
    onChange={(e) => setFormData({ ...formData, height: e.target.value })}
    placeholder="45"
    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
  />
                      </div>
                    </div>
                  </div>
                </div>

                {
    /* Color Variants */
  }
                <div className="border-t-2 border-gray-200 pt-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                      <Palette className="w-4 h-4 text-primary" />
                    </div>
                    Màu Sắc & Tồn Kho
                  </h3>

                  {
    /* Added Colors */
  }
                  {formColors.length > 0 && <div className="mb-4 space-y-2">
                      {formColors.map((color, idx) => <div
    key={idx}
    className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border-2 border-gray-200"
  >
                          <div
    className="w-10 h-10 rounded-lg border-2 border-gray-300"
    style={{ backgroundColor: color.colorCode }}
  />
                          <div className="flex-1">
                            <p className="font-bold text-gray-900">{color.colorName}</p>
                            <p className="text-sm text-gray-600">
                              Tồn kho: {color.stock} | Hình ảnh: {color.images.length}
                            </p>
                          </div>
                          <button
    type="button"
    onClick={() => removeColorVariant(idx)}
    className="p-2 hover:bg-white rounded-lg transition-colors border-2 border-transparent hover:border-red-300"
  >
                            <X className="w-4 h-4 text-red-600" />
                          </button>
                        </div>)}
                    </div>}

                  {
    /* Add Color Form */
  }
                  <div className="bg-blue-50 rounded-xl p-4 border-2 border-blue-200">
                    <div className="grid md:grid-cols-3 gap-4 mb-4">
                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Màu sắc</label>
                        <select
    value={currentColorForm.colorName}
    onChange={(e) => {
      const selectedColor = COLORS.find((c) => c.name === e.target.value);
      setCurrentColorForm({
        ...currentColorForm,
        colorName: e.target.value,
        colorCode: selectedColor?.code || "#000000"
      });
    }}
    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:border-primary"
  >
                          <option value="">Chọn màu</option>
                          {COLORS.map((color) => <option key={color.name} value={color.name}>
                              {color.name}
                            </option>)}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">
                          Mã màu
                        </label>
                        <input
    type="color"
    value={currentColorForm.colorCode}
    onChange={(e) => setCurrentColorForm({ ...currentColorForm, colorCode: e.target.value })}
    className="w-full h-12 border-2 border-gray-300 rounded-xl cursor-pointer"
  />
                      </div>

                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">
                          Tồn kho
                        </label>
                        <input
    type="number"
    value={currentColorForm.stock}
    onChange={(e) => setCurrentColorForm({ ...currentColorForm, stock: e.target.value })}
    placeholder="0"
    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
  />
                      </div>
                    </div>

                    {
    /* Image Upload */
  }
                    <div className="mb-4">
                      <label className="block text-sm font-bold text-gray-700 mb-2">
                        Hình ảnh
                      </label>
                      <label className="flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-gray-400 rounded-xl hover:bg-white cursor-pointer transition-colors">
                        <Upload className="w-5 h-5 text-gray-600" />
                        <span className="font-medium text-gray-700">Tải lên hình ảnh</span>
                        <input
    type="file"
    accept="image/*"
    multiple
    onChange={handleImageUpload}
    className="hidden"
  />
                      </label>

                      {
    /* Preview Images */
  }
                      {currentColorForm.images.length > 0 && <div className="grid grid-cols-4 gap-2 mt-3">
                          {currentColorForm.images.map((img, idx) => <div key={idx} className="relative group">
                              <img
    src={img}
    alt={`Preview ${idx}`}
    className="w-full h-20 object-cover rounded-lg border-2 border-gray-300"
  />
                              <button
    type="button"
    onClick={() => removeImage(idx)}
    className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
  >
                                <X className="w-3 h-3" />
                              </button>
                            </div>)}
                        </div>}
                    </div>

                    <button
    type="button"
    onClick={addColorVariant}
    className="w-full px-4 py-3 bg-primary text-white rounded-xl hover:bg-primary/90 transition-colors font-bold border-2 border-primary"
  >
                      + Thêm màu này
                    </button>
                  </div>
                </div>

                {
    /* Submit Buttons */
  }
                <div className="flex items-center gap-3 mt-6 pt-6 border-t-2 border-gray-200">
                  <button
    type="submit"
    className="flex-1 py-3 bg-primary text-white rounded-xl hover:bg-primary/90 transition-colors font-bold text-lg border-2 border-primary"
  >
                    {editingProduct ? "C\u1EADp Nh\u1EADt" : "Th\xEAm S\u1EA3n Ph\u1EA9m"}
                  </button>
                  <button
    type="button"
    onClick={() => setShowModal(false)}
    className="flex-1 py-3 border-2 border-gray-300 rounded-xl hover:bg-gray-50 transition-colors font-bold text-lg"
  >
                    Hủy
                  </button>
                </div>
              </form>
            </div>
          </div>}
      </div>
    </div>;
}
export {
  ManagerInventoryPage as default
};
