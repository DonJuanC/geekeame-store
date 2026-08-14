import { useAuth } from "../hooks/useAuth";

export function HomePage() {
  const { user, signOut } = useAuth();
  return (
    <div className="p-6">
      <h1 className="text-xl font-bold">Geekeame</h1>
      <p>
        Hola, {user?.email} ({user?.role})
      </p>
      <button onClick={() => signOut()} className="mt-4 border rounded p-2">
        Cerrar sesión
      </button>
    </div>
  );
}
