import { useEffect, useState, type ReactNode } from "react";
import type { DocumentData, QueryDocumentSnapshot } from "firebase/firestore";
import { listProducts } from "../services/productsService";
import type { Product } from "../types/product";
import { ProductsContext, type ProductsStatus } from "../hooks/useProducts";

type ResolvedStatus = Exclude<ProductsStatus, "loading">;

interface LoadedParams {
  categoryId: string | null;
  searchTerm: string;
}

export function ProductsProvider({ children }: { children: ReactNode }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [resolvedStatus, setResolvedStatus] =
    useState<ResolvedStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  // Parámetros para los que "products"/resolvedStatus ya son válidos.
  // Mientras no coincidan con categoryId/debouncedSearch actuales seguimos
  // "cargando" -- se deriva más abajo (isLoading) en vez de resetear con un
  // setStatus("loading") síncrono al arrancar el efecto, que dispara
  // react-hooks/set-state-in-effect. Mismo patrón que AdminProductsPage,
  // AdminOrdersPage, AdminProductFormPage y ProductDetailPage.
  const [loadedParams, setLoadedParams] = useState<LoadedParams | null>(null);

  // Paginación: cursor de la página actual (null = no hay más para pedir).
  // isLoadingMore es un loading aparte del "status" de la primera carga
  // para no reemplazar la grilla ya visible por un spinner de página
  // completa mientras se trae la siguiente tanda. loadMoreError también
  // va separado de "error": si falla "cargar más", los productos ya
  // listados se quedan visibles, no se pierden.
  const [cursor, setCursor] = useState<QueryDocumentSnapshot<DocumentData> | null>(
    null,
  );
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [loadMoreError, setLoadMoreError] = useState<string | null>(null);

  useEffect(() => {
    const timeoutId = setTimeout(() => setDebouncedSearch(searchInput), 400);
    return () => clearTimeout(timeoutId);
  }, [searchInput]);

  // Primera página del filtro actual. Se dispara de nuevo cada vez que
  // cambia categoryId o debouncedSearch, y reemplaza products/cursor desde
  // cero -- "cargar más" (loadMore) es una acción aparte, no vive en este
  // efecto.
  useEffect(() => {
    let cancelled = false;
    // loadMoreError se limpia acá (dentro de los callbacks async, no
    // síncrono al arrancar el efecto -- ver nota de loadedParams arriba,
    // mismo motivo) en vez de al inicio: un error de "cargar más" queda
    // obsoleto en cuanto cambia el filtro/búsqueda base. No hay diferencia
    // visible con limpiarlo síncrono, porque mientras esta carga está en
    // curso status es "loading" (isLoading arriba) y HomePage no renderiza
    // loadMoreError bajo ese status de todos modos.
    listProducts({ categoryId, searchTerm: debouncedSearch })
      .then((result) => {
        if (cancelled) return;
        setProducts(result.products);
        setCursor(result.nextCursor);
        setResolvedStatus("idle");
        setError(null);
        setLoadMoreError(null);
        setLoadedParams({ categoryId, searchTerm: debouncedSearch });
      })
      .catch((err) => {
        if (cancelled) return;
        console.error(err);
        setError("No pudimos cargar los productos. Intenta de nuevo.");
        setResolvedStatus("error");
        setLoadMoreError(null);
        setLoadedParams({ categoryId, searchTerm: debouncedSearch });
      });
    return () => {
      cancelled = true;
    };
  }, [categoryId, debouncedSearch]);

  // showLanding: si Home debe mostrar el hero/tiles/destacados o solo el
  // catálogo. Antes eso se deducía de categoryId === null && searchInput
  // === "", pero el pill "Todas" del catálogo también deja categoryId en
  // null -- entonces "Todas" (que debería quedarse en el catálogo)
  // disparaba el hero de nuevo por accidente. Ahora es un flag aparte:
  // cualquier interacción con el filtro/búsqueda lo apaga (aunque el
  // resultado sea "sin filtro"), y solo goToLanding() (logo, ver
  // StoreHeader) lo vuelve a prender.
  const [showLanding, setShowLanding] = useState(true);

  function updateCategoryId(id: string | null) {
    setShowLanding(false);
    setCategoryId(id);
  }

  function updateSearchInput(term: string) {
    setShowLanding(false);
    setSearchInput(term);
  }

  function goToLanding() {
    setShowLanding(true);
    setCategoryId(null);
    setSearchInput("");
  }

  const isLoading =
    loadedParams === null ||
    loadedParams.categoryId !== categoryId ||
    loadedParams.searchTerm !== debouncedSearch;

  const status: ProductsStatus = isLoading ? "loading" : resolvedStatus;

  async function loadMore() {
    if (!cursor || isLoadingMore || isLoading) return;
    setIsLoadingMore(true);
    setLoadMoreError(null);
    try {
      const result = await listProducts({
        categoryId,
        searchTerm: debouncedSearch,
        cursor,
      });
      setProducts((prev) => [...prev, ...result.products]);
      setCursor(result.nextCursor);
    } catch (err) {
      console.error(err);
      setLoadMoreError("No pudimos cargar más productos. Intenta de nuevo.");
    } finally {
      setIsLoadingMore(false);
    }
  }

  return (
    <ProductsContext.Provider
      value={{
        products,
        status,
        error,
        categoryId,
        searchInput,
        setCategoryId: updateCategoryId,
        setSearchInput: updateSearchInput,
        showLanding,
        goToLanding,
        hasMore: cursor !== null,
        isLoadingMore,
        loadMoreError,
        loadMore,
      }}
    >
      {children}
    </ProductsContext.Provider>
  );
}
