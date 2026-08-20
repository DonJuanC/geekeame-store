import { auth } from "./firebase";

const PRESIGN_ENDPOINT = "/api/presign-upload";

export async function uploadProductImage(file: File): Promise<string> {
  const user = auth.currentUser;
  if (!user) {
    throw new Error("Tienes que iniciar sesión para subir imágenes.");
  }

  const idToken = await user.getIdToken();

  const presignRes = await fetch(PRESIGN_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${idToken}`,
    },
    body: JSON.stringify({
      fileName: file.name,
      fileType: file.type,
      fileSize: file.size,
    }),
  });

  if (!presignRes.ok) {
    const body = (await presignRes.json().catch(() => null)) as {
      error?: string;
    } | null;
    throw new Error(
      body?.error ?? "No pudimos preparar la subida de la imagen.",
    );
  }

  const { uploadUrl, publicUrl } = (await presignRes.json()) as {
    uploadUrl: string;
    publicUrl: string;
  };

  const uploadRes = await fetch(uploadUrl, {
    method: "PUT",
    headers: { "Content-Type": file.type },
    body: file,
  });

  if (!uploadRes.ok) {
    throw new Error("No pudimos subir la imagen a S3. Intenta de nuevo.");
  }

  return publicUrl;
}
