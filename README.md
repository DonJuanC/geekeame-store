# geekeame-store

E-commerce de merchandising geek (pines, stickers, posters, llaveros, tazas). React + TypeScript + Vite en el frontend, Firebase (Auth + Firestore) como backend, y una Vercel Function para presignar uploads de imágenes a S3.

Proyecto Integrador 5 del bootcamp de Henry (Full Stack), construido siguiendo la consigna oficial del programa (catálogo con búsqueda, carrito, checkout, panel admin, integración con un storage externo vía backend serverless).

## Contexto del proyecto

Geekeame es una tienda de nicho: productos de cultura geek en cinco categorías (pines, stickers, posters, llaveros, tazas). El objetivo del proyecto no es solo tener un catálogo navegable, sino resolver los mismos problemas que tendría un comercio real chico: quién puede vender/editar el catálogo (rol admin vs. cliente), cómo se controla el stock, cómo queda registro de lo que se compró (para reseñas y para el historial de pedidos), y cómo se suben imágenes de producto sin depender de subir archivos "a mano" a un bucket.

Los dos roles de usuario son:

- **Cliente**: navega el catálogo, busca, agrega al carrito, hace checkout, ve su historial de pedidos, deja reseñas de lo que compró, marca favoritos.
- **Admin**: todo lo anterior más el panel `/admin` — alta/edición/borrado de productos (con subida de imagen a S3), gestión de estado de órdenes, dashboard de analytics (ingresos, ventas por día, productos más vendidos, stock bajo).

## Stack

- React 19 + React Router 7
- TypeScript + Vite 8
- Tailwind CSS 4
- Firebase (Authentication + Firestore) — SDK cliente, sin backend propio salvo lo mínimo
- AWS S3 para imágenes de producto, vía presigned URL (`api/presign-upload.ts`, Vercel Function)
- Vitest + Testing Library para tests

## Arquitectura y decisiones clave

### Estado global: Context API + useReducer, no una librería externa

El carrito (`CartContext`) se dispara desde componentes muy distintos entre sí (`ProductCard`, `CartPage`, `StoreHeader` para el contador) con operaciones bien definidas: agregar, quitar, cambiar cantidad, vaciar. Ese patrón — un estado con transiciones acotadas que necesita ser predecible y fácil de testear en aislado — es exactamente el caso de uso de `useReducer`: la lógica de transición vive en una función pura (el reducer) que se puede testear sin renderizar nada, y el Context solo expone `state` + `dispatch` sin lógica propia. Meter Redux o Zustand para un solo slice de estado de este tamaño hubiera sido overhead sin beneficio real; Context + useReducer ya da la misma predictabilidad sin dependencia externa.

El resto del estado global (`AuthContext`, `ProductsContext` para filtro/búsqueda/vista) sigue el mismo patrón de Context, pero sin reducer donde el estado es más simple (banderas y valores sueltos, no una colección con operaciones).

### Autenticación y autorización: reglas de Firestore, no la UI

Los guards de React (`RequireAuth`, `RequireAdmin`) solo ocultan rutas y botones — son UX, no seguridad. El control de acceso real vive en `firestore.rules`: cada colección valida ahí quién puede leer/escribir según `request.auth` y el rol guardado en `users/{uid}`. Esto importa en particular para el panel admin: aunque alguien manipule el bundle del cliente para saltarse `RequireAdmin`, las escrituras a `products`/`orders` con rol no-admin las rechaza Firestore, no React.

### Imágenes de producto: S3 con presigned URL, no un upload directo al backend

Las credenciales de AWS (`AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`) no pueden llegar nunca al bundle del cliente — cualquier variable con eso expuesta en el navegador es una credencial de AWS pública. La alternativa a mandar el archivo a un backend propio (que lo reenvíe a S3) es el patrón de **presigned URL**: un backend mínimo autoriza la operación y firma una URL de corta duración; el archivo va **directo del navegador a S3**, sin pasar por ningún servidor propio. Acá ese backend mínimo es una sola Vercel Function (`api/presign-upload.ts`) — no hace falta un servidor completo para una sola operación de este tipo, y Vercel Functions ya resuelve el deploy junto con el resto de la app.

Flujo completo, paso a paso:

1. El admin selecciona una imagen en el form de producto. El frontend (`uploadService.ts`) pide un ID token de Firebase del usuario logueado (`auth.currentUser.getIdToken()`).
2. El frontend hace `POST /api/presign-upload` con `{ fileName, fileType }` y el ID token en el header `Authorization: Bearer`.
3. La función decodifica el `uid` del token (sin verificar la firma ahí mismo) y reenvía ese mismo token como Bearer auth a la API REST de Firestore para leer `users/{uid}` — es Firestore quien verifica la firma del token y aplica sus reglas; si el rol no es `admin`, la función responde `403`.
4. Si el rol es admin, la función valida que `fileType` esté en la lista de tipos permitidos, arma una `key` única (`products/<uuid>-<nombre-saneado>`) y genera una URL firmada con `getSignedUrl` (AWS SDK v3), válida 60 segundos.
5. El frontend recibe `{ uploadUrl, publicUrl }` y hace un `PUT` directo a `uploadUrl` con el archivo — ese `PUT` va a S3, no pasa por Vercel.
6. `publicUrl` es la URL final que se guarda en el documento del producto en Firestore.

