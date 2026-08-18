# geekeame-store

E-commerce de productos geek. React + TypeScript + Vite en el frontend, Firebase (Auth + Firestore) como backend, y una Vercel Function para presignar uploads a S3.

## Stack

- React 19 + React Router 7
- TypeScript + Vite 8
- Tailwind CSS 4
- Firebase (Authentication + Firestore) — SDK cliente, sin backend propio salvo lo mínimo
- AWS S3 para imágenes de producto, vía presigned URL (`api/presign-upload.ts`, Vercel Function)
- Vitest + Testing Library para tests

## Setup

```bash
npm install
cp .env.example .env   # completar credenciales de Firebase y AWS
npm run dev
```

### Variables de entorno

Ver `.env.example`. Las que empiezan con `VITE_` son de Firebase y quedan expuestas en el bundle del cliente (es lo esperado, el SDK de Firebase funciona así). Las de AWS (`AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION`, `AWS_S3_BUCKET_NAME`) son solo para la Vercel Function y **nunca** deben llevar prefijo `VITE_` — si lo llevaran quedarían públicas en el bundle.

## Scripts

| Comando | Qué hace |
|---|---|
| `npm run dev` | Servidor de desarrollo (Vite) |
| `npm run build` | Type-check (`tsc -b`) + build de producción |
| `npm run preview` | Sirve el build de producción localmente |
| `npm run lint` | ESLint |
| `npm test` | Corre los tests una vez (Vitest) |
| `npm run test:watch` | Tests en modo watch |
| `npm run test:coverage` | Tests con reporte de cobertura |

## Estructura

```
src/
  components/    # UI reutilizable (auth, product, admin, states)
  contexts/       # CartContext, AuthContext, ProductsContext
  hooks/         # useCart, useAuth
  pages/         # rutas (incluye pages/admin para el panel de administración)
  services/      # acceso a Firebase/Firestore y a la API de uploads
  types/         # tipos compartidos (product, order, review, cart, auth)
api/
  presign-upload.ts   # Vercel Function: genera URL presignada de S3
scripts/
  seed.mjs                    # carga productos de ejemplo en Firestore
  backfillSearchKeywords.mjs  # genera keywords de búsqueda para productos existentes
firestore.rules  # reglas de seguridad publicadas en Firebase Console (ver notas en el archivo)
```

## Funcionalidad

- Catálogo público con búsqueda y detalle de producto
- Carrito de compras (persistido en contexto de React)
- Autenticación (registro/login) y checkout con creación de orden en Firestore
- Historial de órdenes del usuario
- Reseñas de producto: calificación 1-5 estrellas + comentario, una reseña por usuario por producto (editable), promedio visible en el detalle
- Panel de administración (`/admin`, solo rol `admin`): alta/edición/borrado de productos, gestión de órdenes

## Seguridad

El control de acceso real vive en `firestore.rules`, no en la UI — los guards de React (`RequireAuth`, `RequireAdmin`) solo ocultan rutas y botones. Las reglas se editan y publican directo desde Firebase Console (no hay `firebase.json`/CLI configurado en este proyecto); el archivo en el repo es un espejo de lo publicado y hay que mantenerlo sincronizado a mano después de cualquier cambio en la consola.

## Deploy

Desplegado en Vercel (carpeta `.vercel/` presente localmente). El build de producción corre `tsc -b && vite build`; la función de `api/presign-upload.ts` se despliega como Vercel Function.
