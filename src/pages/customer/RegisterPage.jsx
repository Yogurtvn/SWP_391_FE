import { AlertCircle, Eye, EyeOff, Lock, Mail, Phone, User, UserPlus } from "lucide-react";
import { useRegisterPage } from "@/hooks/auth/useRegisterPage";

export default function RegisterPage() {
  const { form, setFormValue, ui, actions } = useRegisterPage();

  return <div className="min-h-screen flex items-center justify-center bg-secondary px-4 py-10">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary rounded-2xl mb-4">
            <UserPlus className="w-10 h-10 text-white" />
          </div>
          <h1 className="mb-2">Đang Ky</h1>
          <p className="text-muted-foreground">Tạo tài khoản khách hàng để mua hàng và theo dõi đơn hàng</p>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-8">
          <form onSubmit={actions.submitRegisterForm} className="space-y-5">
            <div>
              <label className="block text-sm mb-2">Họ tên</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
    type="text"
    value={form.fullName}
    onChange={(event) => setFormValue("fullName", event.target.value)}
    className="w-full pl-10 pr-4 py-3 bg-white border border-border rounded-lg focus:outline-none focus:border-primary"
    placeholder="Nguyễn Văn A"
    required
  />
              </div>
            </div>

            <div>
              <label className="block text-sm mb-2">Số điện thoại</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
    type="tel"
    value={form.phone}
    onChange={(event) => setFormValue("phone", event.target.value)}
    className="w-full pl-10 pr-4 py-3 bg-white border border-border rounded-lg focus:outline-none focus:border-primary"
    placeholder="0901234567"
  />
              </div>
            </div>

            <div>
              <label className="block text-sm mb-2">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
    type="email"
    value={form.email}
    onChange={(event) => setFormValue("email", event.target.value)}
    className="w-full pl-10 pr-4 py-3 bg-white border border-border rounded-lg focus:outline-none focus:border-primary"
    placeholder="your@email.com"
    required
  />
              </div>
            </div>

            <div>
              <label className="block text-sm mb-2">Mật khẩu</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
    type={ui.showPassword ? "text" : "password"}
    value={form.password}
    onChange={(event) => setFormValue("password", event.target.value)}
    className="w-full pl-10 pr-12 py-3 bg-white border border-border rounded-lg focus:outline-none focus:border-primary"
    placeholder="Nhập mãt khau"
    required
  />
                <button
    type="button"
    onClick={actions.toggleShowPassword}
    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
  >
                  {ui.showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm mb-2">Nhập lại mật khẩu</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
    type={ui.showConfirmPassword ? "text" : "password"}
    value={form.confirmPassword}
    onChange={(event) => setFormValue("confirmPassword", event.target.value)}
    className="w-full pl-10 pr-12 py-3 bg-white border border-border rounded-lg focus:outline-none focus:border-primary"
    placeholder="Nhập lại mật khẩu"
    required
  />
                <button
    type="button"
    onClick={actions.toggleShowConfirmPassword}
    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
  >
                  {ui.showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {ui.error && <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-sm text-red-800">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{ui.error}</span>
              </div>}

            <button
    type="submit"
    disabled={ui.loading}
    className="w-full py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
  >
              {ui.loading ? <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Đang tao tài khoản...</span>
                </> : <>
                  <UserPlus className="w-5 h-5" />
                  <span>Tạo tài khoản</span>
                </>}
            </button>

            <div className="text-center text-sm text-muted-foreground">
              <span>Da co tài khoản? </span>
              <button type="button" onClick={actions.goToLoginPage} className="font-medium text-primary hover:underline">
                Đăng nhập
              </button>
            </div>
          </form>
        </div>

        <div className="text-center mt-6">
          <button onClick={actions.goToLoginPage} className="text-sm text-muted-foreground hover:text-foreground">
            Quay lại trang đăng nhập
          </button>
        </div>
      </div>
    </div>;
}