Las credenciales de AWS solo existen como variables de entorno del lado del servidor (Vercel Function); nunca se serializan al cliente.

## Instalación

Pensado para alguien sin experiencia previa configurando Firebase, AWS o Vercel.

### 1. Clonar e instalar dependencias

```bash
git clone <url-del-repo>
cd geekeame-store
npm install
```

### 2. Crear el proyecto de Firebase

1. Ir a [console.firebase.google.com](https://console.firebase.google.com) → "Agregar proyecto" → seguir el asistente (no hace falta Google Analytics).
2. **Authentication** → pestaña "Sign-in method" → habilitar el proveedor "Correo electrónico/contraseña".
3. **Firestore Database** → "Crear base de datos" → modo producción → elegir región (la más cercana a los usuarios esperados).
4. **Configuración del proyecto** (ícono de engranaje) → "Tus apps" → agregar una app web → copiar los valores del objeto `firebaseConfig` que muestra (apiKey, authDomain, projectId, storageBucket, messagingSenderId, appId).
5. Publicar `firestore.rules` y `firestore.indexes.json` con el Firebase CLI (`npm install -g firebase-tools`, `firebase login`, `firebase use geekeame-store`, `firebase deploy --only firestore:rules,firestore:indexes`) — `firebase.json` ya está configurado para esto. También se puede seguir pegando `firestore.rules` a mano en Firestore Database → Reglas → Publicar si se prefiere, pero el repo deja de ser la fuente de verdad si se hace así.
6. La primera vez que se navegue a "Mis pedidos" en desarrollo, Firestore puede pedir crear un **índice compuesto** (la consulta combina `where(userId)` + `orderBy(createdAt)`). El error en la consola del navegador trae un link directo para crearlo con un clic — hay que seguirlo la primera vez en cada proyecto de Firebase nuevo.

### 3. Crear el bucket de S3 en AWS

1. En la consola de AWS → S3 → "Crear bucket". Anotar el nombre y la región.
2. Configurar CORS del bucket para permitir `PUT` desde el/los dominio(s) donde corre la app (`http://localhost:5173` en desarrollo, el dominio de Vercel en producción).
3. IAM → crear un usuario con acceso programático y una policy acotada a ese bucket (mínimo `s3:PutObject`, no credenciales de cuenta raíz). Generar su Access Key ID y Secret Access Key.

### 4. Completar variables de entorno y correr en local

```bash
cp .env.example .env
# completar .env con los valores de Firebase (paso 2) y AWS (paso 3)
npm run dev
```

## Variables de entorno

Ver `.env.example`. Las que empiezan con `VITE_` son de Firebase y quedan expuestas en el bundle del cliente (es lo esperado, así funciona el SDK de Firebase). Las de AWS (`AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION`, `AWS_S3_BUCKET_NAME`) son solo para la Vercel Function y **nunca** deben llevar prefijo `VITE_` — si lo llevaran quedarían públicas en el bundle.

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
firestore.rules          # reglas de seguridad -- desplegables por CLI (ver "Seguridad" abajo)
firestore.indexes.json   # índices compuestos versionados -- hoy solo tiene el de orders (userId+createdAt), confirmado real; sincronizar con `firebase firestore:indexes` antes de asumirlo completo
firebase.json            # config de Firestore (rules/indexes) + Hosting -- Hosting no se usa para desplegar (el deploy real es en Vercel), solo firestore:rules/firestore:indexes
```

## Funcionalidad

- Catálogo público con búsqueda y detalle de producto
- Carrito de compras (persistido en contexto de React)
- Autenticación (registro/login) y checkout con creación de orden en Firestore
- Historial de órdenes del usuario
- Reseñas de producto: calificación 1-5 estrellas + comentario, una reseña por usuario por producto (editable), promedio visible en el detalle, restringida a quien compró el producto (`hasPurchasedProduct`)
- Favoritos por usuario
- Panel de administración (`/admin`, solo rol `admin`): alta/edición/borrado de productos con subida de imagen a S3, gestión de estado de órdenes, dashboard de analytics

## Seguridad

El control de acceso real vive en `firestore.rules`, no en la UI — los guards de React (`RequireAuth`, `RequireAdmin`) solo ocultan rutas y botones. Reglas e índices se despliegan con el Firebase CLI (`firebase deploy --only firestore:rules,firestore:indexes`), no a mano desde la consola — así el repo es la fuente de verdad en vez de una copia que hay que sincronizar manualmente. `firestore.indexes.json` documenta el índice compuesto confirmado (`orders`: `userId` + `createdAt`, sin el cual "Mis pedidos" falla en un proyecto de Firebase nuevo); si se agregan queries nuevas que Firestore pida indexar, hay que sumarlas ahí también.

Las credenciales de AWS jamás salen de la Vercel Function (ver "Imágenes de producto" arriba); el `.env` nunca se subió al repo (está en `.gitignore`).

## Deploy

Desplegado en Vercel. El build de producción corre `tsc -b && vite build`; `api/presign-upload.ts` se despliega como Vercel Function junto con el resto de la app. `vercel.json` reescribe todas las rutas que no empiecen con `/api` hacia `index.html` (necesario para que el ruteo del lado del cliente de React Router funcione en refresh/deep-link).

**URL de producción:** https://geekeame-store.vercel.app/

Las variables de entorno (todas las `VITE_*` de Firebase y las de AWS) se configuran en el dashboard de Vercel (Project Settings → Environment Variables), no solo en `.env` local — sin eso el build de producción falla o queda sin conexión a Firebase/S3.

## Documentación adicional

Guía de construcción ampliada y bitácora detallada de uso de IA, en Notion: https://app.notion.com/p/3c1745b6d1db81c4bd1adcdd0f32de37

## Bitácora de uso de IA

Registro de decisiones técnicas reales tomadas con asistencia de IA durante el desarrollo, no un resumen de "se pidió código y se usó" — cada entrada muestra la pregunta real, qué se aprendió, y la decisión que resultó.

| # | Prompt / pregunta | Qué se aprendió | Decisión tomada |
|---|---|---|---|
| 1 | ¿Por qué usar `useReducer` para el carrito en vez de `useState` o una librería como Zustand? | El carrito se dispara desde componentes muy distintos (`ProductCard`, `CartPage`, header) con operaciones acotadas (agregar/quitar/cambiar cantidad/vaciar) — ese patrón es el caso de uso típico de `useReducer`: centraliza la lógica de transición en una función pura, testeable en aislado, sin el boilerplate de una dependencia externa para un solo slice de estado. | `CartContext` + `useReducer`, sin librerías externas de manejo de estado. |
| 2 | ¿Cómo subir imágenes de producto a S3 sin exponer las credenciales de AWS en el frontend? | El patrón correcto es una presigned URL: un backend mínimo valida quién pide la subida y firma una URL de corta duración; el archivo va directo del navegador a S3, sin pasar por el backend ni por un servidor propio. | Vercel Function (`api/presign-upload.ts`) que valida rol admin reenviando el ID token a la API REST de Firestore, y devuelve una URL firmada con `expiresIn: 60`. |
| 3 | "Mis pedidos" tira error en producción pero funciona en local, ¿por qué? | La query combina `where(userId, ==, uid)` con `orderBy(createdAt)` — Firestore exige un índice compuesto para eso, y no se había creado en el proyecto de producción (sí existía, sin darse cuenta, en el de desarrollo). | Crear el índice desde el link que trae el error de Firestore en consola; documentar en el README que hay que recrearlo si el proyecto de Firebase cambia. |
| 4 | El botón "Todas" del catálogo y el logo del header deberían hacer lo mismo, ¿no? | No — son dos acciones distintas: "Todas" limpia el filtro de categoría pero se queda en la vista de catálogo; volver por el logo tiene que además "salir" del catálogo y mostrar la landing completa (hero, categorías, destacados). Necesitaban dos piezas de estado separadas en `ProductsContext`, no una sola bandera. | `goToLanding()` (limpia filtro/búsqueda y activa `showLanding`) separado del handler del pill "Todas" (solo limpia el filtro). |
| 5 | Después de un fix anterior, el corazón de favoritos se sale un poco del recuadro de la card — ¿qué cambió? | Se había agregado `relative` directo en el wrapper del botón, pero el caller ya le pasaba `absolute` por `className`. En el CSS que compila Tailwind, `relative` gana sobre `absolute` cuando ambas clases están presentes en el mismo elemento, sin importar el orden en que aparecen en el string — es el orden de las utilities en la hoja generada, no el de `className`, lo que decide. | Quitar el `relative` hardcodeado del wrapper: el componente confía en que el caller siempre pasa el positioning completo (`absolute top-N right-N z-10`) por props. |
| 6 | Después de la auditoría UI/UX completa, ¿cómo saber qué le falta al proyecto frente a lo que Henry realmente evalúa? | Comparar código contra una rúbrica externa con subagentes en paralelo (uno por bloque de criterios) encontró huecos que revisando pantalla por pantalla no aparecían — el más importante, que la bitácora de uso de IA no existía en el README, pesa en la nota tanto o más que varias mejoras de código juntas. | Priorizar el trabajo restante por impacto en la rúbrica (bitácora de IA primero, después `strict` mode, después el resto), no por lo que se nota más a simple vista. |
