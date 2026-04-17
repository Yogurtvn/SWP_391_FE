import { useState } from "react";
import { useNavigate } from "react-router";
import { Check, AlertCircle, Package, Sparkles } from "lucide-react";
import StepProgress from "@/components/common/StepProgress";
const steps = [
  { number: 1, label: "Th\xF4ng tin \u0111\u01A1n k\xEDnh" },
  { number: 2, label: "Y\xEAu c\u1EA7u k\xEDnh" },
  { number: 3, label: "Xem l\u1EA1i" }
];
function PreOrderPage() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [prescription, setPrescription] = useState({
    odSph: "",
    odCyl: "",
    odAxis: "",
    osSph: "",
    osCyl: "",
    osAxis: "",
    pd: ""
  });
  const [errors, setErrors] = useState({});
  const [preferences, setPreferences] = useState({
    shape: [],
    color: [],
    material: [],
    frameType: "",
    notes: ""
  });
  const shapes = ["Ch\u1EEF nh\u1EADt", "Tr\xF2n", "M\u1EAFt m\xE8o", "Aviator", "Vu\xF4ng", "Oval"];
  const colors = ["\u0110en", "N\xE2u", "Xanh", "\u0110\u1ECF", "Trong su\u1ED1t", "V\xE0ng kim"];
  const materials = ["Acetate", "Kim lo\u1EA1i", "Titanium", "Nh\u1EF1a TR90", "G\u1ED7"];
  const frameTypes = [
    { value: "full", label: "G\u1ECDng \u0111\u1EA7y \u0111\u1EE7" },
    { value: "semi", label: "G\u1ECDng n\u1EEDa vi\u1EC1n" },
    { value: "rimless", label: "Kh\xF4ng g\u1ECDng" }
  ];
  const validatePrescription = () => {
    const newErrors = {};
    if (!prescription.odSph) {
      newErrors.odSph = "B\u1EAFt bu\u1ED9c";
    } else if (isNaN(parseFloat(prescription.odSph))) {
      newErrors.odSph = "Ph\u1EA3i l\xE0 s\u1ED1";
    }
    if (!prescription.osSph) {
      newErrors.osSph = "B\u1EAFt bu\u1ED9c";
    } else if (isNaN(parseFloat(prescription.osSph))) {
      newErrors.osSph = "Ph\u1EA3i l\xE0 s\u1ED1";
    }
    if (prescription.odCyl && isNaN(parseFloat(prescription.odCyl))) {
      newErrors.odCyl = "Ph\u1EA3i l\xE0 s\u1ED1";
    }
    if (prescription.osCyl && isNaN(parseFloat(prescription.osCyl))) {
      newErrors.osCyl = "Ph\u1EA3i l\xE0 s\u1ED1";
    }
    if (prescription.odAxis && (isNaN(parseInt(prescription.odAxis)) || parseInt(prescription.odAxis) < 0 || parseInt(prescription.odAxis) > 180)) {
      newErrors.odAxis = "Ph\u1EA3i t\u1EEB 0-180";
    }
    if (prescription.osAxis && (isNaN(parseInt(prescription.osAxis)) || parseInt(prescription.osAxis) < 0 || parseInt(prescription.osAxis) > 180)) {
      newErrors.osAxis = "Ph\u1EA3i t\u1EEB 0-180";
    }
    if (!prescription.pd) {
      newErrors.pd = "B\u1EAFt bu\u1ED9c";
    } else if (isNaN(parseFloat(prescription.pd))) {
      newErrors.pd = "Ph\u1EA3i l\xE0 s\u1ED1";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  const handleNext = () => {
    if (currentStep === 1 && !validatePrescription()) {
      return;
    }
    if (currentStep === 2) {
      if (preferences.shape.length === 0) {
        return;
      }
    }
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    } else {
      const preOrder = {
        id: `pre-${Date.now()}`,
        prescription,
        preferences,
        status: "Ch\u1EDD x\u1EED l\xFD",
        createdAt: (/* @__PURE__ */ new Date()).toISOString()
      };
      const existingPreOrders = JSON.parse(localStorage.getItem("preOrders") || "[]");
      existingPreOrders.push(preOrder);
      localStorage.setItem("preOrders", JSON.stringify(existingPreOrders));
      navigate("/profile/pre-orders");
    }
  };
  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };
  const toggleSelection = (array, value, setter) => {
    if (array.includes(value)) {
      setter(array.filter((item) => item !== value));
    } else {
      setter([...array, value]);
    }
  };
  return <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-4">
          <Package className="w-8 h-8 text-primary" />
        </div>
        <h1 className="mb-3">Đặt Trước Kính Theo Yêu Cầu</h1>
        <p className="text-muted-foreground">
          Không tìm thấy kính phù hợp? Đặt trước kính theo đơn và yêu cầu của bạn
        </p>
      </div>

      <StepProgress steps={steps} currentStep={currentStep} />

      {currentStep === 1 && <div className="max-w-4xl mx-auto">
          <h2 className="mb-3 text-center">Thông Tin Đơn Kính</h2>
          <p className="text-center text-muted-foreground mb-8">
            Nhập đầy đủ thông số từ đơn kính của bạn
          </p>

          <div className="bg-secondary p-8 rounded-xl">
            <div className="grid grid-cols-4 gap-4 mb-4">
              <div />
              <div className="text-center text-sm">SPH</div>
              <div className="text-center text-sm">CYL</div>
              <div className="text-center text-sm">AXIS</div>
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
      setErrors({ ...errors, odSph: void 0 });
    }}
    className={`w-full px-4 py-3 bg-white border rounded-lg focus:outline-none focus:border-primary text-center ${errors.odSph ? "border-destructive" : "border-border"}`}
  />
                {errors.odSph && <p className="text-xs text-destructive mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {errors.odSph}
                  </p>}
              </div>
              <div>
                <input
    type="text"
    placeholder="0.00"
    value={prescription.odCyl}
    onChange={(e) => {
      setPrescription({ ...prescription, odCyl: e.target.value });
      setErrors({ ...errors, odCyl: void 0 });
    }}
    className={`w-full px-4 py-3 bg-white border rounded-lg focus:outline-none focus:border-primary text-center ${errors.odCyl ? "border-destructive" : "border-border"}`}
  />
              </div>
              <div>
                <input
    type="text"
    placeholder="0"
    value={prescription.odAxis}
    onChange={(e) => {
      setPrescription({ ...prescription, odAxis: e.target.value });
      setErrors({ ...errors, odAxis: void 0 });
    }}
    className={`w-full px-4 py-3 bg-white border rounded-lg focus:outline-none focus:border-primary text-center ${errors.odAxis ? "border-destructive" : "border-border"}`}
  />
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
      setErrors({ ...errors, osSph: void 0 });
    }}
    className={`w-full px-4 py-3 bg-white border rounded-lg focus:outline-none focus:border-primary text-center ${errors.osSph ? "border-destructive" : "border-border"}`}
  />
                {errors.osSph && <p className="text-xs text-destructive mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {errors.osSph}
                  </p>}
              </div>
              <div>
                <input
    type="text"
    placeholder="0.00"
    value={prescription.osCyl}
    onChange={(e) => {
      setPrescription({ ...prescription, osCyl: e.target.value });
      setErrors({ ...errors, osCyl: void 0 });
    }}
    className={`w-full px-4 py-3 bg-white border rounded-lg focus:outline-none focus:border-primary text-center ${errors.osCyl ? "border-destructive" : "border-border"}`}
  />
              </div>
              <div>
                <input
    type="text"
    placeholder="0"
    value={prescription.osAxis}
    onChange={(e) => {
      setPrescription({ ...prescription, osAxis: e.target.value });
      setErrors({ ...errors, osAxis: void 0 });
    }}
    className={`w-full px-4 py-3 bg-white border rounded-lg focus:outline-none focus:border-primary text-center ${errors.osAxis ? "border-destructive" : "border-border"}`}
  />
              </div>
            </div>

            <div className="border-t border-border pt-6">
              <div className="max-w-xs">
                <label className="text-sm mb-2 block">Khoảng Cách Đồng Tử (PD)</label>
                <input
    type="text"
    placeholder="63"
    value={prescription.pd}
    onChange={(e) => {
      setPrescription({ ...prescription, pd: e.target.value });
      setErrors({ ...errors, pd: void 0 });
    }}
    className={`w-full px-4 py-3 bg-white border rounded-lg focus:outline-none focus:border-primary ${errors.pd ? "border-destructive" : "border-border"}`}
  />
                {errors.pd && <p className="text-xs text-destructive mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {errors.pd}
                  </p>}
              </div>
            </div>
          </div>
        </div>}

      {currentStep === 2 && <div className="max-w-4xl mx-auto">
          <h2 className="mb-3 text-center">Yêu Cầu Về Kính</h2>
          <p className="text-center text-muted-foreground mb-8">
            Chọn các đặc điểm kính bạn mong muốn
          </p>

          <div className="space-y-8">
            <div>
              <label className="block mb-4">
                Hình dạng gọng <span className="text-destructive">*</span>
              </label>
              <div className="grid grid-cols-3 gap-3">
                {shapes.map((shape) => <button
    key={shape}
    onClick={() => toggleSelection(
      preferences.shape,
      shape,
      (arr) => setPreferences({ ...preferences, shape: arr })
    )}
    className={`p-4 border-2 rounded-lg transition-all ${preferences.shape.includes(shape) ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"}`}
  >
                    {preferences.shape.includes(shape) && <Check className="w-5 h-5 text-primary mb-2" />}
                    <p className="text-sm">{shape}</p>
                  </button>)}
              </div>
            </div>

            <div>
              <label className="block mb-4">Màu sắc ưa thích</label>
              <div className="grid grid-cols-3 gap-3">
                {colors.map((color) => <button
    key={color}
    onClick={() => toggleSelection(
      preferences.color,
      color,
      (arr) => setPreferences({ ...preferences, color: arr })
    )}
    className={`p-4 border-2 rounded-lg transition-all ${preferences.color.includes(color) ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"}`}
  >
                    {preferences.color.includes(color) && <Check className="w-5 h-5 text-primary mb-2" />}
                    <p className="text-sm">{color}</p>
                  </button>)}
              </div>
            </div>

            <div>
              <label className="block mb-4">Chất liệu</label>
              <div className="grid grid-cols-3 gap-3">
                {materials.map((material) => <button
    key={material}
    onClick={() => toggleSelection(
      preferences.material,
      material,
      (arr) => setPreferences({ ...preferences, material: arr })
    )}
    className={`p-4 border-2 rounded-lg transition-all ${preferences.material.includes(material) ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"}`}
  >
                    {preferences.material.includes(material) && <Check className="w-5 h-5 text-primary mb-2" />}
                    <p className="text-sm">{material}</p>
                  </button>)}
              </div>
            </div>

            <div>
              <label className="block mb-4">Loại viền</label>
              <div className="grid grid-cols-3 gap-3">
                {frameTypes.map((type) => <button
    key={type.value}
    onClick={() => setPreferences({ ...preferences, frameType: type.value })}
    className={`p-4 border-2 rounded-lg transition-all ${preferences.frameType === type.value ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"}`}
  >
                    {preferences.frameType === type.value && <Check className="w-5 h-5 text-primary mb-2" />}
                    <p className="text-sm">{type.label}</p>
                  </button>)}
              </div>
            </div>

            <div>
              <label className="block mb-3">Ghi chú thêm (không bắt buộc)</label>
              <textarea
    value={preferences.notes}
    onChange={(e) => setPreferences({ ...preferences, notes: e.target.value })}
    placeholder="Nhập các yêu cầu đặc biệt của bạn..."
    rows={4}
    className="w-full px-4 py-3 bg-white border border-border rounded-lg focus:outline-none focus:border-primary"
  />
            </div>
          </div>
        </div>}

      {currentStep === 3 && <div className="max-w-3xl mx-auto">
          <h2 className="mb-3 text-center">Xem Lại Yêu Cầu</h2>
          <p className="text-center text-muted-foreground mb-8">
            Kiểm tra lại thông tin trước khi gửi yêu cầu
          </p>

          <div className="bg-white border-2 border-border rounded-xl overflow-hidden">
            <div className="p-6 border-b border-border bg-secondary/30">
              <h3 className="mb-4">Thông Tin Đơn Kính</h3>
              <div className="bg-white p-4 rounded-lg space-y-2 text-sm">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-muted-foreground mb-1">Mắt Phải (OD)</p>
                    <p>SPH: {prescription.odSph || "\u2014"}</p>
                    <p>CYL: {prescription.odCyl || "\u2014"}</p>
                    <p>AXIS: {prescription.odAxis || "\u2014"}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground mb-1">Mắt Trái (OS)</p>
                    <p>SPH: {prescription.osSph || "\u2014"}</p>
                    <p>CYL: {prescription.osCyl || "\u2014"}</p>
                    <p>AXIS: {prescription.osAxis || "\u2014"}</p>
                  </div>
                </div>
                <div className="border-t border-border pt-2">
                  <p>Khoảng Cách Đồng Tử: {prescription.pd || "\u2014"} mm</p>
                </div>
              </div>
            </div>

            <div className="p-6 border-b border-border">
              <h3 className="mb-4">Yêu Cầu Về Kính</h3>
              <div className="space-y-3 text-sm">
                <div>
                  <p className="text-muted-foreground mb-1">Hình dạng:</p>
                  <p>{preferences.shape.join(", ") || "Ch\u01B0a ch\u1ECDn"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground mb-1">Màu sắc:</p>
                  <p>{preferences.color.join(", ") || "Kh\xF4ng c\xF3"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground mb-1">Chất liệu:</p>
                  <p>{preferences.material.join(", ") || "Kh\xF4ng c\xF3"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground mb-1">Loại viền:</p>
                  <p>
                    {preferences.frameType === "full" ? "G\u1ECDng \u0111\u1EA7y \u0111\u1EE7" : preferences.frameType === "semi" ? "G\u1ECDng n\u1EEDa vi\u1EC1n" : preferences.frameType === "rimless" ? "Kh\xF4ng g\u1ECDng" : "Kh\xF4ng c\xF3"}
                  </p>
                </div>
                {preferences.notes && <div>
                    <p className="text-muted-foreground mb-1">Ghi chú:</p>
                    <p>{preferences.notes}</p>
                  </div>}
              </div>
            </div>

            <div className="p-6 bg-blue-50 border-t-4 border-blue-400">
              <div className="flex gap-3">
                <Sparkles className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                <div className="text-sm text-blue-900">
                  <p className="mb-2">
                    <strong>Lưu ý:</strong> Sau khi gửi yêu cầu, chúng tôi sẽ tìm kiếm các mẫu
                    kính phù hợp và liên hệ với bạn trong vòng 2-3 ngày làm việc.
                  </p>
                  <p>
                    Bạn có thể theo dõi trạng thái yêu cầu tại trang{" "}
                    <strong>Tài khoản &gt; Pre-orders</strong>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>}

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
    disabled={currentStep === 2 && preferences.shape.length === 0}
    className="px-8 py-3 bg-primary text-white rounded hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
  >
          {currentStep === 3 ? "G\u1EEDi y\xEAu c\u1EA7u" : "Ti\u1EBFp t\u1EE5c"}
        </button>
      </div>
    </div>;
}
export {
  PreOrderPage as default
};
