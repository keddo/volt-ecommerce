import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const NAV_ITEMS = [
  "Dashboard",
  "Products",
  "Categories",
  "Orders",
  "Customers",
  "Inventory",
  "Discounts",
  "Reviews",
  "Settings",
];

export function AdminLayout() {
  const { user, logout } = useAuth();

  return (
    <div className="flex min-h-screen">
      <aside className="w-64 border-r border-white/10 bg-navy-soft p-6">
        <div className="mb-8 text-xl font-extrabold tracking-tight">VOLT Admin</div>
        <nav className="flex flex-col gap-1 text-sm">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item}
              to={item === "Dashboard" ? "/admin" : `/admin/${item.toLowerCase()}`}
              className={({ isActive }) =>
                `rounded-xl px-3 py-2 transition-colors ${
                  isActive ? "bg-accent text-white" : "text-surface-muted hover:bg-white/5 hover:text-white"
                }`
              }
              end={item === "Dashboard"}
            >
              {item}
            </NavLink>
          ))}
        </nav>
      </aside>
      <div className="flex-1">
        <header className="flex items-center justify-between border-b border-white/10 px-8 py-4">
          <div className="text-sm text-surface-muted">Signed in as {user?.name}</div>
          <button
            onClick={() => logout()}
            className="rounded-xl bg-white/5 px-4 py-2 text-sm hover:bg-white/10"
          >
            Log out
          </button>
        </header>
        <main className="p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
