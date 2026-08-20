import {
  useEffect,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useTheme } from "../../hooks/useTheme";
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
import { LoadingState } from "../../components/states/LoadingState";

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

function friendlyError(
  err: unknown,
  fallback = "Ocurrió un error al guardar el producto. Intenta de nuevo.",
): string {
  const code = (err as { code?: string })?.code;
  if (code === "permission-denied") {
    return "No tienes permisos para esta acción. Si crees que es un error, vuelve a iniciar sesión o consulta al administrador.";
  }
  return err instanceof Error ? err.message : fallback;
}

export function AdminProductFormPage() {
  const { id } = useParams<{ id: string }>();
  const isEditing = Boolean(id);
  const navigate = useNavigate();
  const { theme } = useTheme();
  const isDark = theme === "dark";

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
      .catch((err) => {
        if (cancelled) return;
        console.error(err);
        setLoadedId(targetId);
        setStatus("error");
        setGlobalError(
          friendlyError(
            err,
            "Ocurrió un error al cargar el producto. Intenta de nuevo.",
          ),
        );
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

  const backLink = (
    <Link
      to="/admin"
      className={`text-sm font-medium ${
        isDark ? "text-[#c4b5fd] hover:text-[#a78bfa]" : "text-[#6d28d9] hover:text-[#4c1d95]"
      }`}
    >
      ← Volver al listado
    </Link>
  );

  if (isLoadingProduct) {
    return <LoadingState label="Cargando producto…" dark={isDark} />;
  }

  if (status === "error") {
    return (
      <div className="flex flex-col gap-4">
        {backLink}
        <ErrorState
          message={globalError ?? "No pudimos cargar el producto."}
          onRetry={handleRetry}
          dark={isDark}
        />
      </div>
    );
  }

  if (status === "not-found") {
    return (
      <div>
        <p className={isDark ? "text-[#f87171]" : "text-red-600"}>Este producto no existe.</p>
        {backLink}
      </div>
    );
  }

  const isSubmitting = status === "submitting" || imageStatus === "uploading";
  const inputClass = `w-full rounded-lg p-2 mt-1 border focus:outline-none focus:ring-2 focus:ring-[#c4b5fd] ${
    isDark ? "bg-[#161320] border-[#2e2a45] text-[#f5f3ff]" : "border-[#ede9fe]"
  }`;
  const errorClass = isDark ? "text-[#f87171] text-sm mt-1" : "text-red-600 text-sm mt-1";
  const cardClass = `rounded-2xl border p-5 sm:p-6 ${
    isDark ? "bg-[#1c1a29] border-[#2e2a45]" : "border-[#ede9fe]"
  }`;
  const secondaryButtonClass = `rounded-full border px-4 py-2.5 text-sm font-medium transition-colors ${
    isDark
      ? "border-[#3f3a5c] text-[#c4b5fd] hover:bg-[#211d34]"
      : "border-[#ddd6fe] text-[#6d28d9] hover:bg-[#f5f3ff]"
  }`;

  return (
    <div className="max-w-2xl">
      {backLink}
      <h1 className="text-xl font-bold mt-4 mb-1">
        {isEditing ? "Editar producto" : "Nuevo producto"}
      </h1>
      <p className={`text-sm mb-4 ${isDark ? "text-[#9ca3af]" : "text-gray-500"}`}>
        {isEditing && fields.name
          ? `Editando "${fields.name}".`
          : "Completa los datos del producto para el catálogo."}
      </p>

      <div className={cardClass}>
        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <div className="grid sm:grid-cols-[220px_1fr] gap-6">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium" htmlFor="image">
                Imagen del producto
              </label>
              <div
                className={`relative aspect-square w-full max-w-[220px] rounded-xl border-2 border-dashed overflow-hidden flex items-center justify-center ${
                  isDark ? "border-[#3f3a5c] bg-[#161320]" : "border-[#ddd6fe] bg-[#f5f3ff]"
                }`}
              >
                {fields.imageUrl ? (
                  <img
                    src={fields.imageUrl}
                    alt="Preview del producto"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-5xl" aria-hidden="true">
                    🖼️
                  </span>
                )}
                {imageStatus === "uploading" && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50 text-white text-sm font-medium">
                    Subiendo…
                  </div>
                )}
              </div>
              <label
                htmlFor="image"
                className={`self-start cursor-pointer rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
                  isSubmitting ? "pointer-events-none opacity-50" : ""
                } ${
                  isDark
                    ? "border-[#3f3a5c] text-[#c4b5fd] hover:bg-[#211d34]"
                    : "border-[#ddd6fe] text-[#6d28d9] hover:bg-[#f5f3ff]"
                }`}
              >
                {fields.imageUrl ? "Cambiar imagen" : "Subir imagen"}
              </label>
              <input
                id="image"
                type="file"
                accept={ALLOWED_IMAGE_TYPES.join(",")}
                disabled={isSubmitting}
                onChange={handleImageChange}
                aria-invalid={Boolean(errors.imageUrl || (imageStatus === "error" && imageUploadError))}
                aria-describedby={errors.imageUrl ? "imageUrl-error" : undefined}
                className="sr-only"
              />
              <p className={`text-xs ${isDark ? "text-[#6b6485]" : "text-gray-400"}`}>
                Cuadrada, hasta 5MB (PNG, JPG, WEBP o GIF).
              </p>
              {imageStatus === "error" && imageUploadError && (
                <p role="alert" className={errorClass}>
                  {imageUploadError}
                </p>
              )}
              {errors.imageUrl && (
                <p id="imageUrl-error" className={errorClass}>
                  {errors.imageUrl}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-4">
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
                  aria-invalid={Boolean(errors.name)}
                  aria-describedby={errors.name ? "name-error" : undefined}
                  className={inputClass}
                />
                {errors.name && (
                  <p id="name-error" className={errorClass}>
                    {errors.name}
                  </p>
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
                  aria-invalid={Boolean(errors.categoryId)}
                  aria-describedby={errors.categoryId ? "categoryId-error" : undefined}
                  className={inputClass}
                >
                  <option value="">Elige una categoría</option>
                  {PRODUCT_CATEGORIES.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.label}
                    </option>
                  ))}
                </select>
                {errors.categoryId && (
                  <p id="categoryId-error" className={errorClass}>
                    {errors.categoryId}
                  </p>
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
                    step="100"
                    value={fields.price}
                    disabled={isSubmitting}
                    onChange={(e) => setField("price", e.target.value)}
                    onBlur={() => handleBlur("price")}
                    aria-invalid={Boolean(errors.price)}
                    aria-describedby={errors.price ? "price-error" : undefined}
                    className={inputClass}
                  />
                  {errors.price && (
                    <p id="price-error" className={errorClass}>
                      {errors.price}
                    </p>
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
                    aria-invalid={Boolean(errors.stock)}
                    aria-describedby={errors.stock ? "stock-error" : undefined}
                    className={inputClass}
                  />
                  {errors.stock && (
                    <p id="stock-error" className={errorClass}>
                      {errors.stock}
                    </p>
                  )}
                </div>
              </div>
            </div>
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
              aria-invalid={Boolean(errors.description)}
              aria-describedby={errors.description ? "description-error" : undefined}
              className={inputClass}
              rows={4}
            />
            {errors.description && (
              <p id="description-error" className={errorClass}>
                {errors.description}
              </p>
            )}
          </div>

          {globalError && (
            <p
              role="alert"
              className={isDark ? "text-[#f87171] text-sm" : "text-red-600 text-sm"}
            >
              {globalError}
            </p>
          )}

          <div className={`flex items-center justify-end gap-3 pt-2 border-t ${isDark ? "border-[#2e2a45]" : "border-[#ede9fe]"}`}>
            <Link to="/admin" className={secondaryButtonClass}>
              Cancelar
            </Link>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-full px-4 py-2.5 text-sm font-medium bg-[#7c3aed] text-white hover:bg-[#6d28d9] disabled:opacity-50 transition-colors"
            >
              {isSubmitting
                ? "Guardando…"
                : isEditing
                  ? "Guardar cambios"
                  : "Crear producto"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
