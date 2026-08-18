import { auth } from "./firebase";

const PRESIGN_ENDPOINT = "/api/presign-upload";

// Flujo de presigned URL: 1) le pedimos a la Vercel Function una URL
// firmada (mandando el ID token del admin logueado para que la function
// valide el rol contra Firestore); 2) subimos el archivo DIRECTO a S3 con
// esa URL, sin pasar por nuestro backend. Las credenciales de AWS nunca
// salen de la Vercel Function.
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
    body: JSON.stringify({ fileName: file.name, fileType: file.type }),
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
