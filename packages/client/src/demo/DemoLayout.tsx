import { NavLink, Outlet } from "react-router-dom";
import { cn } from "@/lib/utils";

const tabs = [
  { to: "/demo", label: "Reading data", end: true },
  { to: "/demo/writing", label: "Paging + writing", end: false },
];

export function DemoLayout() {
  return (
    <div className="w-full max-w-4xl">
      <h1 className="text-2xl font-semibold">TanStack Query, live</h1>
      <p className="mt-1 text-sm text-neutral-500">
        Data comes from jsonplaceholder. Every request is slowed down by 900ms on purpose so the
        loading states are visible. Open the devtools panel (bottom corner) to watch the cache.
      </p>

      <nav className="my-5 flex gap-2 border-b">
        {tabs.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            end={tab.end}
            className={({ isActive }) =>
              cn(
                "-mb-px border-b-2 px-3 py-2 text-sm",
                isActive
                  ? "border-blue-600 font-medium text-blue-700"
                  : "border-transparent text-neutral-500 hover:text-neutral-800",
              )
            }
          >
            {tab.label}
          </NavLink>
        ))}
      </nav>

      <div className="space-y-6 pb-16">
        <Outlet />
      </div>
    </div>
  );
}
