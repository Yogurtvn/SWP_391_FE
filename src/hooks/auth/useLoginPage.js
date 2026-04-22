import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { getAuthErrorMessage } from "@/services/authService";
import { useAuth } from "@/store/auth/AuthContext";
import { getLandingPathByRole } from "@/store/auth/authRedirect";

const GOOGLE_SCRIPT_ID = "google-identity-services";

export function useLoginPage() {
  const navigate = useNavigate();
  const { login, loginWithGoogle, user, isAuthenticated, isReady } = useAuth();
  const googleButtonRef = useRef(null);

  const [form, setForm] = useState({
    email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [isGoogleReady, setIsGoogleReady] = useState(false);

  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  useEffect(() => {
    if (!isReady || !isAuthenticated || !user) {
      return;
    }

    redirectToLandingPage(navigate, user.role);
  }, [isAuthenticated, isReady, navigate, user]);

  useEffect(() => {
    let isMounted = true;

    async function setupGoogleLogin() {
      if (!googleClientId) {
        setError("Thiếu Google client id để khởi tạo đăng nhập Google.");
        return;
      }

      try {
        await loadGoogleIdentityScript();

        if (!isMounted) {
          return;
        }

        renderGoogleButton({
          element: googleButtonRef.current,
          clientId: googleClientId,
          onCredential: async (credential) => {
            await handleGoogleLogin(credential, {
              loginWithGoogle,
              navigate,
              setError,
              setGoogleLoading,
            });
          },
        });

        setIsGoogleReady(true);
      } catch (scriptError) {
        if (!isMounted) {
          return;
        }

        setError(getAuthErrorMessage(scriptError, "Không thể tải Google Identity Services."));
      }
    }

    void setupGoogleLogin();

    return () => {
      isMounted = false;
      window.google?.accounts.id.cancel();
    };
  }, [googleClientId, loginWithGoogle, navigate]);

  async function submitLoginForm(event) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const loggedInUser = await login({
        email: form.email.trim(),
        password: form.password,
      });

      redirectToLandingPage(navigate, loggedInUser.role);
    } catch (loginError) {
      setError(getAuthErrorMessage(loginError, "Đã có lỗi xảy ra. Vui lòng thử lại."));
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
      error,
      loading,
      googleLoading,
      isGoogleReady,
      isBusy: loading || googleLoading,
    },
    actions: {
      toggleShowPassword: () => setShowPassword((currentValue) => !currentValue),
      submitLoginForm,
      goToRegisterPage: () => navigate("/register"),
      goToHomePage: () => navigate("/"),
    },
    googleButtonRef,
  };
}

async function handleGoogleLogin(credential, helpers) {
  if (!credential) {
    helpers.setError("Google không trả về credential hợp lệ.");
    return;
  }

  helpers.setError("");
  helpers.setGoogleLoading(true);

  try {
    const loggedInUser = await helpers.loginWithGoogle(credential);
    redirectToLandingPage(helpers.navigate, loggedInUser.role);
  } catch (loginError) {
    helpers.setError(getAuthErrorMessage(loginError, "Đăng nhập Google thất bại. Vui lòng thử lại."));
  } finally {
    helpers.setGoogleLoading(false);
  }
}

function redirectToLandingPage(navigate, role) {
  navigate(getLandingPathByRole(role), { replace: true });
}

function renderGoogleButton({ element, clientId, onCredential }) {
  if (!element || !window.google?.accounts.id) {
    return;
  }

  element.innerHTML = "";

  window.google.accounts.id.initialize({
    client_id: clientId,
    callback: (response) => {
      const credential = response.credential?.trim();
      void onCredential(credential);
    },
    cancel_on_tap_outside: true,
    ux_mode: "popup",
  });

  window.google.accounts.id.renderButton(element, {
    theme: "outline",
    size: "large",
    shape: "pill",
    text: "continue_with",
    locale: "vi",
    width: 320,
  });
}

function loadGoogleIdentityScript() {
  if (window.google?.accounts.id) {
    return Promise.resolve();
  }

  return new Promise((resolve, reject) => {
    const existingScript = document.getElementById(GOOGLE_SCRIPT_ID);

    if (existingScript) {
      existingScript.addEventListener("load", () => resolve(), { once: true });
      existingScript.addEventListener(
        "error",
        () => reject(new Error("Không thể tải Google Identity Services.")),
        { once: true },
      );
      return;
    }

    const script = document.createElement("script");
    script.id = GOOGLE_SCRIPT_ID;
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Không thể tải Google Identity Services."));

    document.head.appendChild(script);
  });
}

