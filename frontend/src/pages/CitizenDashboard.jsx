import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  CheckCircle2,
  Clock3,
  FileText,
  MapPin,
  Plus,
  RefreshCw,
  Wrench,
} from "lucide-react";
import CitizenLayout from "../layouts/CitizenLayout";
import ChallengeModal from "../components/ChallengeModal";
import api from "../services/api";

const statusColors = {
  Submitted: "bg-slate-100 text-slate-700",
  "Under Review": "bg-amber-50 text-amber-700",
  Verified: "bg-blue-50 text-blue-700",
  "University Matched": "bg-purple-50 text-purple-700",
  "Pilot in Progress": "bg-orange-50 text-orange-700",
  "Awaiting Community Validation": "bg-cyan-50 text-cyan-800",
  Resolved: "bg-emerald-50 text-emerald-700",
  Rejected: "bg-red-50 text-red-700",
};

const statusDescriptions = {
  Submitted: "Your report has been submitted.",
  "Under Review": "Your report is awaiting administrator review.",
  Verified: "Your report has been verified.",
  "University Matched":
    "Your report has been matched with university partners.",
  "Pilot in Progress": "Work on a pilot solution is in progress.",
  "Awaiting Community Validation":
    "A completed solution is ready for your review.",
  Resolved: "Your report has been marked resolved.",
  Rejected: "Your report was rejected during review.",
};

function formatNumber(value) {
  return value.toLocaleString("en-IN");
}

function formatDate(value) {
  if (!value) return "Date unavailable";

  const date = new Date(value);

  return Number.isNaN(date.getTime())
    ? "Date unavailable"
    : date.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
}

function getProgress(report) {
  const value = Number(report?.progress);
  return Number.isFinite(value)
    ? Math.min(100, Math.max(0, value))
    : null;
}

