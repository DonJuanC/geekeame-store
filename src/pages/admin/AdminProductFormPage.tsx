import {
  useEffect,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  createProduct,
  getProductById,
  updateProduct,
  type ProductInput,
} from "../../services/productsService";
import { uploadProductImage } from "../../services/uploadService";
import { PRODUCT_CATEGORIES } from "../../constants/categories";
import type { ProductCategoryId } from "../../types/product";
import { ErrorState } from "../../components/states/ErrorState";

type FormFields = {
  name: string;
  price: string;
  stock: string;
  categoryId: ProductCategoryId | "";
  description: string;
  imageUrl: string;
};

type FormErrors = Partial<Record<keyof FormFields, string>>;

const EMPTY_FIELDS: FormFields = {
  name: "",
  price: "",
  stock: "",
  categoryId: "",
  description: "",
  imageUrl: "",
};

const ALLOWED_IMAGE_TYPES = [
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
];
const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5MB

function validate(fields: FormFields): FormErrors {
  const errors: FormErrors = {};

  if (!fields.name.trim()) {
    errors.name = "El nombre es obligatorio.";
  }

  const price = Number(fields.price);
  if (!fields.price || Number.isNaN(price) || price <= 0) {
    errors.price = "El precio debe ser mayor a 0.";
  }

  const stock = Number(fields.stock);
  if (fields.stock === "" || Number.isNaN(stock) || stock < 0) {
    errors.stock = "El stock no puede ser negativo.";
  }

  if (!fields.categoryId) {
    errors.categoryId = "Elige una categoría.";
  }

  if (!fields.imageUrl.trim()) {
    errors.imageUrl = "La imagen del producto es obligatoria.";
  }

  if (!fields.description.trim()) {
    errors.description = "La descripción es obligatoria.";
  }

  return errors;
}

function friendlyError(err: unknown): string {
  const code = (err as { code?: string })?.code;
  if (code === "permission-denied") {
    return "No tienes permisos para esta acción. Si crees que es un error, vuelve a iniciar sesión o consulta al administrador.";
  }
  return err instanceof Error
    ? err.message
    : "Ocurrió un error al guardar el producto. Intenta de nuevo.";
}

