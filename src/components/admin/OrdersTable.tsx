import type { Order, OrderStatus } from "../../types/order";
import {
  ORDER_STATUS_LABELS,
  ORDER_STATUS_OPTIONS,
} from "../../constants/orderStatus";

interface OrderRowProps {
  order: Order;
  isUpdating: boolean;
  onStatusChange: (order: Order, status: OrderStatus) => void;
}

function OrderRow({ order, isUpdating, onStatusChange }: OrderRowProps) {
  return (
    <tr className="border-b last:border-b-0">
      <td className="p-2 text-sm font-medium">{order.id.slice(0, 8)}</td>
      <td className="p-2 text-sm text-gray-600">{order.userId.slice(0, 8)}</td>
      <td className="p-2 text-sm text-gray-600">
        {new Date(order.createdAt).toLocaleDateString("es-CO")}
      </td>
      <td className="p-2 text-sm">{order.items.length}</td>
      <td className="p-2 text-sm">${order.total.toLocaleString("es-CO")}</td>
      <td className="p-2 text-sm">
        <select
          value={order.status}
          disabled={isUpdating}
          onChange={(e) =>
            onStatusChange(order, e.target.value as OrderStatus)
          }
          className="border rounded p-1 disabled:opacity-50"
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
}

export function OrdersTable({
  orders,
  updatingId,
  onStatusChange,
}: OrdersTableProps) {
  return (
    <div className="overflow-x-auto border rounded">
      <table className="w-full text-left">
        <thead className="bg-gray-50">
          <tr>
            <th className="p-2 text-xs uppercase text-gray-500">Orden</th>
            <th className="p-2 text-xs uppercase text-gray-500">Cliente</th>
            <th className="p-2 text-xs uppercase text-gray-500">Fecha</th>
            <th className="p-2 text-xs uppercase text-gray-500">Items</th>
            <th className="p-2 text-xs uppercase text-gray-500">Total</th>
            <th className="p-2 text-xs uppercase text-gray-500">Estado</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((order) => (
            <OrderRow
              key={order.id}
              order={order}
              isUpdating={updatingId === order.id}
              onStatusChange={onStatusChange}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function OrdersTableSkeleton() {
  return (
    <div className="overflow-x-auto border rounded animate-pulse">
      <table className="w-full text-left">
        <tbody>
          {[0, 1, 2].map((row) => (
            <tr key={row} className="border-b last:border-b-0">
              {[0, 1, 2, 3, 4, 5].map((col) => (
                <td key={col} className="p-2">
                  <div className="h-4 bg-gray-200 rounded" />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
