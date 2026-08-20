export interface Review {
  id: string;
  productId: string;
  userId: string;
  userEmail: string;
  rating: number;
  comment: string;
  createdAt: number;
  updatedAt?: number;
}

export interface ReviewInput {
  rating: number;
  comment: string;
}
