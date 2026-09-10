import { MapPin, Users, X, ExternalLink } from "lucide-react";
import { useState } from "react";

function EvidencePreview({ challenge }) {
  const [failed, setFailed] = useState(false);
  const url = challenge.evidenceUrl;
  const type = challenge.evidenceResourceType;

  if (!url) {
    return (
      <p className="mt-3 rounded-xl bg-slate-50 p-4 text-sm text-slate-500">
        No evidence was attached to this report.
      </p>
    );
  }

  // Only render HTTPS media links.
  let safeUrl;

  try {
    const parsed = new URL(url);
    if (parsed.protocol === "https:") {
      safeUrl = parsed.href;
    }
  } catch {
    safeUrl = null;
  }

  if (!safeUrl) {
    return (
      <p className="mt-3 text-sm text-slate-500">
        The evidence link is unavailable.
      </p>
    );
  }

  return (
    <div className="mt-3">
      {failed ? (
        <p role="status" className="rounded-xl bg-slate-50 p-4 text-sm text-slate-500">
          The preview could not load. Try opening the evidence below.
        </p>
      ) : type === "video" ? (
        <video
          controls
          playsInline
          preload="metadata"
          onError={() => setFailed(true)}
          className="max-h-96 w-full rounded-xl bg-slate-950"
        >
          <source src={safeUrl} type="video/mp4" />
          Your browser does not support this video.
        </video>
      ) : type === "image" ? (
        <img
          src={safeUrl}
          alt={`Evidence submitted for: ${challenge.title}`}
          onError={() => setFailed(true)}
          className="max-h-96 w-full rounded-xl bg-slate-50 object-contain"
        />
      ) : (
        <p className="text-sm text-slate-500">
          A preview is unavailable for this attachment.
        </p>
      )}

      <a
        href={safeUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-3 inline-flex items-center gap-2 text-sm font-bold text-blue-600 hover:text-blue-800"
      >
        <ExternalLink size={16} />
        Open original evidence
      </a>
    </div>
  );
}

function ChallengeModal({ challenge, onClose }) {
  if (!challenge) return null;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-100 grid place-items-center bg-slate-950/60 p-4 backdrop-blur-sm"
    >
      <article
        role="dialog"
        aria-modal="true"
        aria-label={`Challenge details: ${challenge.title}`}
        onClick={(event) => event.stopPropagation()}
        className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl md:p-8"
      >
        <div className="flex items-start justify-between gap-5">
          <div className="min-w-0">
            <p className="wrap-break-word text-xs font-bold tracking-widest text-blue-600">
              {challenge.trackingId || challenge.id} •{" "}
              {challenge.category}
            </p>

            <h2 className="mt-3 text-2xl font-extrabold text-slate-900">
              {challenge.title}
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close details"
            className="grid size-10 shrink-0 place-items-center rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200"
          >
            <X size={20} />
          </button>
        </div>

        <p className="mt-5 whitespace-pre-wrap wrap-break-word leading-7 text-slate-600">
          {challenge.description}
        </p>

        <div className="mt-6 grid gap-4 rounded-2xl bg-blue-50 p-5 sm:grid-cols-2">
          <div>
            <p className="text-xs font-bold text-slate-500">
              LOCATION
            </p>

            <p className="mt-2 flex items-center gap-2 font-semibold text-slate-900">
              <MapPin
                size={17}
                className="shrink-0 text-blue-600"
              />
              {challenge.location}
            </p>
          </div>

          <div>
            <p className="text-xs font-bold text-slate-500">
              COMMUNITY SUPPORT
            </p>

            <p className="mt-2 flex items-center gap-2 font-semibold text-slate-900">
              <Users size={17} className="text-blue-600" />
              {challenge.supporters ?? 0} citizens
            </p>
          </div>
        </div>

        <section className="mt-6 rounded-2xl border border-slate-200 p-5">
          <h3 className="text-xs font-bold tracking-widest text-blue-600">
            SUBMITTED EVIDENCE
          </h3>

          <EvidencePreview
            key={`${challenge.id}-${challenge.evidenceUrl || "none"}`}
            challenge={challenge}
          />
        </section>

        <div className="mt-6 rounded-2xl border border-blue-200 p-5">
          <p className="text-xs font-bold tracking-widest text-blue-600">
            REPORT DETAILS
          </p>

          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            <div>
              <p className="text-xs text-slate-500">Category</p>
              <p className="mt-1 font-bold text-slate-900">
                {challenge.category}
              </p>
            </div>

            <div>
              <p className="text-xs text-slate-500">Priority</p>
              <p
                className={`mt-1 font-bold ${
                  challenge.priority === "High"
                    ? "text-red-600"
                    : "text-amber-600"
                }`}
              >
                {challenge.priority}
              </p>
            </div>

            <div>
              <p className="text-xs text-slate-500">Status</p>
              <p className="mt-1 font-bold text-blue-700">
                {challenge.status}
              </p>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="mt-7 w-full rounded-xl bg-blue-600 py-3 font-bold text-white hover:bg-blue-700"
        >
          Close
        </button>
      </article>
    </div>
  );
}

export default ChallengeModal;