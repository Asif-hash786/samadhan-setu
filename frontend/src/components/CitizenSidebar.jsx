import {
  BarChart3,
  FileText,
  Home,
  LogOut,
  PlusCircle,
  Search,
} from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import {
  NavLink,
  useNavigate,
} from "react-router-dom";
import { logout } from "../store/slices/authSlice";

const links = [
  {
    title: "Overview",
    path: "/citizen/dashboard",
    icon: Home,
  },
  {
    title: "Report Challenge",
    path: "/citizen/report",
    icon: PlusCircle,
  },
  {
    title: "Explore Challenges",
    path: "/citizen/explore",
    icon: Search,
  },
  {
    title: "My Reports",
    path: "/citizen/reports",
    icon: FileText,
  },
  {
    title: "Impact",
    path: "/citizen/impact",
    icon: BarChart3,
  },
];

function CitizenSidebar({ mobileOpen, closeSidebar }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const user = useSelector((state) => state.auth.user);

  const initials =
    user?.name
      ?.split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((word) => word[0].toUpperCase())
      .join("") || "CT";

  function handleLogout() {
    dispatch(logout());
    closeSidebar?.();
    navigate("/auth", { replace: true });
  }

  return (
    <>
      {mobileOpen && (
        <button
          aria-label="Close sidebar"
          onClick={closeSidebar}
          className="fixed inset-0 z-40 bg-slate-950/50 lg:hidden"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-[#102757] px-4 py-6 text-white transition-transform duration-300 lg:translate-x-0 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <NavLink
          to="/"
          onClick={closeSidebar}
          className="flex items-center gap-3 px-2"
        >
          <div className="grid size-11 place-items-center rounded-xl bg-blue-500 text-xl font-extrabold">
            स
          </div>

          <div>
            <h1 className="text-lg font-bold leading-none">
              Samadhan Setu
            </h1>

            <p className="mt-1 text-[10px] font-bold tracking-[0.2em] text-blue-300">
              CITIZEN PORTAL
            </p>
          </div>
        </NavLink>

        <div className="mt-9 rounded-2xl border border-blue-400/20 bg-blue-400/10 p-3">
          <div className="flex items-center gap-3">
            <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-blue-500 font-bold">
              {initials}
            </div>

            <div className="min-w-0">
              <p className="truncate text-sm font-bold">
                {user?.name || "Citizen"}
              </p>

              <p className="truncate text-xs text-blue-200">
                {user?.email || "Citizen account"}
              </p>
            </div>
          </div>
        </div>

        <nav className="mt-8 flex flex-1 flex-col gap-2">
          <p className="mb-2 px-3 text-[10px] font-bold tracking-[0.2em] text-blue-300/60">
            NAVIGATION
          </p>

          {links.map(({ title, path, icon: Icon }) => (
            <NavLink
              key={path}
              to={path}
              onClick={closeSidebar}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold transition ${
                  isActive
                    ? "bg-blue-500 text-white"
                    : "text-blue-100 hover:bg-white/10"
                }`
              }
            >
              <Icon size={19} />
              {title}
            </NavLink>
          ))}
        </nav>

        <button
          type="button"
          onClick={handleLogout}
          className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold text-blue-100 transition hover:bg-white/10"
        >
          <LogOut size={19} />
          Sign out
        </button>

        <div className="mt-3 rounded-xl border border-blue-400/20 p-3">
          <p className="text-[10px] font-bold tracking-widest text-blue-300">
            SIH 2026 PROTOTYPE
          </p>

          <p className="mt-1 text-sm font-bold">Team Nexus</p>
        </div>
      </aside>
    </>
  );
}

export default CitizenSidebar;