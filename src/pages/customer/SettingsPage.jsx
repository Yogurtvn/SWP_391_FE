import { useState } from "react";
import { Bell, Lock, User, Globe } from "lucide-react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
function SettingsPage() {
  const navigate = useNavigate();
  const [settings, setSettings] = useState({
    emailNotifications: true,
    smsNotifications: false,
    orderUpdates: true,
    promotions: true,
    language: "vi",
    currency: "VND"
  });
  const handleSave = () => {
    toast.success("\u0110\xE3 l\u01B0u c\xE0i \u0111\u1EB7t!");
  };
  return <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {
    /* Header */
  }
        <div className="mb-8">
          <h1 className="text-3xl mb-2">Cài Đặt</h1>
          <p className="text-muted-foreground">
            Quản lý thông tin tài khoản và tùy chỉnh trải nghiệm của bạn
          </p>
        </div>

        <div className="space-y-6">
          {
    /* Account Settings */
  }
          <div className="bg-white border border-border rounded-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <User className="w-5 h-5 text-primary" />
              <h2 className="text-xl">Thông Tin Tài Khoản</h2>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm mb-2">Email</label>
                <input
    type="email"
    value={localStorage.getItem("userEmail") || ""}
    disabled
    className="w-full px-4 py-2 bg-secondary border border-border rounded-lg"
  />
              </div>
              <div>
                <label className="block text-sm mb-2">Số điện thoại</label>
                <input
    type="tel"
    placeholder="Chưa cập nhật"
    className="w-full px-4 py-2 bg-white border border-border rounded-lg focus:outline-none focus:border-primary"
  />
              </div>
            </div>
          </div>

          {
    /* Notifications */
  }
          <div className="bg-white border border-border rounded-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <Bell className="w-5 h-5 text-primary" />
              <h2 className="text-xl">Thông Báo</h2>
            </div>
            <div className="space-y-4">
              <label className="flex items-center justify-between cursor-pointer">
                <div>
                  <p className="font-medium">Thông báo qua Email</p>
                  <p className="text-sm text-muted-foreground">Nhận thông báo đơn hàng qua email</p>
                </div>
                <input
    type="checkbox"
    checked={settings.emailNotifications}
    onChange={(e) => setSettings({ ...settings, emailNotifications: e.target.checked })}
    className="w-5 h-5 rounded border-border text-primary focus:ring-primary"
  />
              </label>
              <label className="flex items-center justify-between cursor-pointer">
                <div>
                  <p className="font-medium">Thông báo qua SMS</p>
                  <p className="text-sm text-muted-foreground">Nhận thông báo đơn hàng qua SMS</p>
                </div>
                <input
    type="checkbox"
    checked={settings.smsNotifications}
    onChange={(e) => setSettings({ ...settings, smsNotifications: e.target.checked })}
    className="w-5 h-5 rounded border-border text-primary focus:ring-primary"
  />
              </label>
              <label className="flex items-center justify-between cursor-pointer">
                <div>
                  <p className="font-medium">Cập nhật đơn hàng</p>
                  <p className="text-sm text-muted-foreground">Nhận thông báo về trạng thái đơn hàng</p>
                </div>
                <input
    type="checkbox"
    checked={settings.orderUpdates}
    onChange={(e) => setSettings({ ...settings, orderUpdates: e.target.checked })}
    className="w-5 h-5 rounded border-border text-primary focus:ring-primary"
  />
              </label>
              <label className="flex items-center justify-between cursor-pointer">
                <div>
                  <p className="font-medium">Khuyến mãi & Ưu đãi</p>
                  <p className="text-sm text-muted-foreground">Nhận thông báo về các chương trình khuyến mãi</p>
                </div>
                <input
    type="checkbox"
    checked={settings.promotions}
    onChange={(e) => setSettings({ ...settings, promotions: e.target.checked })}
    className="w-5 h-5 rounded border-border text-primary focus:ring-primary"
  />
              </label>
            </div>
          </div>

          {
    /* Security */
  }
          <div className="bg-white border border-border rounded-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <Lock className="w-5 h-5 text-primary" />
              <h2 className="text-xl">Bảo Mật</h2>
            </div>
            <div className="space-y-4">
              <button className="w-full px-4 py-3 bg-white border border-border rounded-lg hover:bg-secondary transition-colors text-left">
                Đổi mật khẩu
              </button>
              <button className="w-full px-4 py-3 bg-white border border-border rounded-lg hover:bg-secondary transition-colors text-left">
                Xác thực hai yếu tố (2FA)
              </button>
            </div>
          </div>

          {
    /* Language & Currency */
  }
          <div className="bg-white border border-border rounded-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <Globe className="w-5 h-5 text-primary" />
              <h2 className="text-xl">Ngôn Ngữ & Tiền Tệ</h2>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm mb-2">Ngôn ngữ</label>
                <select
    value={settings.language}
    onChange={(e) => setSettings({ ...settings, language: e.target.value })}
    className="w-full px-4 py-2 bg-white border border-border rounded-lg focus:outline-none focus:border-primary"
  >
                  <option value="vi">Tiếng Việt</option>
                  <option value="en">English</option>
                </select>
              </div>
              <div>
                <label className="block text-sm mb-2">Đơn vị tiền tệ</label>
                <select
    value={settings.currency}
    onChange={(e) => setSettings({ ...settings, currency: e.target.value })}
    className="w-full px-4 py-2 bg-white border border-border rounded-lg focus:outline-none focus:border-primary"
  >
                  <option value="VND">VND (₫)</option>
                  <option value="USD">USD ($)</option>
                </select>
              </div>
            </div>
          </div>

          {
    /* Save Button */
  }
          <div className="flex gap-4">
            <button
    onClick={handleSave}
    className="flex-1 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
  >
              Lưu Thay Đổi
            </button>
            <button
    onClick={() => navigate(-1)}
    className="px-6 py-3 border border-border rounded-lg hover:bg-secondary transition-colors"
  >
              Hủy
            </button>
          </div>
        </div>
      </div>
    </div>;
}
export {
  SettingsPage as default
};
