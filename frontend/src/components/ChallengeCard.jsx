import { ArrowRight, MapPin, Users } from "lucide-react";

const statusStyles = {
  Submitted: "bg-slate-100 text-slate-700",
  "Under Review": "bg-amber-50 text-amber-700",
  Verified: "bg-emerald-50 text-emerald-700",
  "University Matched": "bg-purple-50 text-purple-700",
  "Pilot in Progress": "bg-blue-50 text-blue-700",
  "Awaiting Community Validation": "bg-cyan-50 text-cyan-800",
  Resolved: "bg-emerald-100 text-emerald-800",
  Rejected: "bg-red-50 text-red-700",
};

function ChallengeCard({ challenge, onView }) {
  const progress =
    typeof challenge.progress === "number" &&
    Number.isFinite(challenge.progress)
      ? Math.min(100, Math.max(0, challenge.progress))
      : null;

  const supporters =
    typeof challenge.supporters === "number" &&
    Number.isFinite(challenge.supporters)
      ? challenge.supporters.toLocaleString("en-IN")
      : "—";

  return (
    <article className="flex min-w-0 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition duration-300 hover:border-blue-300 hover:shadow-xl">
      <div className="h-1" />

      <div className="flex flex-1 flex-col p-5">
        <div className="grid grid-cols-2 items-start gap-2">
          <span
            title={challenge.category}
            className="flex h-12 min-w-0 items-center rounded-xl bg-blue-50 px-3 text-xs font-bold leading-4 text-blue-700"
          >
            <span className="line-clamp-2 wrap-break">
              {challenge.category || "Uncategorized"}
            </span>
          </span>

          <span
            title={challenge.status}
            className={`flex h-12 min-w-0 items-center justify-center rounded-xl px-3 text-center text-xs font-bold leading-4 ${
              statusStyles[challenge.status] ||
              "bg-slate-100 text-slate-700"
            }`}
          >
            <span className="line-clamp-2 wrap-break">
              {challenge.status || "Status unavailable"}
            </span>
          </span>
        </div>

        <p
          title={challenge.trackingId || challenge.id}
          className="mt-4 truncate text-[11px] font-bold tracking-wide text-slate-400"
        >
          {challenge.trackingId || challenge.id}
        </p>

        <h2
          title={challenge.title}
          className="mt-2 line-clamp-2 h-12 wrap-break text-lg font-extrabold leading-6 text-slate-900"
        >
          {challenge.title}
        </h2>

        <p className="mt-3 line-clamp-3 h-18 wrap-break text-sm leading-6 text-slate-500">
          {challenge.description || "No description provided."}
        </p>

        <div className="mt-5 border-t border-slate-100 pt-4">
          <div className="flex h-10 items-start gap-2">
            <MapPin
              size={16}
              className="mt-0.5 shrink-0 text-blue-500"
            />

            <p
              title={challenge.location}
              className="line-clamp-2 wrap-break text-sm leading-5 text-slate-500"
            >
              {challenge.location || "Location not provided"}
            </p>
          </div>

          <div className="mt-3 flex items-center gap-2 text-sm text-slate-500">
            <Users size={16} className="shrink-0 text-blue-500" />
            <span>{supporters} supporters</span>
          </div>
        </div>

        <div className="mt-5">
          <div className="mb-2 flex justify-between text-xs font-semibold">
            <span className="text-slate-500">Journey progress</span>
            <span className="text-blue-600">
              {progress === null ? "—" : `${progress}%`}
            </span>
          </div>

          <div
            role="progressbar"
            aria-label="Journey progress"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={progress ?? undefined}
            className="h-2 overflow-hidden rounded-full bg-slate-100"
          >
            <div
              className="h-full rounded-full bg-linear-to-r from-blue-600 to-cyan-400"
              style={{ width: `${progress ?? 0}%` }}
            />
          </div>
        </div>

        <div className="mt-auto pt-5">
          <button
            type="button"
            onClick={() => onView(challenge)}
            aria-label={`View details: ${challenge.title}`}
            className="flex w-full items-center justify-between gap-2 rounded-xl bg-blue-50 px-4 py-3 text-sm font-bold text-blue-700 transition hover:bg-blue-600 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
          >
            View details
            <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </article>
  );
}

export default ChallengeCard;