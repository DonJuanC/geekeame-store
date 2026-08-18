import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  createProduct,
  getProductById,
  updateProduct,
  type ProductInput,
} from "../../services/productsService";
import { PRODUCT_CATEGORIES } from "../../constants/categories";
import type { ProductCategoryId } from "../../types/product";

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
    errors.imageUrl = "La URL de la imagen es obligatoria.";
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
  const [status, setStatus] = useState<"editing" | "submitting" | "not-found">(
    "editing",
  );
  const [globalError, setGlobalError] = useState<string | null>(null);
  // Id para el que "fields"/"status" ya son válidos. Mientras no coincida
  // con el id actual de la ruta seguimos "cargando" -- se deriva más abajo
  // en vez de resetear con un setStatus("loading") síncrono al arrancar el
  // efecto (mismo motivo que en AdminProductsPage: react-hooks/set-state-in-effect).
  const [loadedId, setLoadedId] = useState<string | null>(null);
  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    getProductById(id)
      .then((product) => {
        if (cancelled) return;
        setLoadedId(id);
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
        setLoadedId(id);
        setGlobalError(friendlyError(null));
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  const isLoadingProduct = isEditing && loadedId !== id;

  function setField<K extends keyof FormFields>(key: K, value: FormFields[K]) {
    setFields((current) => ({ ...current, [key]: value }));
  }

  function handleBlur(key: keyof FormFields) {
    const fieldErrors = validate(fields);
    setErrors((current) => ({ ...current, [key]: fieldErrors[key] }));
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

  const isSubmitting = status === "submitting";

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
            <option value="">Elegí una categoría</option>
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
          <label className="text-sm font-medium" htmlFor="imageUrl">
            URL de la imagen
          </label>
          <input
            id="imageUrl"
            value={fields.imageUrl}
            disabled={isSubmitting}
            placeholder="https://..."
            onChange={(e) => setField("imageUrl", e.target.value)}
            onBlur={() => handleBlur("imageUrl")}
            className="w-full border rounded p-2 mt-1"
          />
          {/* TODO: reemplazar por upload a S3 con presigned URL (Vercel
              Function) cuando lleguemos a esa parte de la consigna. Por
              ahora el admin pega la URL de la imagen a mano. */}
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
