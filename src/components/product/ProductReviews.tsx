import { useCallback, useEffect, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { useTheme } from "../../hooks/useTheme";
import {
  listReviewsForProduct,
  summarizeReviews,
  upsertReview,
} from "../../services/reviewsService";
import { hasPurchasedProduct, listOrdersForUser } from "../../services/ordersService";
import type { Review } from "../../types/review";
import { StarRating } from "./StarRating";
import { LoadingState } from "../states/LoadingState";
import { ErrorState } from "../states/ErrorState";

// Muestra solo la parte antes de la @: no hay displayName en UserProfile
// todavía, y mostrar el email completo de otro usuario en una review
// pública que ve cualquiera (logueado o no, ver firestore.rules) expone
// más de lo necesario para lo que aporta acá.
function displayName(email: string): string {
  return email.split("@")[0] ?? email;
}

interface ProductReviewsProps {
  productId: string;
}

export function ProductReviews({ productId }: ProductReviewsProps) {
  const { user } = useAuth();
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const [reviews, setReviews] = useState<Review[]>([]);
  const [status, setStatus] = useState<"loading" | "idle" | "error">(
    "loading",
  );

  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  // La propia review del usuario se precarga en el form UNA sola vez (al
  // llegar por primera vez), no en cada fetchReviews: si no, cada
  // re-fetch (ej. después de guardar) pisaría lo que el usuario está
  // escribiendo en ese momento.
  const [prefilled, setPrefilled] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<
    "idle" | "submitting" | "error"
  >("idle");
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Gate de "reseña solo si compraste": null mientras se resuelve (para no
  // mostrar el form un instante y esconderlo después), true/false una vez
  // que se sabe. Se resetea a null cuando cambia el usuario (logout/login
  // con otra cuenta) para no arrastrar el resultado de otra persona.
  const [canReview, setCanReview] = useState<boolean | null>(null);

  useEffect(() => {
    if (!user) {
      setCanReview(null);
      return;
    }
    let cancelled = false;
    setCanReview(null);
    listOrdersForUser(user.uid).then((orders) => {
      if (cancelled) return;
      setCanReview(hasPurchasedProduct(orders, productId));
    });
    return () => {
      cancelled = true;
    };
  }, [user, productId]);

  const fetchReviews = useCallback(() => {
    setStatus("loading");
    return listReviewsForProduct(productId)
      .then((result) => {
        setReviews(result);
        setStatus("idle");
      })
      .catch((err) => {
        console.error(err);
        setStatus("error");
      });
  }, [productId]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  const ownReview = user && reviews.find((r) => r.userId === user.uid);

  useEffect(() => {
    if (!prefilled && ownReview) {
      setRating(ownReview.rating);
      setComment(ownReview.comment);
      setPrefilled(true);
    }
  }, [prefilled, ownReview]);

  const { average, count } = summarizeReviews(reviews);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!user || rating === 0) return;

    setSubmitStatus("submitting");
    setSubmitError(null);
    try {
      await upsertReview(productId, user.uid, user.email, {
        rating,
        comment,
      });
      setSubmitStatus("idle");
      fetchReviews();
    } catch (err) {
      console.error(err);
      setSubmitStatus("error");
      setSubmitError("No pudimos guardar tu reseña. Intenta de nuevo.");
    }
  }

  const borderColor = isDark ? "border-[#2e2a45]" : "border-[#ede9fe]";
  const mutedText = isDark ? "text-[#9ca3af]" : "text-gray-500";

  return (
    <div className={`mt-8 border-t pt-6 ${borderColor}`}>
      <div className="flex items-center gap-3 mb-4">
        <h2 className="text-lg font-bold">Reseñas</h2>
        {count > 0 && (
          <span className={`flex items-center gap-2 text-sm ${mutedText}`}>
            <StarRating value={average} readOnly size="sm" dark={isDark} />
            {average.toFixed(1)} ({count})
          </span>
        )}
      </div>

      {status === "loading" && <LoadingState label="Cargando reseñas..." dark={isDark} />}
      {status === "error" && (
        <ErrorState
          message="No pudimos cargar las reseñas."
          onRetry={fetchReviews}
          dark={isDark}
        />
      )}

      {status === "idle" && (
        <>
          {count === 0 && (
            <p className={`text-sm mb-4 ${mutedText}`}>
              Todavía no hay reseñas para este producto.
            </p>
          )}

          <div className="flex flex-col gap-4 mb-6">
            {reviews.map((review) => (
              <div
                key={review.id}
                className={`rounded-xl border p-3 ${
                  isDark ? "bg-[#1c1a29] border-[#2e2a45]" : borderColor
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">
                    {displayName(review.userEmail)}
                  </span>
                  <StarRating value={review.rating} readOnly size="sm" dark={isDark} />
                </div>
                {review.comment && (
                  <p className={`text-sm mt-1 ${mutedText}`}>{review.comment}</p>
                )}
                <p className={`text-xs mt-1 ${isDark ? "text-[#6b6485]" : "text-gray-400"}`}>
                  {new Date(review.createdAt).toLocaleDateString("es-CO")}
                </p>
              </div>
            ))}
          </div>

          {!user && (
            <p className={`text-sm ${mutedText}`}>
              <Link
                to="/login"
                className={isDark ? "text-[#c4b5fd] hover:text-[#a78bfa]" : "text-[#6d28d9] hover:text-[#4c1d95]"}
              >
                Inicia sesión
              </Link>{" "}
              para dejar tu reseña.
            </p>
          )}

          {user && canReview === false && (
            <p className={`text-sm ${mutedText}`}>
              Solo puedes reseñar productos que compraste.
            </p>
          )}

          {user && canReview && (
            <form
              onSubmit={handleSubmit}
              className={`rounded-xl border p-3 flex flex-col gap-3 ${
                isDark ? "bg-[#1c1a29] border-[#2e2a45]" : borderColor
              }`}
            >
              <p className="text-sm font-medium">
                {ownReview ? "Edita tu reseña" : "Deja tu reseña"}
              </p>
              <StarRating value={rating} onChange={setRating} dark={isDark} />
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                aria-label="Comentario de tu reseña"
                placeholder="¿Qué te pareció el producto? (opcional)"
                className={`rounded-lg p-2 text-sm border focus:outline-none focus:ring-2 focus:ring-[#c4b5fd] ${
                  isDark ? "bg-[#161320] border-[#2e2a45] text-[#f5f3ff]" : borderColor
                }`}
                rows={3}
              />
              {submitStatus === "error" && (
                <p
                  role="alert"
                  className={`text-sm ${isDark ? "text-[#f87171]" : "text-red-600"}`}
                >
                  {submitError}
                </p>
              )}
              <button
                type="submit"
                disabled={rating === 0 || submitStatus === "submitting"}
                className="rounded-full px-4 py-2.5 text-sm font-medium bg-[#7c3aed] text-white hover:bg-[#6d28d9] disabled:opacity-50 self-start transition-colors"
              >
                {submitStatus === "submitting"
                  ? "Guardando..."
                  : ownReview
                    ? "Actualizar reseña"
                    : "Publicar reseña"}
              </button>
            </form>
          )}
        </>
      )}
    </div>
  );
}
