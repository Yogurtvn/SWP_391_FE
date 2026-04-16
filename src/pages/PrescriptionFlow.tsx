import { useState } from "react";
import { useParams, useNavigate } from "react-router";
import StepProgress from "@/components/common/StepProgress";
import { Check, HelpCircle, Edit2, AlertCircle, Eye, Shield, Sparkles } from "lucide-react";
import { useCart } from "@/store/cart/CartContext";

const steps = [
  { number: 1, label: "Loại tròng" },
  { number: 2, label: "Đơn kính" },
  { number: 3, label: "Gói tròng" },
  { number: 4, label: "Xem lại" },
];

interface PrescriptionErrors {
  odSph?: string;
  odCyl?: string;
  odAxis?: string;
  osSph?: string;
  osCyl?: string;
  osAxis?: string;
  pd?: string;
}

export default function PrescriptionFlow() {
  const { productId } = useParams();
  const navigate = useNavigate();
  const { addItem } = useCart();
  const [currentStep, setCurrentStep] = useState(1);
  const [lensType, setLensType] = useState("");
  const [prescription, setPrescription] = useState({
    odSph: "",
    odCyl: "",
    odAxis: "",
    osSph: "",
    osCyl: "",
    osAxis: "",
    pd: "",
  });
  const [errors, setErrors] = useState<PrescriptionErrors>({});
  const [lensPackage, setLensPackage] = useState("");

  const validatePrescription = (): boolean => {
    const newErrors: PrescriptionErrors = {};

    if (!prescription.odSph) {
      newErrors.odSph = "Required";
    } else if (isNaN(parseFloat(prescription.odSph))) {
      newErrors.odSph = "Must be a number";
    }

    if (!prescription.osSph) {
      newErrors.osSph = "Required";
    } else if (isNaN(parseFloat(prescription.osSph))) {
      newErrors.osSph = "Must be a number";
    }

    if (prescription.odCyl && isNaN(parseFloat(prescription.odCyl))) {
      newErrors.odCyl = "Must be a number";
    }

    if (prescription.osCyl && isNaN(parseFloat(prescription.osCyl))) {
      newErrors.osCyl = "Must be a number";
    }

    if (prescription.odAxis && (isNaN(parseInt(prescription.odAxis)) || parseInt(prescription.odAxis) < 0 || parseInt(prescription.odAxis) > 180)) {
      newErrors.odAxis = "Must be 0-180";
    }

    if (prescription.osAxis && (isNaN(parseInt(prescription.osAxis)) || parseInt(prescription.osAxis) < 0 || parseInt(prescription.osAxis) > 180)) {
      newErrors.osAxis = "Must be 0-180";
    }

    if (!prescription.pd) {
      newErrors.pd = "Required";
    } else if (isNaN(parseFloat(prescription.pd))) {
      newErrors.pd = "Must be a number";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (currentStep === 1 && !lensType) {
      return;
    }

    if (currentStep === 2 && !validatePrescription()) {
      return;
    }

    if (currentStep === 3 && !lensPackage) {
      return;
    }

    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
    } else {
      // Add to cart with prescription
      const lensTypeName =
        lensType === "single"
          ? "Đơn Tròng"
          : lensType === "bluelight"
          ? "Chống Ánh Sáng Xanh"
          : "Đa Tròng";

      const lensPackageName =
        lensPackage === "basic"
          ? "Gói Cơ Bản"
          : lensPackage === "premium"
          ? "Gói Cao Cấp"
          : "Gói Siêu Mỏng";

      const lensPrice =
        lensPackage === "premium" ? 79 : lensPackage === "ultra" ? 129 : 29;

      addItem({
        id: `prescription-${productId}-${Date.now()}`,
        productId: productId || "1",
        name: "Gọng Chữ Nhật Cổ Điển",
        image: "https://images.unsplash.com/photo-1626104853817-343b24b5613f?w=200",
        color: "Đen",
        quantity: 1,
        framePrice: 79,
        hasPrescription: true,
        lensType: lensTypeName,
        lensPackage: lensPackageName,
        lensPrice: lensPrice,
        prescription: {
          rightEye: {
            sph: prescription.odSph,
            cyl: prescription.odCyl,
            axis: prescription.odAxis,
          },
          leftEye: {
            sph: prescription.osSph,
            cyl: prescription.osCyl,
            axis: prescription.osAxis,
          },
          pd: prescription.pd,
        },
      });

      navigate("/cart");
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const goToStep = (step: number) => {
    setCurrentStep(step);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-center mb-12">Tùy Chỉnh Tròng Kính</h1>
      <StepProgress steps={steps} currentStep={currentStep} />

      {currentStep === 1 && (
        <div className="max-w-3xl mx-auto">
          <h2 className="mb-3 text-center">Chọn Loại Tròng Kính</h2>
          <p className="text-center text-muted-foreground mb-8">Chọn loại tròng kính phù hợp với nhu cầu thị lực của bạn</p>
          <div className="grid md:grid-cols-3 gap-4">
            {[
              {
                value: "single",
                name: "Đơn Tròng",
                desc: "Cho cận thị hoặc viễn thị",
                icon: Eye,
                popular: false
              },
              {
                value: "bluelight",
                name: "Chống Ánh Sáng Xanh",
                desc: "Bảo vệ mắt khi dùng màn hình",
                icon: Shield,
                popular: true
              },
              {
              value: "progressive",
                name: "Đa Tròng",
                desc: "Đa tiêu cự chuyển tiếp mượt mà",
                icon: Sparkles,
                popular: false
              },
            ].map((type) => (
              <button
                key={type.value}
                onClick={() => setLensType(type.value)}
                className={`relative p-6 rounded-xl border-2 text-left transition-all hover:shadow-lg ${
                  lensType === type.value
                    ? "border-primary bg-primary/5 shadow-md"
                    : "border-border hover:border-primary/50"
                }`}
              >
                {type.popular && (
                  <span className="absolute -top-2 -right-2 bg-accent text-white text-xs px-3 py-1 rounded-full">
                    Phổ biến
                  </span>
                )}
                <div className="flex flex-col items-center text-center">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-4 ${
                    lensType === type.value ? "bg-primary text-white" : "bg-secondary text-primary"
                  }`}>
                    <type.icon className="w-6 h-6" />
                  </div>
                  <p className="mb-2">{type.name}</p>
                  <p className="text-sm text-muted-foreground leading-relaxed">{type.desc}</p>
                  {lensType === type.value && (
                    <Check className="w-6 h-6 text-primary mt-4" />
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {currentStep === 2 && (
        <div className="max-w-4xl mx-auto">
          <h2 className="mb-3 text-center">Nhập Đơn Kính Của Bạn</h2>
          <p className="text-center text-muted-foreground mb-8">
            Sao chép các giá trị từ đơn kính của bạn chính xác như trên đơn
          </p>

          <div className="bg-secondary p-8 rounded-xl">
            <div className="grid grid-cols-4 gap-4 mb-4">
              <div></div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 mb-2">
                  <span className="text-sm">SPH</span>
                  <div className="group relative">
                    <HelpCircle className="w-4 h-4 text-muted-foreground cursor-help" />
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block w-64 p-3 bg-foreground text-background text-xs rounded-lg shadow-lg z-10">
                      <p className="mb-1">Cầu (SPH)</p>
                      <p>Chỉ định cận (-) hoặc viễn (+). Trường bắt buộc.</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 mb-2">
                  <span className="text-sm">CYL</span>
                  <div className="group relative">
                    <HelpCircle className="w-4 h-4 text-muted-foreground cursor-help" />
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block w-64 p-3 bg-foreground text-background text-xs rounded-lg shadow-lg z-10">
                      <p className="mb-1">Trụ (CYL)</p>
                      <p>Đo loạn thị. Để trống nếu không có.</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 mb-2">
                  <span className="text-sm">AXIS</span>
                  <div className="group relative">
                    <HelpCircle className="w-4 h-4 text-muted-foreground cursor-help" />
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block w-64 p-3 bg-foreground text-background text-xs rounded-lg shadow-lg z-10">
                      <p className="mb-1">Trục</p>
                      <p>Hướng loạn thị (0-180). Chỉ cần nếu có CYL.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-4 mb-4">
              <div className="flex items-center">
                <span className="text-sm">OD (Mắt phải)</span>
              </div>
              <div>
                <input
                  type="text"
                  placeholder="0.00"
                  value={prescription.odSph}
                  onChange={(e) => {
                    setPrescription({ ...prescription, odSph: e.target.value });
                    setErrors({ ...errors, odSph: undefined });
                  }}
                  className={`w-full px-4 py-3 bg-white border rounded-lg focus:outline-none focus:border-primary text-center ${
                    errors.odSph ? "border-destructive" : "border-border"
                  }`}
                />
                {errors.odSph && (
                  <p className="text-xs text-destructive mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {errors.odSph}
                  </p>
                )}
              </div>
              <div>
                <input
                  type="text"
                  placeholder="0.00"
                  value={prescription.odCyl}
                  onChange={(e) => {
                    setPrescription({ ...prescription, odCyl: e.target.value });
                    setErrors({ ...errors, odCyl: undefined });
                  }}
                  className={`w-full px-4 py-3 bg-white border rounded-lg focus:outline-none focus:border-primary text-center ${
                    errors.odCyl ? "border-destructive" : "border-border"
                  }`}
                />
                {errors.odCyl && (
                  <p className="text-xs text-destructive mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {errors.odCyl}
                  </p>
                )}
              </div>
              <div>
                <input
                  type="text"
                  placeholder="0"
                  value={prescription.odAxis}
                  onChange={(e) => {
                    setPrescription({ ...prescription, odAxis: e.target.value });
                    setErrors({ ...errors, odAxis: undefined });
                  }}
                  className={`w-full px-4 py-3 bg-white border rounded-lg focus:outline-none focus:border-primary text-center ${
                    errors.odAxis ? "border-destructive" : "border-border"
                  }`}
                />
                {errors.odAxis && (
                  <p className="text-xs text-destructive mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {errors.odAxis}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-4 gap-4 mb-6">
              <div className="flex items-center">
                <span className="text-sm">OS (Mắt trái)</span>
              </div>
              <div>
                <input
                  type="text"
                  placeholder="0.00"
                  value={prescription.osSph}
                  onChange={(e) => {
                    setPrescription({ ...prescription, osSph: e.target.value });
                    setErrors({ ...errors, osSph: undefined });
                  }}
                  className={`w-full px-4 py-3 bg-white border rounded-lg focus:outline-none focus:border-primary text-center ${
                    errors.osSph ? "border-destructive" : "border-border"
                  }`}
                />
                {errors.osSph && (
                  <p className="text-xs text-destructive mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {errors.osSph}
                  </p>
                )}
              </div>
              <div>
                <input
                  type="text"
                  placeholder="0.00"
                  value={prescription.osCyl}
                  onChange={(e) => {
                    setPrescription({ ...prescription, osCyl: e.target.value });
                    setErrors({ ...errors, osCyl: undefined });
                  }}
                  className={`w-full px-4 py-3 bg-white border rounded-lg focus:outline-none focus:border-primary text-center ${
                    errors.osCyl ? "border-destructive" : "border-border"
                  }`}
                />
                {errors.osCyl && (
                  <p className="text-xs text-destructive mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {errors.osCyl}
                  </p>
                )}
              </div>
              <div>
                <input
                  type="text"
                  placeholder="0"
                  value={prescription.osAxis}
                  onChange={(e) => {
                    setPrescription({ ...prescription, osAxis: e.target.value });
                    setErrors({ ...errors, osAxis: undefined });
                  }}
                  className={`w-full px-4 py-3 bg-white border rounded-lg focus:outline-none focus:border-primary text-center ${
                    errors.osAxis ? "border-destructive" : "border-border"
                  }`}
                />
                {errors.osAxis && (
                  <p className="text-xs text-destructive mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {errors.osAxis}
                  </p>
                )}
              </div>
            </div>

            <div className="border-t border-border pt-6">
              <div className="max-w-xs">
                <div className="flex items-center gap-1 mb-2">
                  <label className="text-sm">Khoảng Cách Đồng Tử (PD)</label>
                  <div className="group relative">
                    <HelpCircle className="w-4 h-4 text-muted-foreground cursor-help" />
                    <div className="absolute bottom-full left-0 mb-2 hidden group-hover:block w-64 p-3 bg-foreground text-background text-xs rounded-lg shadow-lg z-10">
                      <p className="mb-1">Khoảng Cách Đồng Tử</p>
                      <p>Khoảng cách giữa hai đồng tử tính bằng mm. Thường là 54-74mm ở người lớn.</p>
                    </div>
                  </div>
                </div>
                <input
                  type="text"
                  placeholder="63"
                  value={prescription.pd}
                  onChange={(e) => {
                    setPrescription({ ...prescription, pd: e.target.value });
                    setErrors({ ...errors, pd: undefined });
                  }}
                  className={`w-full px-4 py-3 bg-white border rounded-lg focus:outline-none focus:border-primary ${
                    errors.pd ? "border-destructive" : "border-border"
                  }`}
                />
                {errors.pd && (
                  <p className="text-xs text-destructive mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {errors.pd}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-900">
              <strong>Cần hỗ trợ?</strong> Giá trị đơn kính có thể tìm thấy trên giấy đơn kính hoặc liên hệ bác sĩ nhãn khoa của bạn.
            </p>
          </div>
        </div>
      )}

      {currentStep === 3 && (
        <div className="max-w-3xl mx-auto">
          <h2 className="mb-3 text-center">Chọn Gói Tròng Kính</h2>
          <p className="text-center text-muted-foreground mb-8">Chọn các tính năng phù hợp nhất với lối sống của bạn</p>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                value: "basic",
                name: "Cơ Bản",
                price: 29,
                recommended: false,
                features: ["Tròng nhựa CR-39", "Chống trầy xước cơ bản", "Chống tia UV"],
              },
              {
                value: "premium",
                name: "Cao Cấp",
                price: 79,
                recommended: true,
                features: ["Tròng cận cao 1.67", "Phủ chống phản quang", "Chống trầy xước tốt", "Lọc ánh sáng xanh"],
              },
              {
                value: "ultra",
                name: "Siêu Mỏng",
                price: 129,
                recommended: false,
                features: ["Tròng siêu mỏng 1.74", "Phủ chống phản quang cao cấp", "Chống trầy xước vượt trội", "Lọc ánh sáng xanh", "Chống bám bẩn"],
              },
            ].map((pkg) => (
              <button
                key={pkg.value}
                onClick={() => setLensPackage(pkg.value)}
                className={`relative p-6 rounded-xl border-2 text-left transition-all hover:shadow-lg ${
                  lensPackage === pkg.value
                    ? "border-primary bg-primary/5 shadow-md"
                    : "border-border hover:border-primary/50"
                } ${pkg.recommended ? "ring-2 ring-accent ring-offset-2" : ""}`}
              >
                {pkg.recommended && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-accent text-white text-xs px-4 py-1 rounded-full">
                    Khuyên dùng
                  </span>
                )}
                <div className="mb-4">
                  <p className="mb-2">{pkg.name}</p>
                  <p className="text-3xl text-primary">+${pkg.price}</p>
                </div>
                <ul className="space-y-2 mb-4">
                  {pkg.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-foreground/80">
                      <Check className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                      {feature}
                    </li>
                  ))}
                </ul>
                {lensPackage === pkg.value && (
                  <div className="pt-4 border-t border-border flex items-center justify-center gap-2 text-primary">
                    <Check className="w-5 h-5" />
                    <span className="text-sm">Đã chọn</span>
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {currentStep === 4 && (
        <div className="max-w-3xl mx-auto">
          <h2 className="mb-3 text-center">Xem Lại Đơn Hàng</h2>
          <p className="text-center text-muted-foreground mb-8">Vui lòng kiểm tra tất cả thông tin trước khi thêm vào giỏ</p>
          <div className="bg-white border-2 border-border rounded-xl overflow-hidden">
            <div className="p-6 border-b border-border">
              <div className="flex items-start justify-between">
                <div className="flex gap-4 flex-1">
                  <img
                    src="https://images.unsplash.com/photo-1626104853817-343b24b5613f?w=120"
                    alt="Frame"
                    className="w-20 h-20 object-cover rounded-lg"
                  />
                  <div className="flex-1">
                    <h3 className="mb-1">Gọng Chữ Nhật Cổ Điển</h3>
                    <p className="text-sm text-muted-foreground mb-2">Đen</p>
                    <p className="text-primary">$79.00</p>
                  </div>
                </div>
                <button
                  onClick={() => navigate(`/product/${productId}`)}
                  className="text-primary hover:underline text-sm flex items-center gap-1"
                >
                  <Edit2 className="w-4 h-4" />
                  Thay đổi
                </button>
              </div>
            </div>

            <div className="p-6 border-b border-border bg-secondary/30">
              <div className="flex items-start justify-between mb-3">
                <h3>Loại Tròng</h3>
                <button
                  onClick={() => goToStep(1)}
                  className="text-primary hover:underline text-sm flex items-center gap-1"
                >
                  <Edit2 className="w-4 h-4" />
                  Sửa
                </button>
              </div>
              <p className="text-foreground/80 capitalize">
                {lensType === "single" ? "Đơn Tròng" : lensType === "bluelight" ? "Chống Ánh Sáng Xanh" : lensType === "progressive" ? "Đa Tròng" : "Chưa chọn"}
              </p>
            </div>

            <div className="p-6 border-b border-border">
              <div className="flex items-start justify-between mb-3">
                <h3>Chi Tiết Đơn Kính</h3>
                <button
                  onClick={() => goToStep(2)}
                  className="text-primary hover:underline text-sm flex items-center gap-1"
                >
                  <Edit2 className="w-4 h-4" />
                  Sửa
                </button>
              </div>
              <div className="bg-secondary p-4 rounded-lg space-y-2 text-sm">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-muted-foreground mb-1">Mắt Phải (OD)</p>
                    <p>SPH: {prescription.odSph || "—"}</p>
                    <p>CYL: {prescription.odCyl || "—"}</p>
                    <p>AXIS: {prescription.odAxis || "—"}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground mb-1">Mắt Trái (OS)</p>
                    <p>SPH: {prescription.osSph || "—"}</p>
                    <p>CYL: {prescription.osCyl || "—"}</p>
                    <p>AXIS: {prescription.osAxis || "—"}</p>
                  </div>
                </div>
                <div className="border-t border-border pt-2">
                  <p>Khoảng Cách Đồng Tử: {prescription.pd || "—"} mm</p>
                </div>
              </div>
            </div>

            <div className="p-6 border-b border-border bg-secondary/30">
              <div className="flex items-start justify-between mb-3">
                <h3>Gói Tròng Kính</h3>
                <button
                  onClick={() => goToStep(3)}
                  className="text-primary hover:underline text-sm flex items-center gap-1"
                >
                  <Edit2 className="w-4 h-4" />
                  Sửa
                </button>
              </div>
              <div className="flex items-center justify-between">
                <p className="text-foreground/80 capitalize">
                  {lensPackage === "basic" ? "Gói Cơ Bản" : lensPackage === "premium" ? "Gói Cao Cấp" : lensPackage === "ultra" ? "Gói Siêu Mỏng" : "Chưa chọn"}
                </p>
                <p className="text-primary">
                  +${lensPackage === "premium" ? "79" : lensPackage === "ultra" ? "129" : lensPackage === "basic" ? "29" : "0"}.00
                </p>
              </div>
            </div>

            <div className="p-6 bg-primary/5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground mb-1">Tổng Tiền</p>
                  <p className="text-3xl text-primary">
                    ${79 + (lensPackage === "premium" ? 79 : lensPackage === "ultra" ? 129 : lensPackage === "basic" ? 29 : 0)}.00
                  </p>
                </div>
                <div className="text-right text-sm text-muted-foreground">
                  <p>Miễn phí vận chuyển</p>
                  <p>Đổi trả trong 30 ngày</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between max-w-3xl mx-auto mt-12">
        <button
          onClick={handleBack}
          disabled={currentStep === 1}
          className="px-6 py-3 border border-border rounded hover:bg-secondary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Quay lại
        </button>
        <button
          onClick={handleNext}
          disabled={
            (currentStep === 1 && !lensType) ||
            (currentStep === 3 && !lensPackage)
          }
          className="px-8 py-3 bg-primary text-white rounded hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {currentStep === 4 ? "Thêm vào giỏ" : "Tiếp tục"}
        </button>
      </div>
    </div>
  );
}
