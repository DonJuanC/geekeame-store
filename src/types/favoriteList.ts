export interface FavoriteList {
  id: string;
  userId: string;
  name: string;
  // Solo ids, no snapshot del producto (a diferencia de OrderItemSnapshot
  // en pedidos): un pedido necesita "congelar" precio/nombre tal como
  // estaban al comprar, pero una lista de favoritos siempre debería
  // reflejar el estado actual del producto (precio vigente, si sigue
  // existiendo, etc.), así que FavoritesPage resuelve estos ids contra
  // productsService en el momento de mostrarlos.
  productIds: string[];
  createdAt: number;
  updatedAt?: number;
}
