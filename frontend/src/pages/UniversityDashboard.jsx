import {
  CheckCircle2,
  Clock3,
  FlaskConical,
  MapPin,
  Sparkles,
  XCircle,
} from "lucide-react";
import { X } from "lucide-react";
import {
  useEffect,
  useMemo,
  useState,
} from "react";
import UniversityLayout from "../layouts/UniversityLayout";
import api from "../services/api";

function UniversityDashboard() {
  const [assignments, setAssignments] = useState([]);
  const [selectedAssignment, setSelectedAssignment] =
    useState(null);
  const [proposal, setProposal] = useState("");
  const [loading, setLoading] = useState(true);
  const [responding, setResponding] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    loadAssignments();
  }, []);

  async function loadAssignments() {
    try {
      setLoading(true);
      setError("");

      const response = await api.get(
        "/universities/projects/mine"
      );

      setAssignments(response.data.assignments || []);
    } catch (requestError) {
      console.error("Assignment loading failed:", requestError);

      setError(
        requestError.response?.data?.message ||
        "Unable to load university invitations."
      );
    } finally {
      setLoading(false);
    }
  }

  const statistics = useMemo(
    () => [
      {
        label: "Total invitations",
        value: assignments.length,
        icon: Sparkles,
      },
      {
        label: "Pending",
        value: assignments.filter(
          (item) => item.status === "INVITED"
        ).length,
        icon: Clock3,
      },
      {
        label: "Accepted",
        value: assignments.filter(
          (item) => item.status === "ACCEPTED"
        ).length,
        icon: CheckCircle2,
      },
      {
        label: "Rejected",
        value: assignments.filter(
          (item) => item.status === "REJECTED"
        ).length,
        icon: XCircle,
      },
    ],
    [assignments]
  );

  function openInvitation(assignment) {
    setSelectedAssignment(assignment);
    setProposal(assignment.proposal || "");
    setError("");
    setMessage("");
  }

  function closeInvitation() {
    if (responding) return;

    setSelectedAssignment(null);
    setProposal("");
  }

  async function respondToInvitation(status) {
    if (!selectedAssignment) return;

    if (
      status === "ACCEPTED" &&
      proposal.trim().length < 20
    ) {
      setError(
        "Please write a proposal containing at least 20 characters."
      );
      return;
    }

    try {
      setResponding(true);
      setError("");
      setMessage("");

      const response = await api.patch(
        `/universities/assignments/${selectedAssignment.id}/respond`,
        {
          status,
          proposal:
            status === "ACCEPTED" ? proposal.trim() : null,
        }
      );

      const updatedAssignment = response.data.assignment;

      setAssignments((current) =>
        current.map((assignment) =>
          assignment.id === updatedAssignment.id
            ? updatedAssignment
            : assignment
        )
      );

      setMessage(response.data.message);
      setSelectedAssignment(null);
      setProposal("");
    } catch (requestError) {
      console.error("Invitation response failed:", requestError);

      setError(
        requestError.response?.data?.message ||
        "Unable to respond to this invitation."
      );
    } finally {
      setResponding(false);
    }
  }

  function getStatusStyle(status) {
    const styles = {
      INVITED: "bg-amber-50 text-amber-700",
      ACCEPTED: "bg-emerald-50 text-emerald-700",
      REJECTED: "bg-red-50 text-red-700",
    };

    return styles[status] || "bg-slate-100 text-slate-700";
  }

  return (
    <UniversityLayout
      title="Recommended challenges"
      subtitle="UNIVERSITY HUB"
    >
      <section className="relative overflow-hidden rounded-3xl bg-linear-to-r from-orange-700 to-orange-500 p-7 text-white shadow-xl shadow-orange-200 md:p-9">
        <div className="relative z-10 max-w-2xl">
          <p className="text-xs font-bold tracking-[0.2em] text-orange-200">
            CAMPUS TO COMMUNITY
          </p>

          <h2 className="mt-3 text-2xl font-extrabold md:text-3xl">
            Apply university expertise to real community needs
          </h2>

          <p className="mt-3 leading-7 text-orange-100">
            Review verified community challenges, submit a
            proposal and create faculty-guided student projects.
          </p>
        </div>

        <div className="absolute -right-20 -top-24 size-72 rounded-full border-48 border-white/5" />
      </section>

      {error && !selectedAssignment && (
        <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
          {error}
        </div>
      )}

      {message && (
        <div className="mt-6 flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-700">
          <CheckCircle2 size={19} />
          {message}
        </div>
      )}

      <section className="mt-6 grid grid-cols-2 gap-4 xl:grid-cols-4">
        {statistics.map(({ label, value, icon: Icon }) => (
          <article
            key={label}
            className="rounded-2xl border border-orange-100 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
          >
            <div className="grid size-11 place-items-center rounded-xl bg-orange-50 text-orange-600">
              <Icon size={21} />
            </div>

            <strong className="mt-5 block text-2xl font-extrabold text-slate-900 md:text-3xl">
              {value}
            </strong>

            <p className="mt-1 text-sm text-slate-500">{label}</p>
          </article>
        ))}
      </section>

      <section className="mt-6">
        <p className="text-xs font-bold tracking-widest text-orange-600">
          ASSIGNED CHALLENGES
        </p>

        <h2 className="mt-2 text-xl font-extrabold text-slate-900">
          Invitations for your university
        </h2>

        {loading && (
          <div className="mt-5 rounded-2xl bg-orange-50 p-5 text-center font-semibold text-orange-700">
            Loading invitations...
          </div>
        )}

        {!loading && assignments.length === 0 && (
          <div className="mt-5 rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
            <FlaskConical
              size={35}
              className="mx-auto text-slate-400"
            />

            <h3 className="mt-4 font-extrabold text-slate-900">
              No invitations yet
            </h3>

            <p className="mt-2 text-sm text-slate-500">
              Challenges assigned by administrators will appear
              here.
            </p>
          </div>
        )}

        <div className="mt-5 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {assignments.map((assignment) => {
            const challenge = assignment.challenge;

            return (
              <article
                key={assignment.id}
                className="flex flex-col rounded-2xl border border-orange-100 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-xl"
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="rounded-full bg-orange-50 px-3 py-1.5 text-xs font-bold text-orange-700">
                    {challenge.category}
                  </span>

                  <span
                    className={`rounded-full px-3 py-1.5 text-xs font-bold ${getStatusStyle(
                      assignment.status
                    )}`}
                  >
                    {assignment.status}
                  </span>
                </div>

                <p className="mt-4 text-xs font-bold text-orange-600">
                  {challenge.trackingId}
                </p>

                <h3 className="mt-2 text-lg font-extrabold leading-6 text-slate-900">
                  {challenge.title}
                </h3>

                <p className="mt-3 flex-1 text-sm leading-6 text-slate-500">
                  {challenge.description}
                </p>

                <div className="mt-5 space-y-3 border-t border-slate-200 pt-4 text-sm text-slate-500">
                  <p className="flex items-center gap-2">
                    <MapPin size={16} />
                    {challenge.location}
                  </p>

                  <p className="flex items-center gap-2">
                    <Clock3 size={16} />
                    Invited{" "}
                    {new Date(
                      assignment.assignedAt
                    ).toLocaleDateString("en-IN")}
                  </p>
                </div>

                {assignment.proposal && (
                  <div className="mt-4 rounded-xl bg-emerald-50 p-3 text-sm leading-6 text-emerald-800">
                    <strong>Your proposal:</strong>{" "}
                    {assignment.proposal}
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => openInvitation(assignment)}
                  className={`mt-5 rounded-xl py-3 text-sm font-bold transition ${assignment.status === "INVITED"
                      ? "bg-orange-500 text-white hover:bg-orange-600"
                      : "bg-slate-100 text-slate-700"
                    }`}
                >
                  {assignment.status === "INVITED"
                    ? "Review invitation"
                    : "View details"}
                </button>
              </article>
            );
          })}
        </div>
      </section>

      {selectedAssignment && (
        <div
          onClick={closeInvitation}
          className="fixed inset-0 z-100 grid place-items-center bg-slate-950/60 p-4 backdrop-blur-sm"
        >
          <article
            onClick={(event) => event.stopPropagation()}
            className="relative max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl md:p-8"
          >
            <button
              type="button"
              onClick={() => setSelectedAssignment(null)}
              aria-label="Close project invitation"
              className="absolute right-4 top-4 z-10 grid size-10 cursor-pointer place-items-center rounded-full bg-orange-50 text-orange-700 transition hover:bg-orange-100 hover:text-orange-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500"
            >
              <X size={22} />
            </button>
            <p className="text-xs font-bold tracking-widest text-orange-600">
              PROJECT INVITATION •{" "}
              {selectedAssignment.challenge.trackingId}
            </p>

            <h2 className="mt-3 text-2xl font-extrabold text-slate-900">
              {selectedAssignment.challenge.title}
            </h2>
            <section className="mt-6 rounded-2xl border border-orange-200 bg-orange-50/50 p-5">
              <h3 className="text-xs font-bold tracking-widest text-orange-600">
                CITIZEN EVIDENCE
              </h3>

              {selectedAssignment.challenge.evidenceUrl ? (
                <div className="mt-4">
                  {selectedAssignment.challenge.evidenceResourceType === "video" ? (
                    <video
                      key={selectedAssignment.challenge.evidenceUrl}
                      src={selectedAssignment.challenge.evidenceUrl}
                      controls
                      playsInline
                      preload="metadata"
                      className="max-h-96 w-full rounded-xl bg-black"
                    >
                      Your browser does not support video playback.
                    </video>
                  ) : (
                    <img
                      src={selectedAssignment.challenge.evidenceUrl}
                      alt={`Evidence for ${selectedAssignment.challenge.title}`}
                      className="max-h-96 w-full rounded-xl bg-white object-contain"
                    />
                  )}

                  <a
                    href={selectedAssignment.challenge.evidenceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 inline-block text-sm font-bold text-orange-700 underline hover:text-orange-900"
                  >
                    Open original evidence
                  </a>
                </div>
              ) : (
                <p className="mt-3 text-sm text-slate-500">
                  No photo or video was attached to this report.
                </p>
              )}
            </section>

            <p className="mt-4 leading-7 text-slate-600">
              {selectedAssignment.challenge.description}
            </p>

            <section className="mt-6 rounded-2xl bg-orange-50 p-5">
              <h3 className="font-extrabold text-slate-900">
                Challenge information
              </h3>

              <p className="mt-3 text-sm text-slate-600">
                Category:{" "}
                <strong>
                  {selectedAssignment.challenge.category}
                </strong>
              </p>

              <p className="mt-2 text-sm text-slate-600">
                Location:{" "}
                <strong>
                  {selectedAssignment.challenge.location}
                </strong>
              </p>

              <p className="mt-2 text-sm text-slate-600">
                Priority:{" "}
                <strong>
                  {selectedAssignment.challenge.priority}
                </strong>
              </p>
            </section>

            {selectedAssignment.status === "INVITED" ? (
              <>
                <label className="mt-6 block">
                  <span className="text-sm font-bold text-slate-700">
                    Proposed approach
                  </span>

                  <textarea
                    value={proposal}
                    onChange={(event) =>
                      setProposal(event.target.value)
                    }
                    rows="5"
                    placeholder="Explain how your faculty and student team will research, prototype and test a solution..."
                    className="mt-2 w-full resize-none rounded-xl border border-slate-300 p-4 outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-100"
                  />
                </label>

                {error && (
                  <p className="mt-3 text-sm font-semibold text-red-600">
                    {error}
                  </p>
                )}

                <div className="mt-7 flex flex-col-reverse justify-end gap-3 sm:flex-row">
                  <button
                    type="button"
                    disabled={responding}
                    onClick={() =>
                      respondToInvitation("REJECTED")
                    }
                    className="rounded-xl bg-red-50 px-5 py-3 font-bold text-red-700 hover:bg-red-100 disabled:opacity-50"
                  >
                    Reject invitation
                  </button>

                  <button
                    type="button"
                    disabled={responding}
                    onClick={() =>
                      respondToInvitation("ACCEPTED")
                    }
                    className="rounded-xl bg-orange-500 px-5 py-3 font-bold text-white hover:bg-orange-600 disabled:opacity-50"
                  >
                    {responding
                      ? "Submitting..."
                      : "Accept and submit proposal"}
                  </button>
                </div>
              </>
            ) : (
              <button
                type="button"
                onClick={closeInvitation}
                className="mt-7 w-full rounded-xl bg-slate-900 px-5 py-3 font-bold text-white"
              >
                Close
              </button>
            )}
          </article>
        </div>
      )}
    </UniversityLayout>
  );
}

export default UniversityDashboard;