import { AlertCircle, ArrowLeft, Check, Eye, ShoppingCart, Upload, X } from "lucide-react";
import { Link } from "react-router";
import { usePrescriptionFlow } from "@/hooks/prescription/usePrescriptionFlow";

export default function PrescriptionFlow() {
  const {
    product,
    lensTypes,
    pricingOptions,
    selectedVariant,
    selectedLensType,
    selectedLensMaterialOption,
    selectedColor,
    selectedSize,
    selectedLensTypeId,
    selectedLensMaterial,
    selectedCoatings,
    formState,
    imageFileName,
    totalPrice,
    ui,
    actions,
  } = usePrescriptionFlow();
  const pricing = ui.pricing;

  if (ui.isLoading) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="rounded-[28px] border border-border bg-white p-8 shadow-sm">
          <div className="mx-auto mb-4 h-12 w-12 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
          <p className="text-center text-muted-foreground">Dang tai luong kinh theo toa...</p>
        </div>
      </div>
    );
  }

  if (ui.error || !product) {
    return (
      <StateCard
        title="Chua the dat kinh theo toa"
        description={ui.error || "Khong the tai thong tin san pham."}
      />
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <button
        type="button"
        onClick={actions.goBackToProduct}
        className="mb-8 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Quay lai san pham
      </button>

      <div className="mb-8 grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
        <section className="rounded-[28px] border border-border bg-white p-6 shadow-sm">
          <div className="mb-6 flex items-start gap-4">
            <img
              src={product.image}
              alt={product.name}
              className="h-28 w-28 rounded-2xl object-cover"
            />
            <div className="min-w-0 flex-1">
              <p className="mb-2 inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs text-emerald-700">
                <Check className="h-3.5 w-3.5" />
                Ho tro kinh theo toa
              </p>
              <h1 className="text-3xl">{product.name}</h1>
              <p className="mt-2 text-muted-foreground leading-7">{product.description}</p>
            </div>
          </div>

          <form onSubmit={actions.submit} className="space-y-8">
            <section>
              <h2 className="mb-4 text-xl">1. Gong kinh</h2>

              {(product.colors ?? []).length > 0 && (
                <div className="mb-5">
                  <p className="mb-3 text-sm">Mau sac</p>
                  <div className="flex flex-wrap gap-3">
                    {product.colors.map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => actions.setSelectedColor(color)}
                        className={`rounded-full border px-4 py-2 text-sm transition-colors ${
                          selectedColor === color ? "border-primary bg-primary/10 text-primary" : "border-border hover:border-primary/40"
                        }`}
                      >
                        {color}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {(product.sizes ?? []).length > 0 && (
                <div>
                  <p className="mb-3 text-sm">Kich thuoc</p>
                  <div className="flex flex-wrap gap-3">
                    {product.sizes.map((size) => (
                      <button
                        key={size}
                        type="button"
                        onClick={() => actions.setSelectedSize(size)}
                        className={`rounded-full border px-4 py-2 text-sm transition-colors ${
                          selectedSize === size ? "border-primary bg-primary/10 text-primary" : "border-border hover:border-primary/40"
                        }`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </section>

            <section>
              <h2 className="mb-4 text-xl">2. Goi trong kinh</h2>

              <div className="grid gap-3 md:grid-cols-2">
                {lensTypes.map((lensType) => (
                  <button
                    key={lensType.lensTypeId}
                    type="button"
                    onClick={() => actions.setSelectedLensTypeId(String(lensType.lensTypeId))}
                    className={`rounded-2xl border p-4 text-left transition-colors ${
                      String(selectedLensTypeId) === String(lensType.lensTypeId)
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/40"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p>{lensType.lensName}</p>
                        <p className="mt-1 text-sm text-muted-foreground">{lensType.lensCode}</p>
                      </div>
                      <span className="text-primary">{formatCurrency(lensType.price)}</span>
                    </div>
                  </button>
                ))}
              </div>
            </section>

            <section>
              <h2 className="mb-4 text-xl">3. Thong so toa kinh</h2>

              <div className="grid gap-4 md:grid-cols-3">
                <NumericField label="SPH mat phai" value={formState.rightSph} onChange={(value) => actions.updateField("rightSph", value)} placeholder="-1.25" />
                <NumericField label="CYL mat phai" value={formState.rightCyl} onChange={(value) => actions.updateField("rightCyl", value)} placeholder="0.00" />
                <NumericField label="AXIS mat phai" value={formState.rightAxis} onChange={(value) => actions.updateField("rightAxis", value)} placeholder="0" />
                <NumericField label="SPH mat trai" value={formState.leftSph} onChange={(value) => actions.updateField("leftSph", value)} placeholder="-1.00" />
                <NumericField label="CYL mat trai" value={formState.leftCyl} onChange={(value) => actions.updateField("leftCyl", value)} placeholder="0.00" />
                <NumericField label="AXIS mat trai" value={formState.leftAxis} onChange={(value) => actions.updateField("leftAxis", value)} placeholder="0" />
              </div>

              <div className="mt-4">
                <NumericField label="PD" value={formState.pd} onChange={(value) => actions.updateField("pd", value)} placeholder="63" />
              </div>
            </section>

            <section>
              <h2 className="mb-4 text-xl">4. Chat lieu va coating</h2>

              {pricingOptions.lensMaterials.length > 0 && (
                <div className="mb-5">
                  <p className="mb-3 text-sm">Chat lieu trong</p>
                  <div className="grid gap-3 md:grid-cols-2">
                    {pricingOptions.lensMaterials.map((option) => (
                      <button
                        key={option.code}
                        type="button"
                        onClick={() => actions.setSelectedLensMaterial(option.code)}
                        className={`rounded-2xl border p-4 text-left transition-colors ${
                          selectedLensMaterial === option.code ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"
                        }`}
                      >
                        <span className="block">{option.label}</span>
                        <span className="mt-1 block text-sm text-muted-foreground">+{formatCurrency(option.priceAdjustment)}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {pricingOptions.coatings.length > 0 && (
                <div>
                  <p className="mb-3 text-sm">Coating</p>
                  <div className="flex flex-wrap gap-3">
                    {pricingOptions.coatings.map((coating) => {
                      const isSelected = selectedCoatings.includes(coating.code);

                      return (
                        <button
                          key={coating.code}
                          type="button"
                          onClick={() => actions.toggleCoating(coating.code)}
                          className={`rounded-full border px-4 py-2 text-sm transition-colors ${
                            isSelected ? "border-primary bg-primary/10 text-primary" : "border-border hover:border-primary/40"
                          }`}
                        >
                          {coating.label} +{formatCurrency(coating.priceAdjustment)}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </section>

            <section>
              <h2 className="mb-4 text-xl">5. Anh toa va ghi chu</h2>

              <div className="mb-4 rounded-2xl border border-dashed border-border p-5">
                <label className="flex cursor-pointer flex-col items-center justify-center gap-3 text-center">
                  <Upload className="h-8 w-8 text-primary" />
                  <span className="text-sm">{imageFileName || "Chon anh toa kinh"}</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(event) => actions.setImage(event.target.files?.[0] ?? null)}
                  />
                </label>

                {imageFileName ? (
                  <div className="mt-4 flex items-center justify-between gap-3 rounded-xl bg-secondary/60 px-4 py-3 text-sm">
                    <span className="truncate">{imageFileName}</span>
                    <button
                      type="button"
                      onClick={actions.clearImage}
                      className="rounded-full p-1 text-muted-foreground hover:bg-white hover:text-foreground"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : null}

                {ui.imageUpload.error ? <p className="mt-3 text-sm text-red-600">{ui.imageUpload.error}</p> : null}
              </div>

              <label className="block">
                <span className="mb-2 block text-sm">Ghi chu</span>
                <textarea
                  value={formState.notes}
                  onChange={(event) => actions.updateField("notes", event.target.value)}
                  placeholder="Ghi chu them cho don kinh"
                  rows={4}
                  className="w-full rounded-2xl border border-border bg-background px-4 py-3 outline-none transition-colors focus:border-primary"
                />
              </label>
            </section>

            {(ui.formError || ui.submitError) && (
              <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700">
                <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
                <p className="text-sm leading-6">{ui.formError || ui.submitError}</p>
              </div>
            )}

            <div className="flex flex-wrap gap-3">
              <button
                type="submit"
                disabled={ui.isSubmitting || pricing.status === "loading" || ui.imageUpload.status === "loading"}
                className="inline-flex items-center gap-2 rounded-2xl bg-primary px-6 py-3 text-white transition-colors hover:bg-primary/90 disabled:opacity-60"
              >
                {ui.isSubmitting || ui.imageUpload.status === "loading" ? (
                  <>
                    <div className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                    Dang them vao gio...
                  </>
                ) : pricing.status === "loading" ? (
                  <>
                    <div className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                    Dang tinh gia...
                  </>
                ) : (
                  <>
                    <ShoppingCart className="h-4 w-4" />
                    Them vao gio
                  </>
                )}
              </button>

              {!ui.isCustomerSession && (
                <Link
                  to="/login"
                  className="inline-flex items-center gap-2 rounded-2xl border border-border px-6 py-3 transition-colors hover:bg-secondary"
                >
                  Dang nhap
                </Link>
              )}
            </div>
          </form>
        </section>

        <aside className="h-fit rounded-[28px] border border-border bg-white p-6 shadow-sm lg:sticky lg:top-24">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Eye className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-xl">Tom tat</h2>
              <p className="text-sm text-muted-foreground">Kiem tra truoc khi them vao gio.</p>
            </div>
          </div>

          <div className="space-y-4">
            <SummaryRow label="Gong" value={product.name} />
            <SummaryRow label="Bien the" value={`${selectedColor || selectedVariant?.color || "Mac dinh"} / ${selectedSize || selectedVariant?.size || "Free size"}`} />
            <SummaryRow label="Trong" value={selectedLensType?.lensName || "Chua chon"} />
            <SummaryRow label="Chat lieu" value={selectedLensMaterialOption?.label || "Mac dinh"} />
            <SummaryRow label="Coating" value={selectedCoatings.length > 0 ? selectedCoatings.join(", ") : "Khong"} />
            {imageFileName ? <SummaryRow label="Anh toa" value={imageFileName} /> : null}

            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
              <PriceRow label="Gia gong" value={pricing.framePrice || selectedVariant?.price || 0} />
              <PriceRow label="Gia trong" value={pricing.lensBasePrice || selectedLensType?.price || 0} />
              <PriceRow label="Chat lieu" value={pricing.materialPrice} />
              <PriceRow label="Coating" value={pricing.coatingPrice} />
              <div className="mt-3 flex items-center justify-between border-t border-emerald-200 pt-3 text-base">
                <span>Tong</span>
                <span className="font-semibold">{formatCurrency(totalPrice)}</span>
              </div>
            </div>

            {pricing.error ? (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                {pricing.error}
              </div>
            ) : null}
          </div>
        </aside>
      </div>
    </div>
  );
}

function NumericField({ label, value, onChange, placeholder }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm">{label}</span>
      <input
        type="text"
        inputMode="decimal"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="w-full rounded-2xl border border-border bg-background px-4 py-3 outline-none transition-colors focus:border-primary"
      />
    </label>
  );
}

function SummaryRow({ label, value }) {
  return (
    <div className="rounded-2xl bg-secondary/60 p-4 text-sm">
      <p className="text-muted-foreground">{label}</p>
      <p className="mt-1">{value}</p>
    </div>
  );
}

function PriceRow({ label, value }) {
  return (
    <div className="mb-2 flex items-center justify-between">
      <span>{label}</span>
      <span>{formatCurrency(value)}</span>
    </div>
  );
}

function StateCard({ title, description }) {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="rounded-[28px] border border-border bg-white px-8 py-16 text-center shadow-sm">
        <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 text-primary">
          <AlertCircle className="h-10 w-10" />
        </div>
        <h1 className="mb-3 text-3xl">{title}</h1>
        <p className="mx-auto mb-8 max-w-2xl text-muted-foreground leading-7">{description}</p>
        <div className="flex justify-center gap-3">
          <Link
            to="/shop"
            className="rounded-2xl bg-primary px-5 py-3 text-white transition-colors hover:bg-primary/90"
          >
            Quay ve cua hang
          </Link>
        </div>
      </div>
    </div>
  );
}

function formatCurrency(value) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(Number(value ?? 0));
}
