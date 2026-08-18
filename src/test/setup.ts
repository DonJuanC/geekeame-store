// Se carga una sola vez antes de toda la suite (ver setupFiles en vitest.config.ts).
// Registra los matchers extendidos de Testing Library (toBeInTheDocument, etc.)
// para no tener que importarlos en cada archivo de test.
import "@testing-library/jest-dom/vitest";
import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";

// Con `globals: false` en vitest.config.ts, Testing Library no detecta un
// afterEach global para desmontar componentes solo: hay que registrarlo acá
// a mano. Sin esto, el DOM de un test queda montado para el siguiente test
// del mismo archivo y las queries (getByText/findByText) empiezan a fallar
// por "elemento encontrado más de una vez".
afterEach(() => {
  cleanup();
});
