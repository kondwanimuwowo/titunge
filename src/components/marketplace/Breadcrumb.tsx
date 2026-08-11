import Link from "next/link";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export function Breadcrumb({ items }: { items: BreadcrumbItem[] }) {
  return (
    <nav className="text-sm text-gray-500 mb-6 flex items-center gap-2">
      {items.map((item, i) => (
        <span key={item.label} className="flex items-center gap-2">
          {i > 0 && <span>/</span>}
          {item.href ? (
            <Link href={item.href} className="hover:text-[#0e1a18] transition-colors">
              {item.label}
            </Link>
          ) : (
            <span className="text-[#0e1a18]">{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}
