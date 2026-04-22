import { AlertCircle, Eye, EyeOff, Lock, LogIn, Mail } from "lucide-react";
import { useLoginPage } from "@/hooks/auth/useLoginPage";

export default function LoginPage() {
  const { form, setFormValue, ui, actions, googleButtonRef } = useLoginPage();

  return <div className="min-h-screen flex items-center justify-center bg-secondary px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary rounded-2xl mb-4">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path
    strokeLinecap="round"
    strokeLinejoin="round"
    strokeWidth={2}
    d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
  />
            </svg>
          </div>
          <h1 className="mb-2">Đang Nhap</h1>
          <p className="text-muted-foreground">Đăng nhập để tiếp tục sử dụng hệ thống</p>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-8">
          <form onSubmit={actions.submitLoginForm} className="space-y-6">
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
    placeholder="********"
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

            {ui.error && <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-sm text-red-800">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{ui.error}</span>
              </div>}

            <button
    type="submit"
    disabled={ui.isBusy}
    className="w-full py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
  >
              {ui.loading ? <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Đang đăng nhập...</span>
                </> : <>
                  <LogIn className="w-5 h-5" />
                  <span>Đăng Nhập</span>
                </>}
            </button>

            <div className="text-center text-sm text-muted-foreground">
              <span>Chưa có tài khoản? </span>
              <button type="button" onClick={actions.goToRegisterPage} className="font-medium text-primary hover:underline">
                Đăng ký
              </button>
            </div>
          </form>

          <div className="mt-6">
            <div className="flex items-center gap-3 text-xs uppercase tracking-[0.2em] text-muted-foreground">
              <div className="flex-1 h-px bg-border" />
              <span>Hoac</span>
              <div className="flex-1 h-px bg-border" />
            </div>

            <div className="mt-5 space-y-3">
              <div className="flex justify-center">
                <div ref={googleButtonRef} className="min-h-10" />
              </div>

              {!ui.isGoogleReady && <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                  <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  <span>Đang tải Google login...</span>
                </div>}

              {ui.googleLoading && <div className="flex items-center justify-center gap-2 text-sm text-primary">
                  <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  <span>Đang xác thực tài khoản Google...</span>
                </div>}

            </div>
          </div>
        </div>

        <div className="text-center mt-6">
          <button onClick={actions.goToHomePage} className="text-sm text-muted-foreground hover:text-foreground">
            Quay lại trang chủ
          </button>
        </div>
      </div>
    </div>;
}


