import type { ReactNode } from "react";

// Header repetido tal cual en AdminProductsPage/AdminOrdersPage/
// AdminUsersPage (h1 + slot opcional para una acción a la derecha, ej. "+
// Nuevo producto") -- antes cada página lo reescribía a mano.
interface AdminPageTitleProps {
  title: string;
  action?: ReactNode;
}

export function AdminPageTitle({ title, action }: AdminPageTitleProps) {
  return (
    <div className="flex items-center justify-between flex-wrap gap-2">
      <h1 className="text-xl font-bold">{title}</h1>
      {action}
    </div>
  );
}
