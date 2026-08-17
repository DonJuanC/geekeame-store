import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { getProductById } from "../services/productsService";
import { LoadingState } from "../components/states/LoadingState";
import { ErrorState } from "../components/states/ErrorState";
import type { Product } from "../types/product";
import { useCart } from "../hooks/useCart";

export function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [status, setStatus] = useState<
    "loading" | "idle" | "error" | "not-found"
  >("loading");
  const { addItem } = useCart();

  useEffect(() => {
    if (!id) return;
    setStatus("loading");
    getProductById(id)
      .then((p) => {
        if (!p) {
          setStatus("not-found");
          return;
        }
        setProduct(p);
        setStatus("idle");
      })
      .catch(() => setStatus("error"));
  }, [id]);

  if (status === "loading")
    return <LoadingState label="Cargando producto..." />;
  if (status === "error")
    return <ErrorState message="No pudimos cargar este producto." />;
  if (status === "not-found" || !product)
    return <ErrorState message="Este producto no existe." />;

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <Link to="/" className="text-sm underline">
        ← Volver al catálogo
      </Link>
      <img
        src={product.imageUrl}
        alt={product.name}
        className="w-full aspect-square object-cover rounded-lg my-4"
      />
      <h1 className="text-xl font-bold">{product.name}</h1>
      <p className="text-gray-600 my-2">{product.description}</p>
      <p className="text-lg font-medium">
        ${product.price.toLocaleString("es-CO")}
        <button
          onClick={() =>
            addItem({
              productId: product.id,
              name: product.name,
              price: product.price,
              imageUrl: product.imageUrl,
            })
          }
          className="border rounded px-4 py-2 mt-3"
        >
          Agregar al carrito
        </button>
      </p>
    </div>
  );
}
