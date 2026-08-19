import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useTheme } from "../hooks/useTheme";

export function LoginPage() {
  const { signIn, signInWithGoogle, resetPassword } = useAuth();
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleSubmitting, setIsGoogleSubmitting] = useState(false);
  // "sent" no confirma que el email tenga cuenta -- Firebase no lo revela
  // (ver sendPasswordReset en authService), así que el mensaje es el mismo
  // exista o no la cuenta, para no permitir enumerar usuarios registrados.
  const [resetStatus, setResetStatus] = useState<
    "idle" | "sending" | "sent" | "error"
  >("idle");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await signIn(email, password);
      navigate("/");
    } catch {
      setError("No pudimos iniciar sesión. Revisa tu email y contraseña");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleResetPassword() {
    if (!email) {
      setError("Escribe tu email arriba y vuelve a intentar.");
      return;
    }
    setError(null);
    setResetStatus("sending");
    try {
      await resetPassword(email);
      setResetStatus("sent");
    } catch {
      setResetStatus("error");
    }
  }

  async function handleGoogle() {
    // A diferencia del login por email (que ya usaba isSubmitting), este
    // botón no se deshabilitaba durante la operación -- un doble click
    // podía abrir dos popups de Google a la vez.
    if (isGoogleSubmitting) return;
    setError(null);
    setIsGoogleSubmitting(true);
    try {
      await signInWithGoogle();
      navigate("/");
    } catch {
      setError("No pudimos iniciar sesión con Google.");
    } finally {
      setIsGoogleSubmitting(false);
    }
  }

  const inputClass = `w-full rounded-lg p-2.5 border focus:outline-none focus:ring-2 focus:ring-[#c4b5fd] ${
    isDark
      ? "bg-[#161320] border-[#2e2a45] text-[#f5f3ff] placeholder:text-[#6b6485]"
      : "border-[#ede9fe]"
  }`;
  const linkClass = isDark
    ? "text-[#c4b5fd] hover:text-[#a78bfa]"
    : "text-[#6d28d9] hover:text-[#4c1d95]";

  return (
    <main
      className={`min-h-screen flex items-center justify-center p-4 ${
        isDark ? "bg-[#0f0e17] text-[#f5f3ff]" : "bg-white"
      }`}
    >
      <div className="w-full max-w-sm">
        <Link
          to="/"
          className={`logo-hover-wiggle block text-center font-['Fredoka'] text-2xl font-semibold mb-6 ${
            isDark ? "text-[#a78bfa]" : "text-[#6d28d9]"
          }`}
        >
          Geekeame
        </Link>
        <form
          onSubmit={handleSubmit}
          className={`rounded-2xl border p-6 space-y-4 ${
            isDark ? "bg-[#1c1a29] border-[#2e2a45]" : "border-[#ede9fe]"
          }`}
        >
          <h1 className="text-xl font-bold">Iniciar sesión</h1>
          {error && (
            <p
              role="alert"
              className={`text-sm ${isDark ? "text-[#f87171]" : "text-red-600"}`}
            >
              {error}
            </p>
          )}
          <label htmlFor="login-email" className="sr-only">
            Email
          </label>
          <input
            id="login-email"
            type="email"
            required
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={inputClass}
          />
          <label htmlFor="login-password" className="sr-only">
            Contraseña
          </label>
          <input
            id="login-password"
            type="password"
            required
            placeholder="Contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={inputClass}
          />

          <div className="text-right -mt-2">
            <button
              type="button"
              onClick={handleResetPassword}
              disabled={resetStatus === "sending"}
              className={`text-sm underline disabled:opacity-50 ${linkClass}`}
            >
              ¿Olvidaste tu contraseña?
            </button>
          </div>
          {resetStatus === "sent" && (
            <p
              role="status"
              className={`text-sm ${isDark ? "text-[#9ca3af]" : "text-gray-500"}`}
            >
              Si ese email tiene una cuenta, te enviamos un link para
              restablecer la contraseña. Revisa también spam.
            </p>
          )}
          {resetStatus === "error" && (
            <p
              role="alert"
              className={`text-sm ${isDark ? "text-[#f87171]" : "text-red-600"}`}
            >
              No pudimos enviar el email. Intenta de nuevo en un momento.
            </p>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-full py-2.5 font-medium bg-[#7c3aed] text-white hover:bg-[#6d28d9] disabled:opacity-50 transition-colors"
          >
            {isSubmitting ? "Ingresando..." : "Ingresar"}
          </button>
          <button
            type="button"
            onClick={handleGoogle}
            disabled={isGoogleSubmitting}
            className={`w-full rounded-full py-2.5 border transition-colors disabled:opacity-50 ${
              isDark
                ? "border-[#3f3a5c] hover:bg-[#211d34]"
                : "border-[#ddd6fe] hover:bg-[#f5f3ff]"
            }`}
          >
            {isGoogleSubmitting ? "Conectando..." : "Continuar con Google"}
          </button>
          <p className="text-sm text-center">
            ¿No tienes cuenta?{" "}
            <Link to="/register" className={`font-medium ${linkClass}`}>
              Regístrate
            </Link>
          </p>
        </form>
      </div>
    </main>
  );
}
