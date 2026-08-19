import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// uploadService no tenía cobertura -- era uno de los huecos de testing
// señalados en la auditoría contra la rúbrica. Se mockea "./firebase" (solo
// se usa auth.currentUser.getIdToken) y el fetch global (dos requests: el
// POST de presign y el PUT directo a S3), sin dependencias reales.

const { mockAuth } = vi.hoisted(() => ({
  mockAuth: { currentUser: null } as {
    currentUser: { getIdToken: () => Promise<string> } | null;
  },
}));

vi.mock("./firebase", () => ({
  auth: mockAuth,
}));

import { uploadProductImage } from "./uploadService";

function jsonResponse(body: unknown, ok = true, status = 200) {
  return {
    ok,
    status,
    json: () => Promise.resolve(body),
  } as Response;
}

describe("uploadProductImage", () => {
  const file = new File(["contenido"], "portada.png", { type: "image/png" });

  beforeEach(() => {
    mockAuth.currentUser = {
      getIdToken: vi.fn().mockResolvedValue("id-token-123"),
    };
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("rechaza si no hay usuario logueado, sin llamar a fetch", async () => {
    mockAuth.currentUser = null;

    await expect(uploadProductImage(file)).rejects.toThrow(
      /tienes que iniciar sesión/i,
    );
    expect(fetch).not.toHaveBeenCalled();
  });

  it("pide la URL presignada con fileName/fileType/fileSize y el ID token, y sube el archivo directo a la uploadUrl", async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce(
        jsonResponse({
          uploadUrl: "https://s3.example.com/signed",
          publicUrl: "https://cdn.example.com/portada.png",
        }),
      )
      .mockResolvedValueOnce(jsonResponse({}, true, 200));

    const result = await uploadProductImage(file);

    expect(result).toBe("https://cdn.example.com/portada.png");

    // Request 1: presign, con Authorization y el tamaño real del archivo.
    const [presignUrl, presignInit] = vi.mocked(fetch).mock.calls[0];
    expect(presignUrl).toBe("/api/presign-upload");
    expect(presignInit?.headers).toMatchObject({
      Authorization: "Bearer id-token-123",
    });
    expect(JSON.parse(presignInit?.body as string)).toEqual({
      fileName: "portada.png",
      fileType: "image/png",
      fileSize: file.size,
    });

    // Request 2: PUT directo a la uploadUrl firmada, no a nuestro backend.
    const [uploadUrl, uploadInit] = vi.mocked(fetch).mock.calls[1];
    expect(uploadUrl).toBe("https://s3.example.com/signed");
    expect(uploadInit?.method).toBe("PUT");
    expect(uploadInit?.body).toBe(file);
  });

  it("si el presign falla (ej. archivo demasiado grande), propaga el mensaje de error del servidor", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      jsonResponse({ error: "El archivo supera el límite de 5MB." }, false, 400),
    );

    await expect(uploadProductImage(file)).rejects.toThrow(
      /supera el límite de 5mb/i,
    );
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it("edge case: si el PUT a S3 falla, no revienta con el error crudo de fetch sino con un mensaje claro", async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce(
        jsonResponse({
          uploadUrl: "https://s3.example.com/signed",
          publicUrl: "https://cdn.example.com/portada.png",
        }),
      )
      .mockResolvedValueOnce(jsonResponse({}, false, 500));

    await expect(uploadProductImage(file)).rejects.toThrow(
      /no pudimos subir la imagen a s3/i,
    );
  });
});
