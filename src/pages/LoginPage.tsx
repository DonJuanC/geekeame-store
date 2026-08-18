import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useTheme } from "../hooks/useTheme";
import { StoreHeader } from "../components/layout/StoreHeader";

export function LoginPage() {
  const { status, signIn, signInWithGoogle } = useAuth();
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // El caso que faltaba: signInWithGoogle (redirect) navega la página
  // ENTERA afuera y vuelve -- vuelve al mismo /login del que salió, no a
  // "/". El navigate("/") de handleGoogle de abajo nunca llega a correr
  // (el componente ya se desmontó cuando el browser te mandó a Google), así
  // que sin esto el estado quedaba "authenticated" pero la pantalla seguía
  // mostrando el form de login -- exactamente el bug reportado ("vuelve al
  // login"). Este efecto es lo que efectivamente saca de acá una vez que
  // AuthContext resuelve el redirect al montar.
  useEffect(() => {
    if (status === "authenticated") {
      navigate("/");
    }
  }, [status, navigate]);

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

  async function handleGoogle() {
    setError(null);
    try {
      await signInWithGoogle();
      navigate("/");
    } catch (err) {
      // Antes este catch descartaba el error real, así que en pantalla y en
      // consola no quedaba ningún rastro de por qué fallaba (ej.
      // auth/popup-blocked, auth/unauthorized-domain, auth/cancelled-popup-request).
      // Ahora se loguea completo y se muestra el code/message en el mensaje
      // de error para poder diagnosticar sin adivinar.
      console.error("[signInWithGoogle]", err);
      const detail = err instanceof Error ? err.message : String(err);
      setError(`No pudimos iniciar sesión con Google. (${detail})`);
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
          <h1 className="text-xl font-bold">Iniciar sesión</h1>
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
            placeholder="Contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={inputClass}
          />
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-full p-2.5 font-medium bg-[#7c3aed] text-white hover:bg-[#6d28d9] disabled:opacity-50 transition-colors"
          >
            {isSubmitting ? "Ingresando..." : "Ingresar"}
          </button>
          <button
            type="button"
            onClick={handleGoogle}
            className={`w-full rounded-full p-2.5 border transition-colors ${
              isDark
                ? "border-[#3f3a5c] hover:bg-[#211d34]"
                : "border-[#ddd6fe] hover:bg-[#f5f3ff]"
            }`}
          >
            Continuar con Google
          </button>
          <p className="text-sm text-center">
            ¿No tienes cuenta?{" "}
            <Link
              to="/register"
              className={isDark ? "text-[#c4b5fd] hover:text-[#a78bfa]" : "text-[#6d28d9] hover:text-[#4c1d95]"}
            >
              Regístrate
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
