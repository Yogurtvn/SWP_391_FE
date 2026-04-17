import { useEffect, useRef, useState, type FormEvent } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "@/store/auth/AuthContext";
import { getLandingPathByRole } from "@/store/auth/authRedirect";

const GOOGLE_SCRIPT_ID = "google-identity-services";

export function useLoginPage() {
  const navigate = useNavigate();
  const { login, loginWithGoogle, user, isAuthenticated, isReady } = useAuth();

  const googleButtonRef = useRef<HTMLDivElement | null>(null);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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

    navigate(getLandingPathByRole(user.role), { replace: true });
  }, [isAuthenticated, isReady, navigate, user]);

  useEffect(() => {
    let isActive = true;

    async function setupGoogleLogin() {
      if (!googleClientId) {
        setError("Thieu Google client id de khoi tao dang nhap Google.");
        return;
      }

      try {
        await loadGoogleIdentityScript();

        if (!isActive || !googleButtonRef.current || !window.google?.accounts.id) {
          return;
        }

        googleButtonRef.current.innerHTML = "";

        window.google.accounts.id.initialize({
          client_id: googleClientId,
          callback: (response) => {
            const credential = response.credential?.trim();

            if (!credential) {
              setError("Google khong tra ve credential hop le.");
              return;
            }

            setError("");
            setGoogleLoading(true);

            void (async () => {
              try {
                const authenticatedUser = await loginWithGoogle(credential);
                navigate(getLandingPathByRole(authenticatedUser.role), { replace: true });
              } catch (authError) {
                if (!isActive) {
                  return;
                }

                setError(getErrorMessage(authError, "Dang nhap Google that bai. Vui long thu lai."));
              } finally {
                if (isActive) {
                  setGoogleLoading(false);
                }
              }
            })();
          },
          cancel_on_tap_outside: true,
          ux_mode: "popup",
        });

        window.google.accounts.id.renderButton(googleButtonRef.current, {
          theme: "outline",
          size: "large",
          shape: "pill",
          text: "continue_with",
          locale: "vi",
          width: 320,
        });

        setIsGoogleReady(true);
      } catch (scriptError) {
        if (!isActive) {
          return;
        }

        setError(getErrorMessage(scriptError, "Khong the tai Google Identity Services."));
      }
    }

    void setupGoogleLogin();

    return () => {
      isActive = false;
      window.google?.accounts.id.cancel();
    };
  }, [googleClientId, loginWithGoogle, navigate]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const authenticatedUser = await login(email, password);
      navigate(getLandingPathByRole(authenticatedUser.role), { replace: true });
    } catch (authError) {
      setError(getErrorMessage(authError, "Da co loi xay ra. Vui long thu lai."));
    } finally {
      setLoading(false);
    }
  };

  return {
    email,
    setEmail,
    password,
    setPassword,
    showPassword,
    toggleShowPassword: () => setShowPassword((currentValue) => !currentValue),
    error,
    loading,
    googleLoading,
    isGoogleReady,
    isBusy: loading || googleLoading,
    googleButtonRef,
    handleSubmit,
    goToRegister: () => navigate("/register"),
    goHome: () => navigate("/"),
  };
}

function getErrorMessage(error: unknown, fallbackMessage: string): string {
  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message;
  }

  return fallbackMessage;
}

function loadGoogleIdentityScript(): Promise<void> {
  if (window.google?.accounts.id) {
    return Promise.resolve();
  }

  return new Promise((resolve, reject) => {
    const existingScript = document.getElementById(GOOGLE_SCRIPT_ID) as HTMLScriptElement | null;

    if (existingScript) {
      existingScript.addEventListener("load", () => resolve(), { once: true });
      existingScript.addEventListener("error", () => reject(new Error("Khong the tai Google Identity Services.")), {
        once: true,
      });
      return;
    }

    const script = document.createElement("script");
    script.id = GOOGLE_SCRIPT_ID;
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Khong the tai Google Identity Services."));
    document.head.appendChild(script);
  });
}