export function AdminProductFormPage() {
  const { id } = useParams<{ id: string }>();
  const isEditing = Boolean(id);
  const navigate = useNavigate();

  const [fields, setFields] = useState<FormFields>(EMPTY_FIELDS);
  const [errors, setErrors] = useState<FormErrors>({});
  const [status, setStatus] = useState<
    "editing" | "submitting" | "not-found" | "error"
  >("editing");
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [imageStatus, setImageStatus] = useState<
    "idle" | "uploading" | "error"
  >("idle");
  const [imageUploadError, setImageUploadError] = useState<string | null>(
    null,
  );
  // Id para el que "fields"/"status" ya son válidos. Mientras no coincida
  // con el id actual de la ruta seguimos "cargando" -- se deriva más abajo
  // en vez de resetear con un setStatus("loading") síncrono al arrancar el
  // efecto (react-hooks/set-state-in-effect). Extraído a fetchProduct para
  // poder reusarlo desde el botón "Reintentar".
  const [loadedId, setLoadedId] = useState<string | null>(null);

  function fetchProduct(targetId: string) {
    let cancelled = false;
    getProductById(targetId)
      .then((product) => {
        if (cancelled) return;
        setLoadedId(targetId);
        if (!product) {
          setStatus("not-found");
          return;
        }
        setFields({
          name: product.name,
          price: String(product.price),
          stock: String(product.stock),
          categoryId: product.categoryId,
          description: product.description,
          imageUrl: product.imageUrl,
        });
        setStatus("editing");
      })
      .catch(() => {
        if (cancelled) return;
        setLoadedId(targetId);
        setStatus("error");
        setGlobalError(friendlyError(null));
      });
    return () => {
      cancelled = true;
    };
  }

  useEffect(() => {
    if (!id) return;
    return fetchProduct(id);
  }, [id]);

  function handleRetry() {
    if (!id) return;
    setLoadedId(null);
    setGlobalError(null);
    fetchProduct(id);
  }

  const isLoadingProduct = isEditing && loadedId !== id;

  function setField<K extends keyof FormFields>(key: K, value: FormFields[K]) {
    setFields((current) => ({ ...current, [key]: value }));
  }

  function handleBlur(key: keyof FormFields) {
    const fieldErrors = validate(fields);
    setErrors((current) => ({ ...current, [key]: fieldErrors[key] }));
  }

  async function handleImageChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    // Permite volver a elegir el mismo archivo si la subida anterior falló.
    e.target.value = "";
    if (!file) return;

    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      setImageStatus("error");
      setImageUploadError("Formato no soportado. Usa PNG, JPG, WEBP o GIF.");
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      setImageStatus("error");
      setImageUploadError("La imagen no puede pesar más de 5MB.");
      return;
    }

    setImageStatus("uploading");
    setImageUploadError(null);
    try {
      const publicUrl = await uploadProductImage(file);
      setField("imageUrl", publicUrl);
      setErrors((current) => ({ ...current, imageUrl: undefined }));
      setImageStatus("idle");
    } catch (err) {
      setImageStatus("error");
      setImageUploadError(
        err instanceof Error
          ? err.message
          : "No pudimos subir la imagen. Intenta de nuevo.",
      );
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const fieldErrors = validate(fields);
    setErrors(fieldErrors);
    if (Object.keys(fieldErrors).length > 0) return;

    setStatus("submitting");
    setGlobalError(null);

    const input: ProductInput = {
      name: fields.name.trim(),
      price: Number(fields.price),
      stock: Number(fields.stock),
      categoryId: fields.categoryId as ProductCategoryId,
      description: fields.description.trim(),
      imageUrl: fields.imageUrl.trim(),
    };

    try {
      if (id) {
        await updateProduct(id, input);
      } else {
        await createProduct(input);
      }
      navigate("/admin");
    } catch (err) {
      setGlobalError(friendlyError(err));
      setStatus("editing");
    }
  }

  if (isLoadingProduct) {
    return <p className="text-gray-500">Cargando producto…</p>;
  }

  if (status === "error") {
    return (
      <div className="flex flex-col gap-4">
        <Link to="/admin" className="text-sm underline">
          ← Volver al listado
        </Link>
        <ErrorState
          message={globalError ?? "No pudimos cargar el producto."}
          onRetry={handleRetry}
        />
      </div>
    );
  }

  if (status === "not-found") {
    return (
      <div>
        <p className="text-red-600">Este producto no existe.</p>
        <Link to="/admin" className="text-sm underline">
          ← Volver al listado
        </Link>
      </div>
    );
  }

  const isSubmitting = status === "submitting" || imageStatus === "uploading";

  return (
    <div className="max-w-lg">
      <Link to="/admin" className="text-sm underline">
        ← Volver al listado
      </Link>
      <h1 className="text-xl font-bold my-4">
        {isEditing ? "Editar producto" : "Nuevo producto"}
      </h1>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label className="text-sm font-medium" htmlFor="name">
            Nombre
          </label>
          <input
            id="name"
            value={fields.name}
            disabled={isSubmitting}
            onChange={(e) => setField("name", e.target.value)}
            onBlur={() => handleBlur("name")}
            className="w-full border rounded p-2 mt-1"
          />
          {errors.name && (
            <p className="text-red-600 text-sm mt-1">{errors.name}</p>
          )}
        </div>

        <div>
          <label className="text-sm font-medium" htmlFor="categoryId">
            Categoría
          </label>
          <select
            id="categoryId"
            value={fields.categoryId}
            disabled={isSubmitting}
            onChange={(e) =>
              setField("categoryId", e.target.value as ProductCategoryId)
            }
            onBlur={() => handleBlur("categoryId")}
            className="w-full border rounded p-2 mt-1"
          >
            <option value="">Elige una categoría</option>
            {PRODUCT_CATEGORIES.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>
          {errors.categoryId && (
            <p className="text-red-600 text-sm mt-1">{errors.categoryId}</p>
          )}
        </div>

        <div className="flex gap-4">
          <div className="flex-1">
            <label className="text-sm font-medium" htmlFor="price">
              Precio
            </label>
            <input
              id="price"
              type="number"
              min="0"
              value={fields.price}
              disabled={isSubmitting}
              onChange={(e) => setField("price", e.target.value)}
              onBlur={() => handleBlur("price")}
              className="w-full border rounded p-2 mt-1"
            />
            {errors.price && (
              <p className="text-red-600 text-sm mt-1">{errors.price}</p>
            )}
          </div>

          <div className="flex-1">
            <label className="text-sm font-medium" htmlFor="stock">
              Stock
            </label>
            <input
              id="stock"
              type="number"
              min="0"
              value={fields.stock}
              disabled={isSubmitting}
              onChange={(e) => setField("stock", e.target.value)}
              onBlur={() => handleBlur("stock")}
              className="w-full border rounded p-2 mt-1"
            />
            {errors.stock && (
              <p className="text-red-600 text-sm mt-1">{errors.stock}</p>
            )}
          </div>
        </div>

        <div>
          <label className="text-sm font-medium" htmlFor="image">
            Imagen del producto
          </label>
          <input
            id="image"
            type="file"
            accept={ALLOWED_IMAGE_TYPES.join(",")}
            disabled={isSubmitting}
            onChange={handleImageChange}
            className="w-full border rounded p-2 mt-1"
          />
          {imageStatus === "uploading" && (
            <p className="text-gray-500 text-sm mt-1">Subiendo imagen…</p>
          )}
          {imageStatus === "error" && imageUploadError && (
            <p className="text-red-600 text-sm mt-1">{imageUploadError}</p>
          )}
          {errors.imageUrl && (
            <p className="text-red-600 text-sm mt-1">{errors.imageUrl}</p>
          )}
          {fields.imageUrl && (
            <img
              src={fields.imageUrl}
              alt="Preview"
              className="w-20 h-20 object-cover rounded mt-2"
            />
          )}
        </div>

        <div>
          <label className="text-sm font-medium" htmlFor="description">
            Descripción
          </label>
          <textarea
            id="description"
            value={fields.description}
            disabled={isSubmitting}
            onChange={(e) => setField("description", e.target.value)}
            onBlur={() => handleBlur("description")}
            className="w-full border rounded p-2 mt-1"
            rows={4}
          />
          {errors.description && (
            <p className="text-red-600 text-sm mt-1">{errors.description}</p>
          )}
        </div>

        {globalError && <p className="text-red-600 text-sm">{globalError}</p>}

        <button
          type="submit"
          disabled={isSubmitting}
          className="border rounded px-4 py-2 bg-black text-white disabled:opacity-50"
        >
          {isSubmitting
            ? "Guardando…"
            : isEditing
              ? "Guardar cambios"
              : "Crear producto"}
        </button>
      </form>
    </div>
  );
}
