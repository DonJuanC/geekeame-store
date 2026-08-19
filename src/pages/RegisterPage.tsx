import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useTheme } from "../hooks/useTheme";

export function RegisterPage() {
  const { signUp } = useAuth();
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await signUp(email, password);
      navigate("/");
    } catch {
      setError(
        "No pudimos crear tu cuenta. Puede que el email ya esté registrado.",
      );
    } finally {
      setIsSubmitting(false);
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
          <h1 className="text-xl font-bold">Crear cuenta</h1>
          {error && (
            <p
              role="alert"
              className={`text-sm ${isDark ? "text-[#f87171]" : "text-red-600"}`}
            >
              {error}
            </p>
          )}
          <label htmlFor="register-email" className="sr-only">
            Email
          </label>
          <input
            id="register-email"
            type="email"
            required
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={inputClass}
          />
          <label htmlFor="register-password" className="sr-only">
            Contraseña (mínimo 6 caracteres)
          </label>
          <input
            id="register-password"
            type="password"
            required
            placeholder="Contraseña (mínimo 6 caracteres)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={inputClass}
          />
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-full py-2.5 font-medium bg-[#7c3aed] text-white hover:bg-[#6d28d9] disabled:opacity-50 transition-colors"
          >
            {isSubmitting ? "Creando cuenta..." : "Registrarme"}
          </button>
          <p className="text-sm text-center">
            ¿Ya tienes cuenta?{" "}
            <Link to="/login" className={`font-medium ${linkClass}`}>
              Inicia sesión
            </Link>
          </p>
        </form>
      </div>
    </main>
  );
}
