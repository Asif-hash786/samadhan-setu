import { FileText, Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import ChallengeCard from "../components/ChallengeCard";
import ChallengeModal from "../components/ChallengeModal";
import CitizenLayout from "../layouts/CitizenLayout";
import api from "../services/api";


function SolutionReview({ challenge, onValidated }) {
  const [feedback, setFeedback] = useState({});
  const [savingId, setSavingId] = useState(null);
  const [error, setError] = useState("");

  const solutions = (challenge.universityAssignments || []).filter(
    (assignment) =>
      ["PENDING", "CONFIRMED", "NEEDS_WORK"].includes(
        assignment.validationStatus
      )
  );

  if (solutions.length === 0) return null;

  const closed = ["Resolved", "Rejected"].includes(challenge.status);

  async function submitReview(assignmentId, decision) {
    if (savingId) return;

    const comment = (feedback[assignmentId] || "").trim();

    if (comment.length < 10 || comment.length > 2000) {
      setError("Please write feedback containing 10–2000 characters.");
      return;
    }

    try {
      setSavingId(assignmentId);
      setError("");

      const response = await api.patch(
        `/challenges/${challenge.id}/assignments/${assignmentId}/validate`,
        {
          decision,
          feedback: comment,
        }
      );

      onValidated(response.data.assignment);
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
        "Unable to save feedback. Please try again."
      );
    } finally {
      setSavingId(null);
    }
  }

  return (
    <section className="rounded-2xl border border-blue-200 bg-white p-5">
      <h3 className="font-extrabold text-slate-900">
        University solutions
      </h3>

      <p className="mt-1 text-sm text-slate-500">
        Confirm resolution only after checking the result in your community.
      </p>

      {solutions.map((assignment) => (
        <div
          key={assignment.id}
          className="mt-4 rounded-xl border border-slate-200 p-4"
        >
          <h4 className="font-bold text-blue-800">
            {assignment.university?.name || "University team"}
          </h4>

          <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-600">
            {assignment.lastUpdate || "No solution summary provided."}
          </p>

          {assignment.validationStatus === "PENDING" && !closed ? (
            <>
              <label
                htmlFor={`feedback-${assignment.id}`}
                className="mt-4 block text-sm font-bold text-slate-700"
              >
                Your feedback
              </label>

              <textarea
                id={`feedback-${assignment.id}`}
                value={feedback[assignment.id] || ""}
                onChange={(event) =>
                  setFeedback((current) => ({
                    ...current,
                    [assignment.id]: event.target.value,
                  }))
                }
                disabled={savingId !== null}
                rows={3}
                maxLength={2000}
                placeholder="What improved? What still needs fixing?"
                className="mt-2 w-full rounded-xl border border-slate-300 p-3 text-sm focus:border-blue-500 focus:outline-none disabled:opacity-60"
              />

              <div className="mt-3 flex flex-col gap-2">
                <button
                  type="button"
                  disabled={savingId !== null}
                  onClick={() =>
                    submitReview(assignment.id, "CONFIRMED")
                  }
                  className="rounded-xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-50"
                >
                  {savingId === assignment.id
                    ? "Saving..."
                    : "Problem resolved"}
                </button>

                <button
                  type="button"
                  disabled={savingId !== null}
                  onClick={() =>
                    submitReview(assignment.id, "NEEDS_WORK")
                  }
                  className="rounded-xl bg-amber-100 px-4 py-3 text-sm font-bold text-amber-800 hover:bg-amber-200 disabled:opacity-50"
                >
                  Still needs work
                </button>
              </div>
            </>
          ) : (
            <div className="mt-3 rounded-lg bg-slate-50 p-3 text-sm">
              <p className="font-bold text-slate-800">
                {assignment.validationStatus === "CONFIRMED"
                  ? "Resolution confirmed"
                  : assignment.validationStatus === "NEEDS_WORK"
                    ? "Improvements requested"
                    : "Report closed — review unavailable"}
              </p>

              {assignment.validationFeedback && (
                <p className="mt-1 whitespace-pre-wrap text-slate-600">
                  {assignment.validationFeedback}
                </p>
              )}
            </div>
          )}
        </div>
      ))}

      {error && (
        <p role="alert" className="mt-3 text-sm font-semibold text-red-600">
          {error}
        </p>
      )}
    </section>
  );
}


