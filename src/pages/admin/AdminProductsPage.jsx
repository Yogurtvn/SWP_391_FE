import { useAdminProductsPage } from "@/hooks/admin/useAdminProductsPage";

function formatCurrency(value) {
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(Number(value || 0));
}

export default function AdminProductsPage() {
  const {
    products,
    categories,
    productDetail,
    form,
    newCategoryName,
    variantForm,
    ui,
    actions,
    popupElement,
  } = useAdminProductsPage();

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Quan Ly San Pham</h1>
        <button
          type="button"
          onClick={actions.retry}
          className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold"
        >
          Tai lai
        </button>
      </div>

      {ui.error ? <p className="mb-4 rounded-lg bg-red-50 p-3 text-red-700">{ui.error}</p> : null}

      <form onSubmit={actions.createCategory} className="mb-4 rounded-xl border border-gray-200 bg-white p-4">
        <h2 className="mb-3 text-lg font-semibold text-gray-900">Tao danh muc moi</h2>
        <div className="flex flex-col gap-3 md:flex-row">
          <input
            type="text"
            value={newCategoryName}
            onChange={(event) => actions.setNewCategoryName(event.target.value)}
            placeholder="Ten danh muc"
            className="w-full rounded-md border border-gray-300 px-3 py-2"
            required
          />
          <button type="submit" className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white md:w-auto">
            Tao danh muc
          </button>
        </div>
      </form>

      <form onSubmit={actions.createProduct} className="mb-6 rounded-xl border border-gray-200 bg-white p-4">
        <h2 className="mb-3 text-lg font-semibold text-gray-900">Tao san pham moi</h2>
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          <input
            type="text"
            value={form.productName}
            onChange={(event) => actions.setFormField("productName", event.target.value)}
            placeholder="Ten san pham"
            className="rounded-md border border-gray-300 px-3 py-2"
            required
          />

          <select
            value={form.categoryId}
            onChange={(event) => actions.setFormField("categoryId", event.target.value)}
            className="rounded-md border border-gray-300 px-3 py-2"
            required
          >
            <option value="">Chon danh muc</option>
            {categories.map((category) => (
              <option key={category.categoryId} value={category.categoryId}>
                {category.categoryName}
              </option>
            ))}
          </select>

          <select
            value={form.productType}
            onChange={(event) => actions.setFormField("productType", event.target.value)}
            className="rounded-md border border-gray-300 px-3 py-2"
          >
            <option value="Frame">Frame</option>
            <option value="Sunglasses">Sunglasses</option>
            <option value="Lens">Lens</option>
          </select>

          <input
            type="number"
            min="0"
            value={form.basePrice}
            onChange={(event) => actions.setFormField("basePrice", event.target.value)}
            placeholder="Gia co ban"
            className="rounded-md border border-gray-300 px-3 py-2"
            required
          />

          <label className="flex items-center gap-2 rounded-md border border-gray-300 px-3 py-2 text-sm">
            <input
              type="checkbox"
              checked={form.prescriptionCompatible}
              onChange={(event) => actions.setFormField("prescriptionCompatible", event.target.checked)}
            />
            Ho tro kinh thuoc
          </label>

          <input
            type="text"
            value={form.description}
            onChange={(event) => actions.setFormField("description", event.target.value)}
            placeholder="Mo ta"
            className="rounded-md border border-gray-300 px-3 py-2"
          />
        </div>

        <button type="submit" className="mt-3 rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white">
          Tao san pham
        </button>
      </form>

      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-bold uppercase text-gray-600">ID</th>
              <th className="px-4 py-3 text-left text-xs font-bold uppercase text-gray-600">Ten</th>
              <th className="px-4 py-3 text-left text-xs font-bold uppercase text-gray-600">Loai</th>
              <th className="px-4 py-3 text-left text-xs font-bold uppercase text-gray-600">Gia</th>
              <th className="px-4 py-3 text-left text-xs font-bold uppercase text-gray-600">Kha dung</th>
              <th className="px-4 py-3 text-left text-xs font-bold uppercase text-gray-600">Thao tac</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {!ui.isLoading && products.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-sm text-gray-500">
                  Khong co du lieu.
                </td>
              </tr>
            ) : null}

            {products.map((product) => (
              <tr key={product.productId}>
                <td className="px-4 py-3 text-sm text-gray-700">{product.productId}</td>
                <td className="px-4 py-3 text-sm font-semibold text-gray-900">{product.productName}</td>
                <td className="px-4 py-3 text-sm text-gray-700">{product.productType}</td>
                <td className="px-4 py-3 text-sm text-gray-700">{formatCurrency(product.basePrice)}</td>
                <td className="px-4 py-3 text-sm text-gray-700">{product.isAvailable ? "Dang ban" : "Ngung ban"}</td>
                <td className="px-4 py-3 text-sm">
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => actions.viewDetail(product)}
                      className="rounded-md border border-gray-300 px-2 py-1 text-xs font-semibold"
                    >
                      Chi tiet
                    </button>
                    <button
                      type="button"
                      onClick={() => actions.openVariantModal(product)}
                      className="rounded-md border border-gray-300 px-2 py-1 text-xs font-semibold"
                    >
                      Tao variant
                    </button>
                    <button
                      type="button"
                      onClick={() => actions.toggleProductStatus(product)}
                      className="rounded-md border border-gray-300 px-2 py-1 text-xs font-semibold"
                    >
                      {product.isAvailable ? "Ngung ban" : "Nhap kho"}
                    </button>
                    <button
                      type="button"
                      onClick={() => actions.deleteProduct(product)}
                      className="rounded-md border border-red-300 px-2 py-1 text-xs font-semibold text-red-700"
                    >
                      Xoa
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {productDetail ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="max-h-[90vh] w-full max-w-5xl overflow-auto rounded-xl bg-white p-5 shadow-xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-gray-900">{productDetail.productName}</h2>
                <p className="mt-1 text-sm text-gray-600">
                  {productDetail.productType} • {formatCurrency(productDetail.basePrice)}
                </p>
                <p className="mt-1 text-sm text-gray-600">{productDetail.description || "Khong co mo ta."}</p>
                <p className="mt-1 text-sm text-gray-600">
                  Prescription compatible: {productDetail.prescriptionCompatible ? "Yes" : "No"}
                </p>
              </div>
              <button
                type="button"
                onClick={actions.clearDetail}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold"
              >
                Dong
              </button>
            </div>

            {ui.detailLoading ? <p className="mt-4 text-sm text-gray-500">Dang tai chi tiet...</p> : null}

            <div className="mt-6 grid gap-6 lg:grid-cols-2">
              <section className="rounded-xl border border-gray-200 p-4">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">Anh san pham</h3>
                  <label className="cursor-pointer rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white">
                    Upload anh
                    <input type="file" multiple accept="image/*" className="hidden" onChange={actions.uploadImages} />
                  </label>
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  {(productDetail.images ?? []).length === 0 ? (
                    <p className="text-sm text-gray-500">Chua co anh.</p>
                  ) : (
                    (productDetail.images ?? []).map((image) => (
                      <div key={image.imageId} className="rounded-lg border border-gray-200 p-3">
                        <img
                          src={image.imageUrl}
                          alt={`Product ${image.imageId}`}
                          className="h-40 w-full rounded-md object-cover"
                        />
                        <div className="mt-2 flex items-center justify-between gap-2 text-xs text-gray-600">
                          <span>
                            #{image.imageId} • order {image.displayOrder}
                          </span>
                          <span>{image.isPrimary ? "Primary" : "Secondary"}</span>
                        </div>
                        <div className="mt-3 flex gap-2">
                          <button
                            type="button"
                            onClick={() => actions.setPrimaryImage(image)}
                            className="rounded-md border border-gray-300 px-2 py-1 text-xs font-semibold"
                          >
                            Dat anh chinh
                          </button>
                          <button
                            type="button"
                            onClick={() => actions.deleteImage(image)}
                            className="rounded-md border border-red-300 px-2 py-1 text-xs font-semibold text-red-700"
                          >
                            Xoa anh
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </section>

              <section className="rounded-xl border border-gray-200 p-4">
                <h3 className="mb-3 text-lg font-semibold text-gray-900">Variants</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 py-2 text-left text-xs font-bold uppercase text-gray-600">Variant ID</th>
                        <th className="px-3 py-2 text-left text-xs font-bold uppercase text-gray-600">SKU</th>
                        <th className="px-3 py-2 text-left text-xs font-bold uppercase text-gray-600">Gia</th>
                        <th className="px-3 py-2 text-left text-xs font-bold uppercase text-gray-600">Color</th>
                        <th className="px-3 py-2 text-left text-xs font-bold uppercase text-gray-600">Size</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {(productDetail.variants ?? []).length === 0 ? (
                        <tr>
                          <td colSpan={5} className="px-3 py-4 text-center text-sm text-gray-500">
                            Chua co variant.
                          </td>
                        </tr>
                      ) : (
                        (productDetail.variants ?? []).map((variant) => (
                          <tr key={variant.variantId}>
                            <td className="px-3 py-2 text-sm text-gray-700">{variant.variantId}</td>
                            <td className="px-3 py-2 text-sm font-semibold text-gray-900">{variant.sku || "-"}</td>
                            <td className="px-3 py-2 text-sm text-gray-700">{formatCurrency(variant.price)}</td>
                            <td className="px-3 py-2 text-sm text-gray-700">{variant.color || "-"}</td>
                            <td className="px-3 py-2 text-sm text-gray-700">{variant.size || "-"}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
                <p className="mt-3 text-xs text-amber-700">
                  Phan sua product chua map duoc vi payload chi tiet hien tai cua BE chua tra categoryId.
                </p>
              </section>
            </div>
          </div>
        </div>
      ) : null}

      {ui.isVariantModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <form onSubmit={actions.submitVariant} className="w-full max-w-2xl rounded-xl bg-white p-5 shadow-xl">
            <h2 className="text-xl font-bold text-gray-900">Tao variant</h2>
            <p className="mt-1 text-sm text-gray-600">San pham: {variantForm.productName}</p>

            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <input
                name="sku"
                value={variantForm.sku}
                onChange={(event) => actions.setVariantField("sku", event.target.value)}
                placeholder="SKU"
                className="rounded-md border border-gray-300 px-3 py-2"
                required
              />
              <input
                type="number"
                min="0"
                name="price"
                value={variantForm.price}
                onChange={(event) => actions.setVariantField("price", event.target.value)}
                placeholder="Gia"
                className="rounded-md border border-gray-300 px-3 py-2"
                required
              />
              <input
                type="number"
                min="0"
                name="quantity"
                value={variantForm.quantity}
                onChange={(event) => actions.setVariantField("quantity", event.target.value)}
                placeholder="So luong ton kho ban dau"
                className="rounded-md border border-gray-300 px-3 py-2"
                required
              />
              <input
                name="color"
                value={variantForm.color}
                onChange={(event) => actions.setVariantField("color", event.target.value)}
                placeholder="Mau sac"
                className="rounded-md border border-gray-300 px-3 py-2"
              />
              <input
                name="size"
                value={variantForm.size}
                onChange={(event) => actions.setVariantField("size", event.target.value)}
                placeholder="Kich thuoc"
                className="rounded-md border border-gray-300 px-3 py-2"
              />
              <input
                name="frameType"
                value={variantForm.frameType}
                onChange={(event) => actions.setVariantField("frameType", event.target.value)}
                placeholder="Frame type"
                className="rounded-md border border-gray-300 px-3 py-2"
              />
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={actions.closeVariantModal}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold"
                disabled={ui.isCreatingVariant}
              >
                Huy
              </button>
              <button
                type="submit"
                className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
                disabled={ui.isCreatingVariant}
              >
                {ui.isCreatingVariant ? "Dang tao..." : "Tao variant"}
              </button>
            </div>
          </form>
        </div>
      ) : null}
      {popupElement}
    </div>
  );
}
