import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "@/store/auth/AuthContext";
import { getLandingPathByRole } from "@/store/auth/authRedirect";
import { useEffect } from "react";

export function useRegisterPage() {
  const navigate = useNavigate();
  const { register, user, isAuthenticated, isReady } = useAuth();

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
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

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Mat khau nhap lai khong khop.");
      return;
    }

    setLoading(true);

    try {
      const authenticatedUser = await register({
        email: email.trim(),
        password,
        fullName: fullName.trim(),
        phone: phone.trim() || null,
      });
      navigate(getLandingPathByRole(authenticatedUser.role), { replace: true });
    } catch (registerError) {
      setError(getErrorMessage(registerError, "Dang ky that bai. Vui long thu lai."));
    } finally {
      setLoading(false);
    }
  };

  return {
    fullName,
    setFullName,
    phone,
    setPhone,
    email,
    setEmail,
    password,
    setPassword,
    confirmPassword,
    setConfirmPassword,
    showPassword,
    toggleShowPassword: () => setShowPassword((currentValue) => !currentValue),
    showConfirmPassword,
    toggleShowConfirmPassword: () => setShowConfirmPassword((currentValue) => !currentValue),
    error,
    loading,
    handleSubmit,
    goToLogin: () => navigate("/login"),
  };
}

function getErrorMessage(error: unknown, fallbackMessage: string): string {
  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message;
  }

  return fallbackMessage;
}
