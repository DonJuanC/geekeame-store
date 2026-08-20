import { useCallback, useEffect, useState } from "react";
import { useTheme } from "../../hooks/useTheme";
import { useAuth } from "../../hooks/useAuth";
import { listUsers, updateUserRole } from "../../services/usersService";
import type { UserProfile, UserRole } from "../../types/auth";
import {
  UsersTable,
  UsersTableSkeleton,
} from "../../components/admin/UsersTable";
import { EmptyState } from "../../components/states/EmptyState";
import { ErrorState } from "../../components/states/ErrorState";
import { AdminPageTitle } from "../../components/admin/AdminPageTitle";

type Status = "loading" | "idle" | "error";

export function AdminUsersPage() {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [status, setStatus] = useState<Status>("loading");
  const [updatingUid, setUpdatingUid] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const fetchUsers = useCallback(() => {
    return listUsers()
      .then((result) => {
        setUsers(result);
        setStatus("idle");
      })
      .catch((err) => {
        console.error(err);
        setStatus("error");
      });
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  function handleRetry() {
    setStatus("loading");
    setActionError(null);
    fetchUsers();
  }

  async function handleChangeRole(user: UserProfile, role: UserRole) {
    setUpdatingUid(user.uid);
    setActionError(null);
    try {
      await updateUserRole(user.uid, role);
      setUsers((current) =>
        current.map((u) => (u.uid === user.uid ? { ...u, role } : u)),
      );
    } catch (err) {
      const code = (err as { code?: string })?.code;
      setActionError(
        code === "permission-denied"
          ? "No tienes permisos para cambiar este rol."
          : err instanceof Error
            ? err.message
            : "No pudimos actualizar el rol. Intenta de nuevo.",
      );
    } finally {
      setUpdatingUid(null);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <AdminPageTitle title="Usuarios" />
      <p className={`text-sm -mt-2 ${isDark ? "text-[#9ca3af]" : "text-gray-500"}`}>
        Cambiar el rol de un usuario aplica al instante -- firestore.rules
        solo permite tocar el campo "role" de un perfil ajeno, y bloquea
        cambiar el propio.
      </p>

      {actionError && (
        <p
          role="alert"
          className={isDark ? "text-[#f87171] text-sm" : "text-red-600 text-sm"}
        >
          {actionError}
        </p>
      )}

      {status === "loading" && <UsersTableSkeleton dark={isDark} />}
      {status === "error" && (
        <ErrorState
          message="No pudimos cargar los usuarios."
          onRetry={handleRetry}
          dark={isDark}
        />
      )}
      {status === "idle" && users.length === 0 && (
        <EmptyState message="Todavía no hay usuarios registrados." dark={isDark} />
      )}
      {status === "idle" && users.length > 0 && currentUser && (
        <UsersTable
          users={users}
          currentUid={currentUser.uid}
          updatingUid={updatingUid}
          onChangeRole={handleChangeRole}
          dark={isDark}
        />
      )}
    </div>
  );
}
