import {
  collection,
  doc,
  getDocs,
  orderBy,
  query,
  runTransaction,
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

export async function listOrdersForUser(userId: string): Promise<Order[]> {
  const q = query(
    collection(db, "orders"),
    where("userId", "==", userId),
    orderBy("createdAt", "desc"),
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Order);
}
