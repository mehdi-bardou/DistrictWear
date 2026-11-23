import Link from "next/link";
import { requireAdmin } from "../../../lib/admin/require-admin";
import { signOut } from "../login/actions";

const sections = [
  { href: "/admin", label: "Tableau de bord" },
  { href: "/admin/products", label: "Produits" },
  { href: "/admin/categories", label: "Catégories" },
  { href: "/admin/collections", label: "Collections" },
  { href: "/admin/settings", label: "Paramètres" },
];

export default async function AdminPanelLayout({ children }: { children: React.ReactNode }) {
  const admin = await requireAdmin();

  return (
    <div className="flex min-h-dvh flex-col md:flex-row">
      <aside className="bg-forest-950 text-cream-100 border-b px-5 py-4 md:w-64 md:shrink-0 md:border-e md:px-6 md:py-8">
        <Link href="/admin" className="font-display text-xl font-bold tracking-wide uppercase">
          District Wear
        </Link>
        <p className="text-cream-200 mt-1 text-xs">Administration</p>
        <nav
          aria-label="Navigation administration"
          className="mt-6 flex flex-wrap gap-2 md:grid md:gap-1"
        >
          {sections.map((section) => (
            <Link
              key={section.href}
              href={section.href}
              className="hover:bg-forest-800 focus-visible:outline-cream-100 rounded-md px-3 py-2 text-sm focus-visible:outline-2 focus-visible:outline-offset-2"
            >
              {section.label}
            </Link>
          ))}
        </nav>
        <div className="border-cream-200/20 mt-8 hidden border-t pt-4 text-xs md:block">
          <p className="text-cream-200 truncate">{admin.email}</p>
          <form action={signOut} className="mt-3">
            <button type="submit" className="text-cream-100 underline underline-offset-4">
              Déconnexion
            </button>
          </form>
        </div>
      </aside>
      <main className="min-w-0 flex-1 p-5 md:p-8 lg:p-10">{children}</main>
    </div>
  );
}
