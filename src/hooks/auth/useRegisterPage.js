import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { getAuthErrorMessage } from "@/services/authService";
import { useAuth } from "@/store/auth/AuthContext";
import { getLandingPathByRole } from "@/store/auth/authRedirect";

export function useRegisterPage() {
  const navigate = useNavigate();
  const { register, user, isAuthenticated, isReady } = useAuth();

  const [form, setForm] = useState({
    fullName: "",
    phone: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isReady || !isAuthenticated || !user) {
      return;
    }

    navigate(getLandingPathByRole(user.role), { replace: true });
  }, [isAuthenticated, isReady, navigate, user]);

  async function submitRegisterForm(event) {
    event.preventDefault();
    setError("");

    if (form.password !== form.confirmPassword) {
      setError("Mật khẩu nhập lại không khớp.");
      return;
    }

    setLoading(true);

    try {
      const registeredUser = await register({
        email: form.email,
        password: form.password,
        fullName: form.fullName,
        phone: form.phone,
      });

      navigate(getLandingPathByRole(registeredUser.role), { replace: true });
    } catch (registerError) {
      setError(getAuthErrorMessage(registerError, "Đăng ký thất bại. Vui lòng thử lại."));
    } finally {
      setLoading(false);
    }
  }

  function setFormValue(field, value) {
    setForm((currentForm) => ({
      ...currentForm,
      [field]: value,
    }));
  }

  return {
    form,
    setFormValue,
    ui: {
      showPassword,
      showConfirmPassword,
      error,
      loading,
    },
    actions: {
      toggleShowPassword: () => setShowPassword((currentValue) => !currentValue),
      toggleShowConfirmPassword: () => setShowConfirmPassword((currentValue) => !currentValue),
      submitRegisterForm,
      goToLoginPage: () => navigate("/login"),
    },
  };
}


