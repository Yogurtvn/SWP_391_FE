import { AdminErrorBanner, AdminPageShell, AdminSection, adminStyles } from "@/components/admin/admin-ui";
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
    <AdminPageShell
      title="Quan Ly San Pham"
      actions={
        <button type="button" onClick={actions.retry} className={adminStyles.secondaryButton}>
          Tai lai
        </button>
      }
    >
      <AdminErrorBanner message={ui.error} />

      <AdminSection title="Tao danh muc moi">
        <form onSubmit={actions.createCategory} className="flex flex-col gap-4 xl:flex-row">
          <input
            type="text"
            value={newCategoryName}
            onChange={(event) => actions.setNewCategoryName(event.target.value)}
            placeholder="Ten danh muc"
            className={`${adminStyles.input} flex-1`}
            required
          />
          <button type="submit" className={`${adminStyles.primaryButton} xl:min-w-36`}>
            Tao danh muc
          </button>
        </form>
      </AdminSection>

      <AdminSection title="Tao san pham moi">
        <form onSubmit={actions.createProduct} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <input
              type="text"
              value={form.productName}
              onChange={(event) => actions.setFormField("productName", event.target.value)}
              placeholder="Ten san pham"
              className={adminStyles.input}
              required
            />

            <select
              value={form.categoryId}
              onChange={(event) => actions.setFormField("categoryId", event.target.value)}
              className={adminStyles.input}
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
              className={adminStyles.input}
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
              className={adminStyles.input}
              required
            />

            <label className={adminStyles.checkboxRow}>
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
              className={adminStyles.input}
            />
          </div>

          <button type="submit" className={adminStyles.primaryButton}>
            Tao san pham
          </button>
        </form>
      </AdminSection>

      <div className={adminStyles.tableWrapper}>
        <table className={adminStyles.table}>
          <thead className={adminStyles.tableHead}>
            <tr>
              <th className={adminStyles.th}>ID</th>
              <th className={adminStyles.th}>Ten</th>
              <th className={adminStyles.th}>Loai</th>
              <th className={adminStyles.th}>Gia</th>
              <th className={adminStyles.th}>Kha dung</th>
              <th className={adminStyles.th}>Thao tac</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {!ui.isLoading && products.length === 0 ? (
              <tr>
                <td colSpan={6} className={adminStyles.emptyState}>
                  Khong co du lieu.
                </td>
              </tr>
            ) : null}

            {products.map((product) => (
              <tr key={product.productId}>
                <td className={adminStyles.td}>{product.productId}</td>
                <td className={`${adminStyles.td} font-semibold text-slate-950`}>{product.productName}</td>
                <td className={adminStyles.td}>{product.productType}</td>
                <td className={adminStyles.td}>{formatCurrency(product.basePrice)}</td>
                <td className={adminStyles.td}>{product.isAvailable ? "Dang ban" : "Ngung ban"}</td>
                <td className={adminStyles.td}>
                  <div className="flex flex-wrap gap-2">
                    <button type="button" onClick={() => actions.viewDetail(product)} className={adminStyles.smallButton}>
                      Chi tiet
                    </button>
                    <button
                      type="button"
                      onClick={() => actions.openVariantModal(product)}
                      className={adminStyles.smallButton}
                    >
                      Tao variant
                    </button>
                    <button
                      type="button"
                      onClick={() => actions.toggleProductStatus(product)}
                      className={adminStyles.smallButton}
                    >
                      {product.isAvailable ? "Ngung ban" : "Nhap kho"}
                    </button>
                    <button
                      type="button"
                      onClick={() => actions.deleteProduct(product)}
                      className={adminStyles.smallDangerButton}
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4">
          <div className="max-h-[90vh] w-full max-w-6xl overflow-auto rounded-[1.75rem] bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold text-slate-950">{productDetail.productName}</h2>
                <p className="mt-1 text-base text-slate-500">
                  {productDetail.productType} - {formatCurrency(productDetail.basePrice)}
                </p>
                <p className="mt-2 text-base text-slate-600">{productDetail.description || "Khong co mo ta."}</p>
                <p className="mt-2 text-sm font-medium text-slate-500">
                  Prescription compatible: {productDetail.prescriptionCompatible ? "Yes" : "No"}
                </p>
              </div>
              <button type="button" onClick={actions.clearDetail} className={adminStyles.secondaryButton}>
                Dong
              </button>
            </div>

            {ui.detailLoading ? <p className="mt-4 text-sm text-slate-500">Dang tai chi tiet...</p> : null}

            <div className="mt-6 grid gap-6 xl:grid-cols-2">
              <AdminSection
                title="Anh san pham"
                className="border-slate-200 shadow-none"
                bodyClassName="p-5"
                actions={
                  <label className={adminStyles.primaryButton}>
                    Upload anh
                    <input type="file" multiple accept="image/*" className="hidden" onChange={actions.uploadImages} />
                  </label>
                }
              >
                <div className="grid gap-4 md:grid-cols-2">
                  {(productDetail.images ?? []).length === 0 ? (
                    <p className="text-sm text-slate-500">Chua co anh.</p>
                  ) : (
                    (productDetail.images ?? []).map((image) => (
                      <div key={image.imageId} className="rounded-2xl border border-slate-200 p-4">
                        <img
                          src={image.imageUrl}
                          alt={`Product ${image.imageId}`}
                          className="h-44 w-full rounded-xl object-cover"
                        />
                        <div className="mt-3 flex items-center justify-between gap-2 text-sm text-slate-500">
                          <span>#{image.imageId} - order {image.displayOrder}</span>
                          <span>{image.isPrimary ? "Primary" : "Secondary"}</span>
                        </div>
                        <div className="mt-4 flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => actions.setPrimaryImage(image)}
                            className={adminStyles.smallButton}
                          >
                            Dat anh chinh
                          </button>
                          <button
                            type="button"
                            onClick={() => actions.deleteImage(image)}
                            className={adminStyles.smallDangerButton}
                          >
                            Xoa anh
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </AdminSection>

              <AdminSection title="Variants" className="border-slate-200 shadow-none" bodyClassName="p-5">
                <div className="overflow-x-auto">
                  <table className={adminStyles.table}>
                    <thead className={adminStyles.tableHead}>
                      <tr>
                        <th className={adminStyles.th}>Variant ID</th>
                        <th className={adminStyles.th}>SKU</th>
                        <th className={adminStyles.th}>Gia</th>
                        <th className={adminStyles.th}>Color</th>
                        <th className={adminStyles.th}>Size</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {(productDetail.variants ?? []).length === 0 ? (
                        <tr>
                          <td colSpan={5} className={adminStyles.emptyState}>
                            Chua co variant.
                          </td>
                        </tr>
                      ) : (
                        (productDetail.variants ?? []).map((variant) => (
                          <tr key={variant.variantId}>
                            <td className={adminStyles.td}>{variant.variantId}</td>
                            <td className={`${adminStyles.td} font-semibold text-slate-950`}>{variant.sku || "-"}</td>
                            <td className={adminStyles.td}>{formatCurrency(variant.price)}</td>
                            <td className={adminStyles.td}>{variant.color || "-"}</td>
                            <td className={adminStyles.td}>{variant.size || "-"}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
                <p className="mt-4 text-sm text-amber-700">
                  Phan sua product chua map duoc vi payload chi tiet hien tai cua BE chua tra categoryId.
                </p>
              </AdminSection>
            </div>
          </div>
        </div>
      ) : null}

      {ui.isVariantModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4">
          <form onSubmit={actions.submitVariant} className="w-full max-w-3xl rounded-[1.75rem] bg-white p-6 shadow-2xl">
            <h2 className="text-2xl font-bold text-slate-950">Tao variant</h2>
            <p className="mt-1 text-base text-slate-500">San pham: {variantForm.productName}</p>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <input
                name="sku"
                value={variantForm.sku}
                onChange={(event) => actions.setVariantField("sku", event.target.value)}
                placeholder="SKU"
                className={adminStyles.input}
                required
              />
              <input
                type="number"
                min="0"
                name="price"
                value={variantForm.price}
                onChange={(event) => actions.setVariantField("price", event.target.value)}
                placeholder="Gia"
                className={adminStyles.input}
                required
              />
              <input
                type="number"
                min="0"
                name="quantity"
                value={variantForm.quantity}
                onChange={(event) => actions.setVariantField("quantity", event.target.value)}
                placeholder="So luong ton kho ban dau"
                className={adminStyles.input}
                required
              />
              <input
                name="color"
                value={variantForm.color}
                onChange={(event) => actions.setVariantField("color", event.target.value)}
                placeholder="Mau sac"
                className={adminStyles.input}
              />
              <input
                name="size"
                value={variantForm.size}
                onChange={(event) => actions.setVariantField("size", event.target.value)}
                placeholder="Kich thuoc"
                className={adminStyles.input}
              />
              <input
                name="frameType"
                value={variantForm.frameType}
                onChange={(event) => actions.setVariantField("frameType", event.target.value)}
                placeholder="Frame type"
                className={adminStyles.input}
              />
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={actions.closeVariantModal}
                className={adminStyles.secondaryButton}
                disabled={ui.isCreatingVariant}
              >
                Huy
              </button>
              <button
                type="submit"
                className={adminStyles.primaryButton}
                disabled={ui.isCreatingVariant}
              >
                {ui.isCreatingVariant ? "Dang tao..." : "Tao variant"}
              </button>
            </div>
          </form>
        </div>
      ) : null}
      {popupElement}
    </AdminPageShell>
  );
}
