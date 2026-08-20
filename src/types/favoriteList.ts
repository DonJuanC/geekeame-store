export interface FavoriteList {
  id: string;
  userId: string;
  name: string;
  productIds: string[];
  createdAt: number;
  updatedAt?: number;
}
