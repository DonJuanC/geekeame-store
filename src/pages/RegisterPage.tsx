import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

export function RegisterPage() {
  const { signUp } = useAuth();
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

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4">
        <h1 className="text-xl font-bold">Crear cuenta</h1>
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
          placeholder="Contraseña (mínimo 6 caracteres)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full border rounded p-2"
        />
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-black text-white rounded p-2 disabled:opacity-50"
        >
          {isSubmitting ? "Creando cuenta..." : "Registrarme"}
        </button>
        <p className="text-sm text-center">
          ¿Ya tienes cuenta?{" "}
          <Link to="/login" className="underline">
            Inicia sesión
          </Link>
        </p>
      </form>
    </div>
  );
}
