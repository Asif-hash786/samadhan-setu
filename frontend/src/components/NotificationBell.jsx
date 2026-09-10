import { Bell, ArrowRight, RefreshCw, X } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { Link } from "react-router-dom";
import api from "../services/api";

function NotificationBell() {
  const user = useSelector((state) => state.auth.user);
  const panelId = useId();
  const containerRef = useRef(null);
  const buttonRef = useRef(null);

  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    setOpen(false);
    setItems([]);
    setError("");
  }, [user?.id, user?.role]);

  useEffect(() => {
    if (!open) return;

    function handleOutsideClick(event) {
      if (!containerRef.current?.contains(event.target)) {
        setOpen(false);
      }
    }

    function handleEscape(event) {
      if (event.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
      }
    }

    document.addEventListener("pointerdown", handleOutsideClick);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("pointerdown", handleOutsideClick);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  useEffect(() => {
    if (!open || !user?.id) return;

    let cancelled = false;

    async function loadActivity() {
      setLoading(true);
      setError("");

      try {
        let nextItems = [];

        if (user.role === "ADMIN") {
          const [reportsResponse, applicationsResponse] =
            await Promise.all([
              api.get("/challenges", { timeout: 15000 }),
              api.get("/universities/applications", {
                timeout: 15000,
              }),
            ]);

          const reports = reportsResponse.data.challenges;
          const applications = applicationsResponse.data.applications;

          if (
            !Array.isArray(reports) ||
            !Array.isArray(applications)
          ) {
            throw new Error("Unexpected API response");
          }

          nextItems = [
            ...reports
              .filter((report) =>
                ["Submitted", "Under Review"].includes(report.status)
              )
              .map((report) => ({
                id: `report-${report.id}`,
                title: "Report awaiting review",
                description: report.title,
                path: "/admin/dashboard",
                date: report.createdAt,
              })),

            ...applications.map((application) => ({
              id: `application-${application.id}`,
              title: "University application",
              description: application.name,
              path: "/admin/university-applications",
              date: application.createdAt,
            })),
          ];
        } else if (user.role === "CITIZEN") {
          const response = await api.get("/challenges/mine", {
            timeout: 15000,
          });

          const reports = response.data.challenges;

          if (!Array.isArray(reports)) {
            throw new Error("Unexpected API response");
          }

          nextItems = reports
            .filter(
              (report) =>
                !["Resolved", "Rejected"].includes(report.status) &&
                (
                  report.status === "Awaiting Community Validation" ||
                  report.universityAssignments?.some(
                    (assignment) =>
                      assignment.validationStatus === "PENDING"
                  )
                )
            )
            .map((report) => ({
              id: `validation-${report.id}`,
              title: "Your feedback is needed",
              description: report.title,
              path: "/citizen/reports",
              date: report.updatedAt,
            }));
        }

        nextItems.sort(
          (a, b) =>
            (Date.parse(b.date) || 0) - (Date.parse(a.date) || 0)
        );

        if (!cancelled) setItems(nextItems);
      } catch (requestError) {
        if (!cancelled) {
          setError(
            requestError.response?.data?.message ||
              "Unable to load updates. Please try again."
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadActivity();

    return () => {
      cancelled = true;
    };
  }, [open, refreshKey, user?.id, user?.role]);

  return (
    <div ref={containerRef} className="relative shrink-0">
      <button
        ref={buttonRef}
        type="button"
        aria-label="Open activity updates"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((current) => !current)}
        className="relative grid size-10 place-items-center rounded-xl bg-slate-100 text-slate-600 transition hover:bg-blue-50 hover:text-blue-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
      >
        <Bell size={19} />

        {!loading && !error && items.length > 0 && (
          <span className="absolute -right-1 -top-1 grid min-w-5 place-items-center rounded-full bg-red-500 px-1 text-[10px] font-bold leading-5 text-white">
            {items.length > 99 ? "99+" : items.length}
          </span>
        )}
      </button>

      {open && (
        <section
          id={panelId}
          aria-label="Activity updates"
          className="fixed left-4 right-4 top-28 z-50 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl sm:absolute sm:left-auto sm:right-0 sm:top-14 sm:w-96"
        >
          <div className="flex items-start justify-between gap-3 border-b border-slate-100 p-4">
            <div>
              <h3 className="font-extrabold text-slate-900">
                Needs your attention
              </h3>
              <p className="mt-1 text-xs text-slate-500">
                Current pending items · refreshed when opened
              </p>
            </div>

            <button
              type="button"
              aria-label="Close updates"
              onClick={() => {
                setOpen(false);
                buttonRef.current?.focus();
              }}
              className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"
            >
              <X size={18} />
            </button>
          </div>

          <div className="max-h-[55vh] overflow-y-auto">
            {loading ? (
              <p role="status" className="p-8 text-center text-sm text-slate-500">
                Loading updates...
              </p>
            ) : error ? (
              <p role="alert" className="p-5 text-sm text-red-600">
                {error}
              </p>
            ) : items.length === 0 ? (
              <div className="p-8 text-center">
                <Bell size={28} className="mx-auto text-slate-300" />
                <p className="mt-3 text-sm font-bold text-slate-700">
                  Nothing needs your attention
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Pending items will appear here.
                </p>
              </div>
            ) : (
              items.map((item) => (
                <Link
                  key={item.id}
                  to={item.path}
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 border-b border-slate-100 p-4 transition last:border-0 hover:bg-blue-50"
                >
                  <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-blue-50 text-blue-600">
                    <Bell size={16} />
                  </span>

                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-slate-800">
                      {item.title}
                    </p>
                    <p className="mt-1 line-clamp-2 wrap-break-word text-xs leading-5 text-slate-500">
                      {item.description}
                    </p>
                  </div>

                  <ArrowRight size={16} className="shrink-0 text-slate-400" />
                </Link>
              ))
            )}
          </div>

          <button
            type="button"
            disabled={loading}
            onClick={() => setRefreshKey((current) => current + 1)}
            className="flex w-full items-center justify-center gap-2 border-t border-slate-100 p-3 text-xs font-bold text-blue-600 hover:bg-blue-50 disabled:opacity-50"
          >
            <RefreshCw size={14} />
            Refresh updates
          </button>
        </section>
      )}
    </div>
  );
}

export default NotificationBell;