function CitizenDashboard() {
  const user = useSelector((state) => state.auth.user);

  const [reports, setReports] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const [updatedAt, setUpdatedAt] = useState(null);
  const [activeId, setActiveId] = useState("");
  const [selectedReport, setSelectedReport] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function loadReports() {
      setLoading(true);
      setError("");

      try {
        const response = await api.get("/challenges/mine", {
          timeout: 20000,
        });

        if (!Array.isArray(response.data?.challenges)) {
          throw new Error("Unexpected reports response");
        }

        if (cancelled) return;

        const nextReports = [...response.data.challenges].sort(
          (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
        );

        setReports(nextReports);
        setLoaded(true);
        setUpdatedAt(new Date());

        setActiveId((current) =>
          nextReports.some((report) => report.id === current)
            ? current
            : nextReports[0]?.id || ""
        );

        setSelectedReport((current) =>
          current
            ? nextReports.find((report) => report.id === current.id) || null
            : null
        );
      } catch (requestError) {
        if (cancelled) return;

        console.error("Citizen dashboard loading failed:", requestError);
        setError(
          requestError.response?.data?.message ||
            "Unable to load your reports. Please try again."
        );
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadReports();

    return () => {
      cancelled = true;
    };
  }, [refreshKey]);

  const firstName = user?.name?.trim().split(/\s+/)[0];
  const activeReport = reports.find((report) => report.id === activeId);
  const progress = activeReport ? getProgress(activeReport) : null;

  const inProgress = reports.filter((report) =>
    ["University Matched", "Pilot in Progress"].includes(report.status)
  ).length;

  const resolved = reports.filter(
    (report) => report.status === "Resolved"
  ).length;

  const awaitingReview = reports.filter((report) =>
    ["Submitted", "Under Review"].includes(report.status)
  ).length;

  const pendingValidation = reports.filter(
    (report) =>
      !["Resolved", "Rejected"].includes(report.status) &&
      (
        report.status === "Awaiting Community Validation" ||
        report.universityAssignments?.some(
          (assignment) => assignment.validationStatus === "PENDING"
        )
      )
  );

  const metrics = [
    {
      label: "My reports",
      value: reports.length,
      icon: FileText,
      color: "bg-blue-50 text-blue-600",
    },
    {
      label: "Awaiting review",
      value: awaitingReview,
      icon: Clock3,
      color: "bg-amber-50 text-amber-600",
    },
    {
      label: "In progress",
      value: inProgress,
      icon: Wrench,
      color: "bg-purple-50 text-purple-600",
    },
    {
      label: "Resolved",
      value: resolved,
      icon: CheckCircle2,
      color: "bg-emerald-50 text-emerald-600",
    },
  ];

  const resolutionRate = reports.length
    ? (resolved / reports.length) * 100
    : 0;

  return (
    <CitizenLayout
      title={firstName ? `Welcome back, ${firstName}` : "Your dashboard"}
      subtitle="CITIZEN DASHBOARD"
    >
      <section className="relative overflow-hidden rounded-3xl bg-linear-to-br from-slate-950 via-blue-950 to-blue-700 p-7 text-white md:p-10">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-20 -top-24 size-80 rounded-full border-50 border-white/5"
        />

        <div className="relative grid items-center gap-8 lg:grid-cols-[1fr_auto]">
          <div className="max-w-2xl">
            <p className="text-xs font-bold tracking-[0.2em] text-blue-300">
              SMALL ACTIONS. SHARED PROGRESS.
            </p>

            <h2 className="mt-4 text-3xl font-black leading-tight tracking-tight md:text-4xl">
              Make your community
              <span className="block text-blue-300">a better place.</span>
            </h2>

            <p className="mt-4 max-w-xl text-sm leading-7 text-blue-100">
              Report a local challenge, follow the work and help confirm
              whether the solution makes a difference.
            </p>

            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                to="/citizen/report"
                className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-bold text-blue-800 transition hover:bg-blue-50"
              >
                <Plus size={18} />
                New report
              </Link>

              <Link
                to="/citizen/explore"
                className="inline-flex items-center gap-2 rounded-xl border border-white/25 px-5 py-3 text-sm font-bold text-white transition hover:bg-white/10"
              >
                Explore challenges
                <ArrowRight size={17} />
              </Link>
            </div>
          </div>

          <div className="rounded-2xl border border-white/15 bg-white/10 p-6 lg:w-56">
            <CheckCircle2 size={26} className="text-blue-200" />

            <p className="mt-5 text-4xl font-black">
              {loaded ? `${resolutionRate.toFixed(1)}%` : "—"}
            </p>

            <p className="mt-2 text-sm text-blue-100">
              of your reports resolved
            </p>

            <p className="mt-4 border-t border-white/15 pt-4 text-xs text-blue-200">
              {loaded
                ? `${formatNumber(resolved)} of ${formatNumber(reports.length)} reports`
                : "Loading your activity"}
            </p>
          </div>
        </div>
      </section>

      <div className="my-5 flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-slate-500" aria-live="polite">
          {loading
            ? "Refreshing your activity..."
            : updatedAt
              ? `Updated ${updatedAt.toLocaleTimeString("en-IN", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}`
              : "Your activity could not be loaded"}
        </p>

        <button
          type="button"
          disabled={loading}
          onClick={() => setRefreshKey((current) => current + 1)}
          className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-bold text-blue-600 hover:bg-blue-50 disabled:opacity-50"
        >
          <RefreshCw
            size={16}
            className={loading ? "motion-safe:animate-spin" : ""}
          />
          Refresh
        </button>
      </div>

      {error && (
        <div
          role="alert"
          className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
        >
          {error}
          {loaded && " Previously loaded activity is still displayed."}
        </div>
      )}

      <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {metrics.map(({ label, value, icon: Icon, color }) => (
          <article
            key={label}
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition duration-300 hover:border-blue-200 hover:shadow-md md:p-6"
          >
            <div
              className={`inline-flex rounded-xl p-3 ${color}`}
            >
              <Icon size={21} />
            </div>

            <p className="mt-5 text-3xl font-black tracking-tight text-slate-900">
              {loaded ? formatNumber(value) : "—"}
            </p>

            <p className="mt-2 text-sm text-slate-500">{label}</p>
          </article>
        ))}
      </section>

      {pendingValidation.length > 0 && (
        <section className="mt-6 flex flex-col justify-between gap-4 rounded-2xl border border-cyan-200 bg-cyan-50 p-5 sm:flex-row sm:items-center">
          <div className="flex items-start gap-3">
            <CheckCircle2
              size={23}
              className="mt-0.5 shrink-0 text-cyan-700"
            />

            <div>
              <h2 className="font-bold text-cyan-950">
                Your feedback is needed
              </h2>
              <p className="mt-1 text-sm leading-6 text-cyan-800">
                {pendingValidation.length}{" "}
                {pendingValidation.length === 1 ? "report has" : "reports have"}{" "}
                a solution awaiting your review.
              </p>
            </div>
          </div>

          <Link
            to="/citizen/reports"
            className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-cyan-700 px-4 py-3 text-sm font-bold text-white hover:bg-cyan-800"
          >
            Review solutions
            <ArrowRight size={16} />
          </Link>
        </section>
      )}

      <section className="mt-6 grid items-start gap-6 xl:grid-cols-[1.35fr_1fr]">
        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-bold tracking-widest text-blue-600">
                MY ACTIVITY
              </p>
              <h2 className="mt-2 text-xl font-extrabold text-slate-900">
                Recent reports
              </h2>
            </div>

            <Link
              to="/citizen/reports"
              className="inline-flex items-center gap-1 text-sm font-bold text-blue-600 hover:text-blue-800"
            >
              View all
              <ArrowRight size={16} />
            </Link>
          </div>

          {!loaded ? (
            <p className="mt-6 rounded-xl bg-slate-50 p-8 text-center text-sm text-slate-500">
              {loading ? "Loading reports..." : "Refresh to try again."}
            </p>
          ) : reports.length === 0 ? (
            <div className="mt-6 rounded-2xl border border-dashed border-slate-200 p-8 text-center">
              <FileText size={34} className="mx-auto text-slate-300" />
              <h3 className="mt-4 font-bold text-slate-800">
                Your first report starts here
              </h3>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                Tell us about a challenge in your community.
              </p>
              <Link
                to="/citizen/report"
                className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-blue-600"
              >
                Create a report
                <ArrowRight size={16} />
              </Link>
            </div>
          ) : (
            <div className="mt-6 space-y-3">
              {reports.slice(0, 5).map((report) => (
                <button
                  type="button"
                  key={report.id}
                  aria-pressed={activeId === report.id}
                  onClick={() => setActiveId(report.id)}
                  className={`w-full rounded-2xl border p-4 text-left transition ${
                    activeId === report.id
                      ? "border-blue-300 bg-blue-50/60 ring-1 ring-blue-100"
                      : "border-slate-200 bg-white hover:border-blue-200 hover:bg-slate-50"
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-[11px] font-bold tracking-wide text-slate-500">
                      {report.trackingId || report.id}
                    </span>

                    <span
                      className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${
                        statusColors[report.status] ||
                        "bg-slate-100 text-slate-700"
                      }`}
                    >
                      {report.status}
                    </span>
                  </div>

                  <h3 className="mt-3 wrap-break-word font-bold leading-6 text-slate-900">
                    {report.title}
                  </h3>

                  <p className="mt-2 text-xs leading-5 text-slate-500">
                    {report.category} · {formatDate(report.createdAt)}
                  </p>

                  <p className="mt-3 text-xs font-semibold text-blue-600">
                    {activeId === report.id
                      ? "Selected · Progress shown below or alongside"
                      : "Select to view progress"}
                  </p>
                </button>
              ))}
            </div>
          )}
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
          <p className="text-xs font-bold tracking-widest text-blue-600">
            REPORT SPOTLIGHT
          </p>

          {!activeReport ? (
            <div className="py-10 text-center">
              <Clock3 size={32} className="mx-auto text-slate-300" />
              <p className="mt-4 text-sm text-slate-500">
                {loaded
                  ? "Your report progress will appear here."
                  : "Load your reports to see their progress."}
              </p>
            </div>
          ) : (
            <>
              <h2 className="mt-3 wrap-break-word text-xl font-extrabold leading-7 text-slate-900">
                {activeReport.title}
              </h2>

              <p className="mt-3 flex items-start gap-2 text-sm text-slate-500">
                <MapPin size={16} className="mt-0.5 shrink-0" />
                <span className="wrap-break-word">
                  {activeReport.location || "Location not provided"}
                </span>
              </p>

              <div className="mt-6 rounded-2xl bg-slate-50 p-5">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-bold text-slate-700">
                    Recorded progress
                  </p>
                  <p className="text-xl font-black text-blue-600">
                    {progress === null ? "—" : `${progress}%`}
                  </p>
                </div>

                <div
                  role="progressbar"
                  aria-label="Recorded report progress"
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={progress ?? undefined}
                  className="mt-3 h-2.5 overflow-hidden rounded-full bg-slate-200"
                >
                  <div
                    style={{ width: `${progress ?? 0}%` }}
                    className="h-full rounded-full bg-linear-to-r from-blue-600 to-cyan-400 transition-all duration-500 motion-reduce:transition-none"
                  />
                </div>

                <p className="mt-4 text-sm font-bold text-slate-900">
                  {activeReport.status}
                </p>
                <p className="mt-2 text-xs leading-6 text-slate-500">
                  {statusDescriptions[activeReport.status] ||
                    "Open the report for more information."}
                </p>
              </div>

              <dl className="mt-6 grid grid-cols-2 gap-5">
                <div>
                  <dt className="text-xs text-slate-500">Category</dt>
                  <dd className="mt-1 text-sm font-bold text-slate-800">
                    {activeReport.category}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-slate-500">Priority</dt>
                  <dd className="mt-1 text-sm font-bold text-slate-800">
                    {activeReport.priority || "Not assigned"}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-slate-500">Submitted</dt>
                  <dd className="mt-1 text-sm font-bold text-slate-800">
                    {formatDate(activeReport.createdAt)}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-slate-500">Last updated</dt>
                  <dd className="mt-1 text-sm font-bold text-slate-800">
                    {formatDate(activeReport.updatedAt)}
                  </dd>
                </div>
              </dl>

              <button
                type="button"
                onClick={() => setSelectedReport(activeReport)}
                className="mt-7 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-blue-700"
              >
                Open report details
                <ArrowRight size={17} />
              </button>
            </>
          )}
        </article>
      </section>

      <ChallengeModal
        challenge={selectedReport}
        onClose={() => setSelectedReport(null)}
      />
    </CitizenLayout>
  );
}

export default CitizenDashboard;