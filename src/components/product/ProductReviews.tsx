import { useCallback, useEffect, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import {
  listReviewsForProduct,
  summarizeReviews,
  upsertReview,
} from "../../services/reviewsService";
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

  const fetchReviews = useCallback(() => {
    setStatus("loading");
    return listReviewsForProduct(productId)
      .then((result) => {
        setReviews(result);
        setStatus("idle");
      })
      .catch(() => setStatus("error"));
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
    } catch {
      setSubmitStatus("error");
      setSubmitError("No pudimos guardar tu reseña. Intenta de nuevo.");
    }
  }

  return (
    <div className="mt-8 border-t pt-6">
      <div className="flex items-center gap-3 mb-4">
        <h2 className="text-lg font-bold">Reseñas</h2>
        {count > 0 && (
          <span className="flex items-center gap-2 text-sm text-gray-600">
            <StarRating value={average} readOnly size="sm" />
            {average.toFixed(1)} ({count})
          </span>
        )}
      </div>

      {status === "loading" && <LoadingState label="Cargando reseñas..." />}
      {status === "error" && (
        <ErrorState
          message="No pudimos cargar las reseñas."
          onRetry={fetchReviews}
        />
      )}

      {status === "idle" && (
        <>
          {count === 0 && (
            <p className="text-gray-500 text-sm mb-4">
              Todavía no hay reseñas para este producto.
            </p>
          )}

          <div className="flex flex-col gap-4 mb-6">
            {reviews.map((review) => (
              <div key={review.id} className="border rounded p-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">
                    {displayName(review.userEmail)}
                  </span>
                  <StarRating value={review.rating} readOnly size="sm" />
                </div>
                {review.comment && (
                  <p className="text-sm text-gray-600 mt-1">
                    {review.comment}
                  </p>
                )}
                <p className="text-xs text-gray-400 mt-1">
                  {new Date(review.createdAt).toLocaleDateString("es-CO")}
                </p>
              </div>
            ))}
          </div>

          {user ? (
            <form
              onSubmit={handleSubmit}
              className="border rounded p-3 flex flex-col gap-3"
            >
              <p className="text-sm font-medium">
                {ownReview ? "Edita tu reseña" : "Deja tu reseña"}
              </p>
              <StarRating value={rating} onChange={setRating} />
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="¿Qué te pareció el producto? (opcional)"
                className="border rounded p-2 text-sm"
                rows={3}
              />
              {submitStatus === "error" && (
                <p className="text-red-600 text-sm">{submitError}</p>
              )}
              <button
                type="submit"
                disabled={rating === 0 || submitStatus === "submitting"}
                className="border rounded px-4 py-2 text-sm bg-black text-white disabled:opacity-50 self-start"
              >
                {submitStatus === "submitting"
                  ? "Guardando..."
                  : ownReview
                    ? "Actualizar reseña"
                    : "Publicar reseña"}
              </button>
            </form>
          ) : (
            <p className="text-sm text-gray-500">
              <Link to="/login" className="underline">
                Inicia sesión
              </Link>{" "}
              para dejar tu reseña.
            </p>
          )}
        </>
      )}
    </div>
  );
}