function MyReports() {
  const navigate = useNavigate();

  const [myReports, setMyReports] = useState([]);
  const [selectedChallenge, setSelectedChallenge] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadReports() {
      try {
        setLoading(true);
        setError("");

        const response = await api.get("/challenges/mine");

        setMyReports(response.data.challenges || []);
      } catch (requestError) {
        console.error("Reports loading failed:", requestError);
        setError(
          "Unable to load your reports. Check whether the backend is running."
        );
      } finally {
        setLoading(false);
      }
    }

    loadReports();
  }, []);
  function handleValidated(updatedAssignment) {
    function updateReport(report) {
      if (report.id !== updatedAssignment.challengeId) {
        return report;
      }

      return {
        ...report,
        ...updatedAssignment.challenge,
        universityAssignments: (
          report.universityAssignments || []
        ).map((assignment) =>
          assignment.id === updatedAssignment.id
            ? {
              ...assignment,
              ...updatedAssignment,
              university: assignment.university,
            }
            : assignment
        ),
      };
    }

    setMyReports((current) => current.map(updateReport));

    setSelectedChallenge((current) =>
      current ? updateReport(current) : null
    );
  }

  return (
    <CitizenLayout title="My reports" subtitle="CITIZEN ACTIVITY">
      <section className="flex flex-col justify-between gap-5 rounded-3xl bg-gradient-to-r from-blue-700 to-blue-500 p-7 text-white shadow-xl shadow-blue-200 sm:flex-row sm:items-center">
        <div>
          <FileText size={30} className="text-blue-200" />

          <h2 className="mt-4 text-2xl font-extrabold">
            Track your submitted challenges
          </h2>

          <p className="mt-2 text-blue-100">
            Follow verification, university matching and pilot progress.
          </p>
        </div>

        <button
          onClick={() => navigate("/citizen/report")}
          className="flex shrink-0 items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 font-bold text-blue-700 transition hover:bg-blue-50"
        >
          <Plus size={18} />
          New report
        </button>
      </section>

      {loading && (
        <div className="mt-6 rounded-2xl border border-blue-100 bg-blue-50 p-5 text-center font-semibold text-blue-700">
          Loading reports...
        </div>
      )}

      {error && (
        <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-5 text-center font-semibold text-red-700">
          {error}
        </div>
      )}

      {!loading && !error && myReports.length === 0 && (
        <div className="mt-6 rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center">
          <FileText
            size={40}
            className="mx-auto text-slate-300"
          />

          <h3 className="mt-4 text-lg font-bold text-slate-800">
            No reports submitted yet
          </h3>

          <p className="mt-2 text-sm text-slate-500">
            Submit your first community challenge to start tracking it.
          </p>

          <button
            onClick={() => navigate("/citizen/report")}
            className="mt-5 rounded-xl bg-blue-600 px-5 py-3 font-bold text-white transition hover:bg-blue-700"
          >
            Report a challenge
          </button>
        </div>
      )}

      {!loading && !error && myReports.length > 0 && (
        <section className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {myReports.map((challenge) => (
            <div key={challenge.id} className="space-y-4">
              <ChallengeCard
                challenge={challenge}
                onView={setSelectedChallenge}
              />

              <SolutionReview
                challenge={challenge}
                onValidated={handleValidated}
              />
            </div>
          ))}
        </section>
      )}

      <ChallengeModal
        challenge={selectedChallenge}
        onClose={() => setSelectedChallenge(null)}
      />
    </CitizenLayout>
  );
}

export default MyReports;