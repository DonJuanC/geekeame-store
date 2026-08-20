import type { ReactNode } from "react";

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
