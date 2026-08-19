import type { VercelRequest, VercelResponse } from "@vercel/node";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { randomUUID } from "node:crypto";

// Tipos de imagen aceptados para portadas de producto.
const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/webp", "image/gif"];

// Antes esto solo se validaba en el input del formulario en el navegador
// (ver AdminProductFormPage) -- cualquiera con el token de un admin podía
// saltarse ese límite llamando directo a este endpoint. 5MB es de sobra
// para una imagen de portada de producto ya optimizada para web.
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;

// Extrae el uid del payload del ID token de Firebase SIN verificar la
// firma acá -- no hace falta: isAdmin() reenvía el mismo token a la API
// REST de Firestore como Bearer auth, y es Firestore quien verifica la
// firma y aplica sus reglas de seguridad (users/{uid}: solo el dueño o un
// admin puede leer). Si el token es falso o no coincide con el uid del
// path, Firestore devuelve 403 y isAdmin() da false. No agregamos
// firebase-admin ni un service account nuevo solo para esto.
function decodeUid(idToken: string): string | null {
  try {
    const payload = idToken.split(".")[1];
    const json = JSON.parse(Buffer.from(payload, "base64").toString("utf8"));
    return typeof json.sub === "string" ? json.sub : null;
  } catch {
    return null;
  }
}

async function isAdmin(idToken: string, uid: string): Promise<boolean> {
  const projectId = process.env.VITE_FIREBASE_PROJECT_ID;
  const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/users/${uid}`;
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${idToken}` },
  });
  if (!response.ok) return false;
  const doc = (await response.json()) as {
    fields?: { role?: { stringValue?: string } };
  };
  return doc.fields?.role?.stringValue === "admin";
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Metodo no permitido." });
    return;
  }

  const authHeader = req.headers.authorization;
  const idToken = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
  const uid = idToken ? decodeUid(idToken) : null;

  if (!idToken || !uid || !(await isAdmin(idToken, uid))) {
    res.status(403).json({ error: "No autorizado." });
    return;
  }

  const { fileName, fileType, fileSize } = (req.body ?? {}) as {
    fileName?: unknown;
    fileType?: unknown;
    fileSize?: unknown;
  };

  if (typeof fileName !== "string" || typeof fileType !== "string") {
    res.status(400).json({ error: "Faltan fileName o fileType." });
    return;
  }
  if (!ALLOWED_TYPES.includes(fileType)) {
    res.status(400).json({ error: "Tipo de archivo no permitido." });
    return;
  }
  if (
    typeof fileSize !== "number" ||
    !Number.isFinite(fileSize) ||
    fileSize <= 0 ||
    fileSize > MAX_FILE_SIZE_BYTES
  ) {
    res.status(400).json({
      error: `El archivo supera el límite de ${MAX_FILE_SIZE_BYTES / (1024 * 1024)}MB.`,
    });
    return;
  }

  const bucket = process.env.AWS_S3_BUCKET_NAME;
  const region = process.env.AWS_REGION;
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;

  if (!bucket || !region || !accessKeyId || !secretAccessKey) {
    res.status(500).json({ error: "Faltan variables de entorno de AWS en el servidor." });
    return;
  }

  // Nombre de archivo saneado + uuid: evita colisiones y caracteres que
  // rompan la URL pública (espacios, tildes, etc.).
  const safeName = fileName.replace(/[^a-zA-Z0-9.\-_]/g, "_");
  const key = `products/${randomUUID()}-${safeName}`;

  const s3 = new S3Client({
    region,
    credentials: { accessKeyId, secretAccessKey },
  });

  // ContentLength firmado como parte de la request: S3 exige que el PUT
  // real mande exactamente ese Content-Length, así que el límite de tamaño
  // queda forzado por S3 mismo, no solo por la validación de arriba (que
  // el cliente podría saltarse llamando al endpoint directo con un
  // fileSize falso y subiendo un archivo más grande de todos modos).
  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    ContentType: fileType,
    ContentLength: fileSize,
  });

  try {
    const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 60 });
    const publicUrl = `https://${bucket}.s3.${region}.amazonaws.com/${key}`;
    res.status(200).json({ uploadUrl, publicUrl });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "No pudimos generar la URL de subida." });
  }
}
