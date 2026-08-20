import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  updateDoc,
  where,
} from "firebase/firestore";
import { db } from "./firebase";
import type { Order, OrderItemSnapshot, OrderStatus } from "../types/order";
import type { Product } from "../types/product";

export class OrderTimeoutError extends Error {
  constructor() {
    super("La operación tardó demasiado.");
    this.name = "OrderTimeoutError";
  }
}

const CREATE_ORDER_TIMEOUT_MS = 20_000;

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new OrderTimeoutError()), ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (err) => {
        clearTimeout(timer);
        reject(err);
      },
    );
  });
}

export async function createOrder(
  userId: string,
  items: OrderItemSnapshot[],
  total: number,
): Promise<string> {
  const orderRef = doc(collection(db, "orders"));

  await withTimeout(runTransaction(db, async (transaction) => {
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
  }), CREATE_ORDER_TIMEOUT_MS);

  return orderRef.id;
}

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

export async function listAllOrders(): Promise<Order[]> {
  const q = query(
    collection(db, "orders"),
    orderBy("createdAt", "desc"),
    limit(500),
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Order);
}

export function subscribeToAllOrders(
  onChange: (orders: Order[]) => void,
  onError: (error: Error) => void,
): () => void {
  const q = query(
    collection(db, "orders"),
    orderBy("createdAt", "desc"),
    limit(500),
  );
  return onSnapshot(
    q,
    (snap) => {
      onChange(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Order));
    },
    (err) => {
      onError(err instanceof Error ? err : new Error(String(err)));
    },
  );
}

export async function updateOrderStatus(
  id: string,
  status: OrderStatus,
): Promise<void> {
  const ref = doc(db, "orders", id);
  await updateDoc(ref, { status, updatedAt: Date.now() });
}

export function hasPurchasedProduct(orders: Order[], productId: string): boolean {
  return orders.some(
    (order) =>
      order.status !== "cancelled" &&
      order.items.some((item) => item.productId === productId),
  );
}
