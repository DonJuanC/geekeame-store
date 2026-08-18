import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

export function LoginPage() {
  const { signIn, signInWithGoogle } = useAuth();
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
    } catch {
      setError("No pudimos iniciar sesión con Google.");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4">
        <h1 className="text-xl font-bold">Iniciar sesión</h1>
        {error && <p className="text-red-600 text-sm">{error}</p>}
        <input
          type="email"
          required
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full border rounded p-2"
        />
        <input
          type="password"
          required
          placeholder="Contraseña"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full border rounded p-2"
        />
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
          className="w-full border rounded p-2"
        >
          Continuar con Google
        </button>
        <p className="text-sm text-center">
          ¿No tienes cuenta?{" "}
          <Link to="/register" className="underline">
            Regístrate
          </Link>
        </p>
      </form>
    </div>
  );
}
