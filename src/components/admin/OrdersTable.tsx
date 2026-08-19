import type { Order, OrderStatus } from "../../types/order";
import {
  ORDER_STATUS_LABELS,
  ORDER_STATUS_OPTIONS,
} from "../../constants/orderStatus";

interface OrderRowProps {
  order: Order;
  isUpdating: boolean;
  onStatusChange: (order: Order, status: OrderStatus) => void;
  dark: boolean;
}

function OrderRow({ order, isUpdating, onStatusChange, dark }: OrderRowProps) {
  const mutedText = dark ? "text-[#9ca3af]" : "text-gray-600";
  return (
    <tr className={`border-b last:border-b-0 ${dark ? "border-[#2e2a45]" : ""}`}>
      <td className="p-2 text-sm font-medium">{order.id.slice(0, 8)}</td>
      <td className={`p-2 text-sm ${mutedText}`}>{order.userId.slice(0, 8)}</td>
      <td className={`p-2 text-sm ${mutedText}`}>
        {new Date(order.createdAt).toLocaleDateString("es-CO")}
      </td>
      <td className="p-2 text-sm">{order.items.length}</td>
      <td className="p-2 text-sm">${order.total.toLocaleString("es-CO")}</td>
      <td className="p-2 text-sm">
        <select
          value={order.status}
          disabled={isUpdating}
          aria-label={`Cambiar estado del pedido ${order.id.slice(0, 8)}`}
          onChange={(e) =>
            onStatusChange(order, e.target.value as OrderStatus)
          }
          className={`rounded-lg border p-1 disabled:opacity-50 ${
            dark ? "bg-[#161320] border-[#2e2a45] text-[#f5f3ff]" : "border-[#ddd6fe]"
          }`}
        >
          {ORDER_STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {ORDER_STATUS_LABELS[s]}
            </option>
          ))}
        </select>
      </td>
    </tr>
  );
}

interface OrdersTableProps {
  orders: Order[];
  updatingId: string | null;
  onStatusChange: (order: Order, status: OrderStatus) => void;
  dark?: boolean;
}

export function OrdersTable({
  orders,
  updatingId,
  onStatusChange,
  dark = false,
}: OrdersTableProps) {
  const headClass = `p-2 text-xs uppercase ${dark ? "text-[#9ca3af]" : "text-gray-500"}`;
  return (
    <div className={`overflow-x-auto rounded-xl border ${dark ? "border-[#2e2a45]" : "border-[#ede9fe]"}`}>
      <table className="w-full text-left">
        <thead className={dark ? "bg-[#1c1a29]" : "bg-gray-50"}>
          <tr>
            <th className={headClass}>Orden</th>
            <th className={headClass}>Cliente</th>
            <th className={headClass}>Fecha</th>
            <th className={headClass}>Items</th>
            <th className={headClass}>Total</th>
            <th className={headClass}>Estado</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((order) => (
            <OrderRow
              key={order.id}
              order={order}
              isUpdating={updatingId === order.id}
              onStatusChange={onStatusChange}
              dark={dark}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function OrdersTableSkeleton({ dark = false }: { dark?: boolean }) {
  return (
    <div
      className={`overflow-x-auto rounded-xl border animate-pulse ${dark ? "border-[#2e2a45]" : "border-[#ede9fe]"}`}
    >
      <table className="w-full text-left">
        <tbody>
          {[0, 1, 2].map((row) => (
            <tr key={row} className={`border-b last:border-b-0 ${dark ? "border-[#2e2a45]" : ""}`}>
              {[0, 1, 2, 3, 4, 5].map((col) => (
                <td key={col} className="p-2">
                  <div className={`h-4 rounded ${dark ? "bg-[#2e2a45]" : "bg-gray-200"}`} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
