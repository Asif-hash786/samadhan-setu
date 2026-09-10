import { Menu, Plus } from "lucide-react";
import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import CitizenSidebar from "../components/CitizenSidebar";
import NotificationBell from "../components/NotificationBell";

function CitizenLayout({ title, subtitle, children }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const navigate = useNavigate();
  const { pathname } = useLocation();

  const isReportPage =
    pathname.replace(/\/+$/, "") === "/citizen/report";

  return (
    <div className="min-h-screen bg-[#eef4fc]">
      <CitizenSidebar
        mobileOpen={mobileOpen}
        closeSidebar={() => setMobileOpen(false)}
      />

      <div className="min-w-0 lg:pl-64">
        <header className="sticky top-0 z-30 border-b border-blue-100 bg-white/95 backdrop-blur-xl">
          <div className="grid grid-cols-[auto_1fr_auto] items-center gap-x-3 gap-y-4 px-4 py-4 sm:px-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:px-8">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              aria-label="Open sidebar"
              aria-expanded={mobileOpen}
              className="col-start-1 row-start-1 grid size-10 shrink-0 cursor-pointer place-items-center rounded-xl bg-blue-50 text-blue-700 transition hover:bg-blue-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 lg:hidden"
            >
              <Menu size={22} />
            </button>

            <span className="col-start-2 row-start-1 truncate text-sm font-extrabold text-slate-800 lg:hidden">
              Samadhan Setu
            </span>

            <div className="col-span-3 row-start-2 min-w-0 lg:col-span-1 lg:col-start-1 lg:row-start-1">
              <p className="text-[10px] font-bold tracking-[0.18em] text-blue-600">
                {subtitle}
              </p>

              <h2 className="mt-1 break-words text-xl font-extrabold leading-snug text-slate-900 md:text-2xl">
                {title}
              </h2>
            </div>

            <div className="col-start-3 row-start-1 flex shrink-0 items-center justify-end gap-2 lg:col-start-2">
              <NotificationBell />

              {!isReportPage && (
                <button
                  type="button"
                  onClick={() => navigate("/citizen/report")}
                  aria-label="Report a challenge"
                  className="flex h-10 shrink-0 cursor-pointer items-center justify-center gap-2 rounded-xl bg-blue-600 px-3 text-sm font-bold text-white shadow-sm transition hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 sm:px-4"
                >
                  <Plus size={19} />

                  <span className="hidden sm:inline">
                    Report challenge
                  </span>
                </button>
              )}
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-7xl p-4 sm:p-6 md:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}

export default CitizenLayout;