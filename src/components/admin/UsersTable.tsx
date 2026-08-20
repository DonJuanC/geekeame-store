import type { UserProfile, UserRole } from "../../types/auth";

interface UserRowProps {
  user: UserProfile;
  isCurrentUser: boolean;
  isUpdating: boolean;
  onChangeRole: (user: UserProfile, role: UserRole) => void;
  dark: boolean;
}

function UserRow({
  user,
  isCurrentUser,
  isUpdating,
  onChangeRole,
  dark,
}: UserRowProps) {
  return (
    <tr className={`border-b last:border-b-0 ${dark ? "border-[#2e2a45]" : ""}`}>
      <td className="p-2 text-sm font-medium">
        {user.email}
        {isCurrentUser && (
          <span className={`ml-2 text-xs font-normal ${dark ? "text-[#9ca3af]" : "text-gray-400"}`}>
            (tú)
          </span>
        )}
      </td>
      <td className="p-2 text-sm">
        <select
          value={user.role}
          disabled={isCurrentUser || isUpdating}
          onChange={(e) => onChangeRole(user, e.target.value as UserRole)}
          aria-label={`Rol de ${user.email}`}
          title={
            isCurrentUser
              ? "No puedes cambiar tu propio rol desde acá."
              : undefined
          }
          className={`rounded-full border px-2.5 py-1 text-sm disabled:opacity-50 ${
            dark
              ? "bg-[#161320] border-[#3f3a5c] text-[#f5f3ff]"
              : "border-[#ddd6fe]"
          }`}
        >
          <option value="customer">customer</option>
          <option value="admin">admin</option>
        </select>
        {isUpdating && (
          <span className={`ml-2 text-xs ${dark ? "text-[#9ca3af]" : "text-gray-400"}`}>
            Guardando…
          </span>
        )}
      </td>
      <td className={`p-2 text-sm ${dark ? "text-[#9ca3af]" : "text-gray-600"}`}>
        {new Date(user.createdAt).toLocaleDateString("es-CO")}
      </td>
    </tr>
  );
}

interface UsersTableProps {
  users: UserProfile[];
  currentUid: string;
  updatingUid: string | null;
  onChangeRole: (user: UserProfile, role: UserRole) => void;
  dark?: boolean;
}

export function UsersTable({
  users,
  currentUid,
  updatingUid,
  onChangeRole,
  dark = false,
}: UsersTableProps) {
  return (
    <div className={`overflow-x-auto rounded-xl border ${dark ? "border-[#2e2a45]" : "border-[#ede9fe]"}`}>
      <table className="w-full text-left">
        <thead className={dark ? "bg-[#1c1a29]" : "bg-gray-50"}>
          <tr>
            <th className={`p-2 text-xs uppercase ${dark ? "text-[#9ca3af]" : "text-gray-500"}`}>Email</th>
            <th className={`p-2 text-xs uppercase ${dark ? "text-[#9ca3af]" : "text-gray-500"}`}>Rol</th>
            <th className={`p-2 text-xs uppercase ${dark ? "text-[#9ca3af]" : "text-gray-500"}`}>Alta</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <UserRow
              key={user.uid}
              user={user}
              isCurrentUser={user.uid === currentUid}
              isUpdating={updatingUid === user.uid}
              onChangeRole={onChangeRole}
              dark={dark}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function UsersTableSkeleton({ dark = false }: { dark?: boolean }) {
  return (
    <div
      className={`overflow-x-auto rounded-xl border animate-pulse ${dark ? "border-[#2e2a45]" : "border-[#ede9fe]"}`}
    >
      <table className="w-full text-left">
        <tbody>
          {[0, 1, 2].map((row) => (
            <tr key={row} className={`border-b last:border-b-0 ${dark ? "border-[#2e2a45]" : ""}`}>
              {[0, 1, 2].map((col) => (
                <td key={col} className="p-2">
                  <div className={`h-4 rounded ${dark ? "bg-[#2e2a45]" : "bg-gray-200"}`} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
