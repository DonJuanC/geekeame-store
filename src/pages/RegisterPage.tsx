import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useTheme } from "../hooks/useTheme";
import { StoreHeader } from "../components/layout/StoreHeader";

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

  const inputClass = `w-full rounded-lg p-2 border focus:outline-none focus:ring-2 focus:ring-[#c4b5fd] ${
    isDark ? "bg-[#161320] border-[#2e2a45] text-[#f5f3ff]" : "border-[#ede9fe]"
  }`;

  return (
    <div className={`min-h-screen flex flex-col ${isDark ? "bg-[#0f0e17] text-[#f5f3ff]" : "bg-white"}`}>
      <StoreHeader />
      <div className="flex-1 flex items-center justify-center p-4">
        <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4">
          <h1 className="text-xl font-bold">Crear cuenta</h1>
          {error && (
            <p className={`text-sm ${isDark ? "text-[#f87171]" : "text-red-600"}`}>{error}</p>
          )}
          <input
            type="email"
            required
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={inputClass}
          />
          <input
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
            className="w-full rounded-full p-2.5 font-medium bg-[#7c3aed] text-white hover:bg-[#6d28d9] disabled:opacity-50 transition-colors"
          >
            {isSubmitting ? "Creando cuenta..." : "Registrarme"}
          </button>
          <p className="text-sm text-center">
            ¿Ya tienes cuenta?{" "}
            <Link
              to="/login"
              className={isDark ? "text-[#c4b5fd] hover:text-[#a78bfa]" : "text-[#6d28d9] hover:text-[#4c1d95]"}
            >
              Inicia sesión
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
