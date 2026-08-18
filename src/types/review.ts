export interface Review {
  id: string;
  productId: string;
  userId: string;
  // Denormalizado en el momento de crear la review: evita tener que leer
  // /users/{uid} por cada review que se lista (N+1) solo para mostrar quién
  // la escribió. UserProfile no tiene displayName todavía (solo email), así
  // que se guarda el email tal cual.
  userEmail: string;
  rating: number; // entero 1-5
  comment: string;
  createdAt: number;
  updatedAt?: number;
}

export interface ReviewInput {
  rating: number;
  comment: string;
}
