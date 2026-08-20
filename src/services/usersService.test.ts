import { beforeEach, describe, expect, it, vi } from "vitest";

// Tests del servicio de gestión de roles del panel admin (/admin/users),
// a nivel de servicio: se mockea "firebase/firestore" y "./firebase" para
// no depender de una base real -- lo que se verifica es que usersService
// arma la query/el patch y llama al SDK correctamente, no el
// comportamiento del SDK en sí. La restricción real de "solo un admin
// puede cambiar el rol de OTRO usuario" vive en firestore.rules, no acá.

vi.mock("firebase/firestore", () => ({
  collection: vi.fn(),
  doc: vi.fn(),
  getDocs: vi.fn(),
  orderBy: vi.fn(),
  query: vi.fn(),
  updateDoc: vi.fn(),
}));

vi.mock("./firebase", () => ({ db: {} }));

import {
  collection,
  doc,
  getDocs,
  orderBy,
  query,
  updateDoc,
} from "firebase/firestore";
import { listUsers, updateUserRole } from "./usersService";

describe("usersService", () => {
  beforeEach(() => {
    vi.mocked(collection).mockReset();
    vi.mocked(doc).mockReset();
    vi.mocked(getDocs).mockReset();
    vi.mocked(orderBy).mockReset();
    vi.mocked(query).mockReset();
    vi.mocked(updateDoc).mockReset();
  });

  it("listUsers ordena por email y mapea los documentos a UserProfile", async () => {
    vi.mocked(collection).mockReturnValue("users-collection" as never);
    vi.mocked(orderBy).mockReturnValue("orderBy-email" as never);
    vi.mocked(query).mockReturnValue("users-query" as never);
    vi.mocked(getDocs).mockResolvedValue({
      docs: [
        {
          data: () => ({
            uid: "u1",
            email: "a@geekeame.com",
            role: "customer",
            createdAt: 1,
          }),
        },
        {
          data: () => ({
            uid: "u2",
            email: "b@geekeame.com",
            role: "admin",
            createdAt: 2,
          }),
        },
      ],
    } as never);

    const users = await listUsers();

    expect(orderBy).toHaveBeenCalledWith("email");
    expect(query).toHaveBeenCalledWith("users-collection", "orderBy-email");
    expect(getDocs).toHaveBeenCalledWith("users-query");
    expect(users).toEqual([
      { uid: "u1", email: "a@geekeame.com", role: "customer", createdAt: 1 },
      { uid: "u2", email: "b@geekeame.com", role: "admin", createdAt: 2 },
    ]);
  });

  it("updateUserRole solo manda el campo role en el patch", async () => {
    vi.mocked(doc).mockReturnValue("user-ref" as never);
    vi.mocked(updateDoc).mockResolvedValue(undefined as never);

    await updateUserRole("u2", "admin");

    expect(updateDoc).toHaveBeenCalledWith("user-ref", { role: "admin" });
  });
});
