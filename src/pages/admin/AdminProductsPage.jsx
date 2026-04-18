import { useCallback, useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router";
import { selectAuthState } from "@/store/auth/authSlice";
import { usePopupDialog } from "@/components/common/ui/usePopupDialog";
import {
  createCategory,
  createProduct,
  createProductVariant,
  getInventories,
  getCategories,
  getProducts,
  updateInventory,
  updateProductStatus,
} from "@/services/adminService";

const PRODUCT_TYPES = ["Frame", "Sunglasses", "Lens"];

function formatCurrency(value) {
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(Number(value || 0));
}

export default function AdminProductsPage() {
  const navigate = useNavigate();
  const { accessToken } = useSelector(selectAuthState);
  const { popupAlert, popupElement } = usePopupDialog();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    productName: "",
    categoryId: "",
    productType: PRODUCT_TYPES[0],
    basePrice: "",
    prescriptionCompatible: false,
    description: "",
  });
  const [newCategoryName, setNewCategoryName] = useState("");
  const [isVariantModalOpen, setIsVariantModalOpen] = useState(false);
  const [isCreatingVariant, setIsCreatingVariant] = useState(false);
  const [variantForm, setVariantForm] = useState({
    productId: null,
    productName: "",
    sku: "",
    price: "",
    quantity: "1",
    color: "",
    size: "",
    frameType: "",
  });

  const fetchProducts = useCallback(async () => {
    if (!accessToken) {
      setError("Không có access token.");
      setProducts([]);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const [productResult, categoryResult] = await Promise.all([
        getProducts({ page: 1, pageSize: 50, sortBy: "newest", sortOrder: "desc" }, accessToken),
        getCategories({ page: 1, pageSize: 100, sortBy: "categoryName", sortOrder: "asc" }, accessToken),
      ]);

      setProducts(productResult?.items ?? []);
      setCategories(categoryResult?.items ?? []);
    } catch (requestError) {
      setError(requestError?.message || "Không tải được dữ liệu sản phẩm.");
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  async function handleCreateProduct(event) {
    event.preventDefault();

    if (!form.categoryId) {
      await popupAlert("Vui lòng chọn danh mục.");
      return;
    }

    try {
      await createProduct(
        {
          productName: form.productName.trim(),
          categoryId: Number(form.categoryId),
          productType: form.productType,
          basePrice: Number(form.basePrice || 0),
          prescriptionCompatible: form.prescriptionCompatible,
          description: form.description.trim() || null,
        },
        accessToken,
      );

      setForm({
        productName: "",
        categoryId: "",
        productType: PRODUCT_TYPES[0],
        basePrice: "",
        prescriptionCompatible: false,
        description: "",
      });
      fetchProducts();
    } catch (requestError) {
      await popupAlert(requestError?.message || "Không tạo được sản phẩm.");
    }
  }

  async function handleCreateCategory(event) {
    event.preventDefault();

    const categoryName = newCategoryName.trim();
    if (!categoryName) {
      await popupAlert("Vui lòng nhập tên danh mục.");
      return;
    }

    try {
      const created = await createCategory({ categoryName }, accessToken);
      setNewCategoryName("");
      await fetchProducts();

      if (created?.categoryId) {
        setForm((currentForm) => ({ ...currentForm, categoryId: String(created.categoryId) }));
      }
    } catch (requestError) {
      await popupAlert(requestError?.message || "Không tạo được danh mục.");
    }
  }

  async function handleToggleProductStatus(product) {
    if (!product.isAvailable) {
      await popupAlert("Sản phẩm chưa có tồn kho. Vào Quản Lý Kho để nhập số lượng trước khi mở bán.");
      navigate("/admin/inventory");
      return;
    }

    try {
      const inventoryResult = await getInventories(
        { page: 1, pageSize: 200, productId: product.productId, sortBy: "variantId", sortOrder: "asc" },
        accessToken,
      );

      const inventories = inventoryResult?.items ?? [];
      if (inventories.length === 0) {
        await popupAlert("Sản phẩm chưa có variant trong kho.");
        navigate("/admin/inventory");
        return;
      }

      await Promise.all(
        inventories.map((item) =>
          updateInventory(
            item.variantId,
            {
              quantity: 0,
              isPreOrderAllowed: Boolean(item.isPreOrderAllowed),
              expectedRestockDate: item.expectedRestockDate ?? null,
              preOrderNote: item.preOrderNote ?? null,
            },
            accessToken,
          ),
        ),
      );

      await updateProductStatus(product.productId, false, accessToken);
      await popupAlert("Đã ngừng bán sản phẩm (đưa tồn kho về 0).");
      await fetchProducts();
    } catch (requestError) {
      await popupAlert(requestError?.message || "Không đổi được trạng thái sản phẩm.");
    }
  }

  function openVariantModal(product) {
    setVariantForm({
      productId: product.productId,
      productName: product.productName,
      sku: `SKU-${product.productId}-${Date.now()}`,
      price: String(product.basePrice ?? ""),
      quantity: "1",
      color: "",
      size: "",
      frameType: "",
    });
    setIsVariantModalOpen(true);
  }

  function closeVariantModal() {
    if (isCreatingVariant) {
      return;
    }

    setIsVariantModalOpen(false);
    setVariantForm({
      productId: null,
      productName: "",
      sku: "",
      price: "",
      quantity: "1",
      color: "",
      size: "",
      frameType: "",
    });
  }

  function handleVariantFieldChange(event) {
    const { name, value } = event.target;
    setVariantForm((currentForm) => ({ ...currentForm, [name]: value }));
  }

  async function handleSubmitVariant(event) {
    event.preventDefault();

    const normalizedSku = variantForm.sku.trim();
    const price = Number(variantForm.price);
    const quantity = Number(variantForm.quantity);

    if (!variantForm.productId) {
      await popupAlert("Không xác định được sản phẩm để tạo variant.");
      return;
    }

    if (!normalizedSku) {
      await popupAlert("SKU không được để trống.");
      return;
    }

    if (Number.isNaN(price) || price < 0 || Number.isNaN(quantity) || quantity < 0) {
      await popupAlert("Giá hoặc số lượng không hợp lệ.");
      return;
    }

    setIsCreatingVariant(true);
    try {
      await createProductVariant(
        variantForm.productId,
        {
          sku: normalizedSku,
          price,
          quantity,
          color: variantForm.color.trim() || null,
          size: variantForm.size.trim() || null,
          frameType: variantForm.frameType.trim() || null,
          isPreOrderAllowed: false,
          expectedRestockDate: null,
          preOrderNote: null,
        },
        accessToken,
      );

      await popupAlert("Tạo variant thành công.");
      closeVariantModal();
      await fetchProducts();
    } catch (requestError) {
      await popupAlert(requestError?.message || "Không tạo được variant.");
    } finally {
      setIsCreatingVariant(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Quản Lý Sản Phẩm</h1>
        <button
          type="button"
          onClick={fetchProducts}
          className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold"
        >
          Tải lại
        </button>
      </div>

      {error ? <p className="mb-4 rounded-lg bg-red-50 p-3 text-red-700">{error}</p> : null}

      <form onSubmit={handleCreateCategory} className="mb-4 rounded-xl border border-gray-200 bg-white p-4">
        <h2 className="mb-3 text-lg font-semibold text-gray-900">Tạo danh mục mới</h2>
        <div className="flex flex-col gap-3 md:flex-row">
          <input
            type="text"
            value={newCategoryName}
            onChange={(event) => setNewCategoryName(event.target.value)}
            placeholder="Tên danh mục"
            className="w-full rounded-md border border-gray-300 px-3 py-2"
            required
          />
          <button type="submit" className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white md:w-auto">
            Tạo danh mục
          </button>
        </div>
      </form>

      <form onSubmit={handleCreateProduct} className="mb-6 rounded-xl border border-gray-200 bg-white p-4">
        <h2 className="mb-3 text-lg font-semibold text-gray-900">Tạo sản phẩm mới</h2>
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          <input
            type="text"
            value={form.productName}
            onChange={(event) => setForm((currentForm) => ({ ...currentForm, productName: event.target.value }))}
            placeholder="Tên sản phẩm"
            className="rounded-md border border-gray-300 px-3 py-2"
            required
          />

          <select
            value={form.categoryId}
            onChange={(event) => setForm((currentForm) => ({ ...currentForm, categoryId: event.target.value }))}
            className="rounded-md border border-gray-300 px-3 py-2"
            required
          >
            <option value="">Chọn danh mục</option>
            {categories.map((category) => (
              <option key={category.categoryId} value={category.categoryId}>
                {category.categoryName}
              </option>
            ))}
          </select>

          <select
            value={form.productType}
            onChange={(event) => setForm((currentForm) => ({ ...currentForm, productType: event.target.value }))}
            className="rounded-md border border-gray-300 px-3 py-2"
          >
            {PRODUCT_TYPES.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>

          <input
            type="number"
            min="0"
            value={form.basePrice}
            onChange={(event) => setForm((currentForm) => ({ ...currentForm, basePrice: event.target.value }))}
            placeholder="Giá cơ bản"
            className="rounded-md border border-gray-300 px-3 py-2"
            required
          />

          <label className="flex items-center gap-2 rounded-md border border-gray-300 px-3 py-2 text-sm">
            <input
              type="checkbox"
              checked={form.prescriptionCompatible}
              onChange={(event) => setForm((currentForm) => ({ ...currentForm, prescriptionCompatible: event.target.checked }))}
            />
            Hỗ trợ kính thuốc
          </label>

          <input
            type="text"
            value={form.description}
            onChange={(event) => setForm((currentForm) => ({ ...currentForm, description: event.target.value }))}
            placeholder="Mô tả"
            className="rounded-md border border-gray-300 px-3 py-2"
          />
        </div>

        <button type="submit" className="mt-3 rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white">
          Tạo sản phẩm
        </button>
      </form>

      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-bold uppercase text-gray-600">ID</th>
              <th className="px-4 py-3 text-left text-xs font-bold uppercase text-gray-600">Tên</th>
              <th className="px-4 py-3 text-left text-xs font-bold uppercase text-gray-600">Loại</th>
              <th className="px-4 py-3 text-left text-xs font-bold uppercase text-gray-600">Giá</th>
              <th className="px-4 py-3 text-left text-xs font-bold uppercase text-gray-600">Khả dụng</th>
              <th className="px-4 py-3 text-left text-xs font-bold uppercase text-gray-600">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {!loading && products.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-sm text-gray-500">Không có dữ liệu.</td>
              </tr>
            ) : null}

            {products.map((product) => (
              <tr key={product.productId}>
                <td className="px-4 py-3 text-sm text-gray-700">{product.productId}</td>
                <td className="px-4 py-3 text-sm font-semibold text-gray-900">{product.productName}</td>
                <td className="px-4 py-3 text-sm text-gray-700">{product.productType}</td>
                <td className="px-4 py-3 text-sm text-gray-700">{formatCurrency(product.basePrice)}</td>
                <td className="px-4 py-3 text-sm text-gray-700">{product.isAvailable ? "Đang bán" : "Ngừng bán"}</td>
                <td className="px-4 py-3 text-sm">
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => openVariantModal(product)}
                      className="rounded-md border border-gray-300 px-2 py-1 text-xs font-semibold"
                    >
                      Tạo variant
                    </button>
                    <button
                      type="button"
                      onClick={() => handleToggleProductStatus(product)}
                      className="rounded-md border border-gray-300 px-2 py-1 text-xs font-semibold"
                    >
                      {product.isAvailable ? "Ngừng bán" : "Nhập kho"}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isVariantModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <form onSubmit={handleSubmitVariant} className="w-full max-w-2xl rounded-xl bg-white p-5 shadow-xl">
            <h2 className="text-xl font-bold text-gray-900">Tạo variant</h2>
            <p className="mt-1 text-sm text-gray-600">Sản phẩm: {variantForm.productName}</p>

            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <input
                name="sku"
                value={variantForm.sku}
                onChange={handleVariantFieldChange}
                placeholder="SKU"
                className="rounded-md border border-gray-300 px-3 py-2"
                required
              />
              <input
                type="number"
                min="0"
                name="price"
                value={variantForm.price}
                onChange={handleVariantFieldChange}
                placeholder="Giá"
                className="rounded-md border border-gray-300 px-3 py-2"
                required
              />
              <input
                type="number"
                min="0"
                name="quantity"
                value={variantForm.quantity}
                onChange={handleVariantFieldChange}
                placeholder="Số lượng tồn kho ban đầu"
                className="rounded-md border border-gray-300 px-3 py-2"
                required
              />
              <input
                name="color"
                value={variantForm.color}
                onChange={handleVariantFieldChange}
                placeholder="Màu sắc (không bắt buộc)"
                className="rounded-md border border-gray-300 px-3 py-2"
              />
              <input
                name="size"
                value={variantForm.size}
                onChange={handleVariantFieldChange}
                placeholder="Kích thước (không bắt buộc)"
                className="rounded-md border border-gray-300 px-3 py-2"
              />
              <input
                name="frameType"
                value={variantForm.frameType}
                onChange={handleVariantFieldChange}
                placeholder="Frame type (không bắt buộc)"
                className="rounded-md border border-gray-300 px-3 py-2"
              />
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={closeVariantModal}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold"
                disabled={isCreatingVariant}
              >
                Hủy
              </button>
              <button
                type="submit"
                className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
                disabled={isCreatingVariant}
              >
                {isCreatingVariant ? "Đang tạo..." : "Tạo variant"}
              </button>
            </div>
          </form>
        </div>
      ) : null}
      {popupElement}
    </div>
  );
}
