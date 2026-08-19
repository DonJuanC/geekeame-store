import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

export function LoginPage() {
  const { signIn, signInWithGoogle, resetPassword } = useAuth();
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

  return (
    <main className="min-h-screen flex items-center justify-center p-4">
      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4">
        <h1 className="text-xl font-bold">Iniciar sesión</h1>
        {error && (
          <p role="alert" className="text-red-600 text-sm">
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
          className="w-full border rounded p-2"
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
          className="w-full border rounded p-2"
        />

        <div className="text-right -mt-2">
          <button
            type="button"
            onClick={handleResetPassword}
            disabled={resetStatus === "sending"}
            className="text-sm underline disabled:opacity-50"
          >
            ¿Olvidaste tu contraseña?
          </button>
        </div>
        {resetStatus === "sent" && (
          <p role="status" className="text-sm text-gray-600">
            Si ese email tiene una cuenta, te enviamos un link para restablecer
            la contraseña. Revisa también spam.
          </p>
        )}
        {resetStatus === "error" && (
          <p role="alert" className="text-red-600 text-sm">
            No pudimos enviar el email. Intenta de nuevo en un momento.
          </p>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-black text-white rounded p-2 disabled:opacity-50"
        >
          {isSubmitting ? "Ingresando..." : "Ingresar"}
        </button>
        <button
          type="button"
          onClick={handleGoogle}
          disabled={isGoogleSubmitting}
          className="w-full border rounded p-2 disabled:opacity-50"
        >
          {isGoogleSubmitting ? "Conectando..." : "Continuar con Google"}
        </button>
        <p className="text-sm text-center">
          ¿No tienes cuenta?{" "}
          <Link to="/register" className="underline">
            Regístrate
          </Link>
        </p>
      </form>
    </main>
  );
}
