import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  runTransaction,
  updateDoc,
  where,
} from "firebase/firestore";
import { db } from "./firebase";
import type { Order, OrderItemSnapshot, OrderStatus } from "../types/order";
import type { Product } from "../types/product";

export async function createOrder(
  userId: string,
  items: OrderItemSnapshot[],
  total: number,
): Promise<string> {
  const orderRef = doc(collection(db, "orders"));

  await runTransaction(db, async (transaction) => {
    const productRefs = items.map((item) =>
      doc(db, "products", item.productId),
    );

    // 1. Leer todos los productos involucrados
    const productSnaps = await Promise.all(
      productRefs.map((ref) => transaction.get(ref)),
    );

    // 2. Validar stock disponible
    productSnaps.forEach((snap, i) => {
      if (!snap.exists()) {
        throw new Error(`Producto no encontrado: ${items[i].name}`);
      }
      const product = snap.data() as Product;
      if (product.stock < items[i].quantity) {
        throw new Error(
          `Ya no hay stock suficiente de "${product.name}". Disponibles: ${product.stock}.`,
        );
      }
    });

    // 3. Descontar stock
    productSnaps.forEach((snap, i) => {
      const product = snap.data() as Product;
      transaction.update(productRefs[i], {
        stock: product.stock - items[i].quantity,
      });
    });

    // 4. Crear la orden
    transaction.set(orderRef, {
      userId,
      items,
      total,
      status: "pending" as OrderStatus,
      createdAt: Date.now(),
    });
  });

  return orderRef.id;
}

// Detalle de una orden puntual (OrderDetailPage). No filtra por userId acá:
// firestore.rules ya exige resource.data.userId == auth.uid || isAdmin()
// para leer un doc de "orders", así que un customer que intente abrir la
// orden de otro recibe permission-denied desde el propio SDK -- no hace
// falta duplicar esa validación en el cliente.
export async function getOrderById(id: string): Promise<Order | null> {
  const snap = await getDoc(doc(db, "orders", id));
  return snap.exists() ? ({ id: snap.id, ...snap.data() } as Order) : null;
}

export async function listOrdersForUser(userId: string): Promise<Order[]> {
  const q = query(
    collection(db, "orders"),
    where("userId", "==", userId),
    orderBy("createdAt", "desc"),
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Order);
}

// Listado para el panel admin: todas las órdenes, sin filtrar por dueño
// (firestore.rules ya exige isAdmin() para leer órdenes ajenas). El filtro
// por estado se hace en el cliente sobre este mismo listado en vez de con
// where("status", "==", ...) para no depender de un índice compuesto de
// Firestore (status + orderBy(createdAt)) que habría que crear aparte.
export async function listAllOrders(): Promise<Order[]> {
  const q = query(
    collection(db, "orders"),
    orderBy("createdAt", "desc"),
    limit(500),
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Order);
}

export async function updateOrderStatus(
  id: string,
  status: OrderStatus,
): Promise<void> {
  const ref = doc(db, "orders", id);
  await updateDoc(ref, { status, updatedAt: Date.now() });
}

// Gate para reseñas (ProductReviews): solo puede reseñar un producto quien
// ya lo compró. "Comprar" acá es cualquier orden que lo incluya salvo
// "cancelled" -- no se exige "completed" porque eso implicaría esperar a
// que el admin marque la entrega para poder opinar, y el negocio no pide
// eso, solo que la compra haya sido real (no cancelada/reembolsada). Toma
// Order[] en vez de pedir userId+productId y hacer el fetch acá adentro
// para poder reusar el mismo listado ya cargado por OrdersPage/
// ProductReviews sin duplicar la llamada a Firestore, y para que sea
// trivial de testear como función pura.
export function hasPurchasedProduct(orders: Order[], productId: string): boolean {
  return orders.some(
    (order) =>
      order.status !== "cancelled" &&
      order.items.some((item) => item.productId === productId),
  );
}
