import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  Copy,
  MapPin,
  Search,
  Sparkles,
  Users,
  X,
} from "lucide-react";
import AdminLayout from "../layouts/AdminLayout";
import { useEffect, useState } from "react";
import api from "../services/api";
const statistics = [
  {
    label: "Awaiting review",
    value: "12",
    icon: Clock3,
    style: "bg-amber-50 text-amber-600",
  },
  {
    label: "High priority",
    value: "04",
    icon: AlertTriangle,
    style: "bg-red-50 text-red-600",
  },
  {
    label: "Possible duplicates",
    value: "07",
    icon: Copy,
    style: "bg-blue-50 text-blue-600",
  },
  {
    label: "Verified this month",
    value: "38",
    icon: CheckCircle2,
    style: "bg-emerald-50 text-emerald-600",
  },
];

function AdminDashboard() {
  const [reports, setReports] = useState([]);
  const [selectedReport, setSelectedReport] = useState(null);
  const [search, setSearch] = useState("");

  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisMessage, setAnalysisMessage] = useState("");
  const [reviewCategory, setReviewCategory] = useState("");
  const [reviewPriority, setReviewPriority] = useState("");
  const [savingClassification, setSavingClassification] = useState(false);
  const [classificationMessage, setClassificationMessage] = useState("");
  const [duplicates, setDuplicates] = useState([]);
  const [checkingDuplicates, setCheckingDuplicates] = useState(false);
  const [duplicatesChecked, setDuplicatesChecked] = useState(false);
  const [duplicateMessage, setDuplicateMessage] = useState("");
  const statistics = [
    {
      label: "Awaiting review",
      value: reports.filter((report) =>
        ["Under Review", "Submitted"].includes(report.status)
      ).length,
      icon: Clock3,
      style: "bg-amber-50 text-amber-600",
    },
    {
      label: "High priority",
      value: reports.filter(
        (report) => report.priority === "High"
      ).length,
      icon: AlertTriangle,
      style: "bg-red-50 text-red-600",
    },
    {
      label: "Total reports",
      value: reports.length,
      icon: Copy,
      style: "bg-blue-50 text-blue-600",
    },
    {
      label: "Currently verified",
      value: reports.filter(
        (report) => report.status === "Verified"
      ).length,
      icon: CheckCircle2,
      style: "bg-emerald-50 text-emerald-600",
    },
  ];

  const fetchReports = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/challenges");

      const formattedReports = response.data.challenges.map(
        (challenge) => ({
          ...challenge,

          decision:
            challenge.status === "Under Review" ||
              challenge.status === "Submitted"
              ? "Pending"
              : challenge.status,
        })
      );

      setReports(formattedReports);
    } catch (error) {
      console.error(error);

      setError(
        "Unable to load reports. Make sure the backend is running."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const filteredReports = reports.filter((report) =>
    report.title.toLowerCase().includes(search.toLowerCase())
  );

  const updateDecision = async (id, decision) => {
    try {
      setUpdating(true);
      setError("");

      const response = await api.patch(
        `/challenges/${id}/status`,
        {
          status: decision,
        }
      );

      const updatedChallenge = response.data.challenge;

      setReports((currentReports) =>
        currentReports.map((report) =>
          report.id === id
            ? {
              ...report,
              ...updatedChallenge,
              decision: updatedChallenge.status,
            }
            : report
        )
      );

      setSelectedReport(null);
    } catch (error) {
      console.error(error);

      setError(
        error.response?.data?.message ||
        "Unable to update the challenge status."
      );
    } finally {
      setUpdating(false);
    }
  };
  async function handleAnalyzeReport() {
    if (!selectedReport || analyzing) return;

    const reportId = selectedReport.id;
    setAnalyzing(true);
    setAnalysisMessage("");

    function applyAnalysis(challenge) {
      if (!challenge) return;

      const fields = {
        aiStatus: challenge.aiStatus,
        aiCategory: challenge.aiCategory,
        aiPriority: challenge.aiPriority,
        aiExplanation: challenge.aiExplanation,
        aiAnalyzedAt: challenge.aiAnalyzedAt,
      };

      setReports((current) =>
        current.map((report) =>
          report.id === reportId
            ? { ...report, ...fields }
            : report
        )
      );

      setSelectedReport((current) =>
        current?.id === reportId
          ? { ...current, ...fields }
          : current
      );
    }

    try {
      const response = await api.post(
        `/challenges/${reportId}/analyze`
      );

      applyAnalysis(response.data.challenge);
      setAnalysisMessage(response.data.message);
    } catch (requestError) {
      applyAnalysis(requestError.response?.data?.challenge);

      setAnalysisMessage(
        requestError.response?.data?.message ||
        "Unable to contact the analysis service."
      );
    } finally {
      setAnalyzing(false);
    }
  }
  async function saveClassification() {
    if (!selectedReport || savingClassification) return;

    const reportId = selectedReport.id;

    setSavingClassification(true);
    setClassificationMessage("");

    try {
      const response = await api.patch(
        `/challenges/${reportId}/classification`,
        {
          category: reviewCategory,
          priority: reviewPriority,
        }
      );

      const { category, priority } = response.data.challenge;

      setReports((current) =>
        current.map((report) =>
          report.id === reportId
            ? { ...report, category, priority }
            : report
        )
      );

      setSelectedReport((current) =>
        current?.id === reportId
          ? { ...current, category, priority }
          : current
      );

      setClassificationMessage(response.data.message);
    } catch (requestError) {
      setClassificationMessage(
        requestError.response?.data?.message ||
        "Unable to save classification."
      );
    } finally {
      setSavingClassification(false);
    }
  }
  async function checkDuplicates() {
    if (!selectedReport || checkingDuplicates) return;

    setCheckingDuplicates(true);
    setDuplicatesChecked(false);
    setDuplicateMessage("");
    setDuplicates([]);

    try {
      const response = await api.get(
        `/challenges/${selectedReport.id}/duplicates`
      );

      setDuplicates(response.data.duplicates || []);
      setDuplicatesChecked(true);
      setDuplicateMessage(
        `Checked ${response.data.checkedCount} recent reports.`
      );
    } catch (requestError) {
      setDuplicateMessage(
        requestError.response?.data?.message ||
        "Unable to check duplicates."
      );
    } finally {
      setCheckingDuplicates(false);
    }
  }
  return (
    <AdminLayout title="Verification queue" subtitle="ADMIN CONSOLE">
      <section className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        {statistics.map(({ label, value, icon: Icon, style }) => (
          <article
            key={label}
            className="rounded-2xl border border-purple-100 bg-white p-5 shadow-sm"
          >
            <div
              className={`grid size-11 place-items-center rounded-xl ${style}`}
            >
              <Icon size={21} />
            </div>

            <strong className="mt-5 block text-2xl font-extrabold text-slate-900 md:text-3xl">
              {value}
            </strong>

            <p className="mt-1 text-sm text-slate-500">{label}</p>
          </article>
        ))}
      </section>

      <section className="mt-6 rounded-2xl border border-purple-100 bg-white p-5 shadow-sm md:p-6">
        <div className="flex flex-col justify-between gap-5 md:flex-row md:items-center">
          <div>
            <p className="text-xs font-bold tracking-widest text-purple-600">
              PRIORITY-FIRST REVIEW
            </p>

            <h2 className="mt-2 text-xl font-extrabold text-slate-900">
              Citizen reports requiring verification
            </h2>
          </div>

          <div className="relative w-full md:max-w-sm">
            <Search
              size={18}
              className="absolute left-4 top-3.5 text-slate-400"
            />

            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search reports..."
              className="w-full rounded-xl border border-slate-300 py-3 pl-11 pr-4 outline-none focus:border-purple-500 focus:ring-4 focus:ring-purple-100"
            />
          </div>
        </div>
        {loading && (
          <div className="mt-6 flex items-center justify-center gap-3 rounded-xl bg-purple-50 p-8 text-purple-700">
            <span className="size-5 animate-spin rounded-full border-2 border-purple-200 border-t-purple-600" />
            <span className="font-semibold">
              Loading citizen reports...
            </span>
          </div>
        )}

        {error && (
          <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
            {error}

            <button
              onClick={fetchReports}
              className="ml-3 font-extrabold underline"
            >
              Try again
            </button>
          </div>
        )}
        {!loading && !error && (
          <div className="mt-6 overflow-x-auto">
            <table className="w-full min-w-[850px] border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-left">
                  <th className="px-3 py-4 text-xs font-bold text-slate-500">
                    CHALLENGE
                  </th>

                  <th className="px-3 py-4 text-xs font-bold text-slate-500">
                    CATEGORY
                  </th>

                  <th className="px-3 py-4 text-xs font-bold text-slate-500">
                    PRIORITY
                  </th>

                  <th className="px-3 py-4 text-xs font-bold text-slate-500">
                    SUPPORT
                  </th>

                  <th className="px-3 py-4 text-xs font-bold text-slate-500">
                    DECISION
                  </th>

                  <th className="px-3 py-4 text-xs font-bold text-slate-500">
                    ACTION
                  </th>
                </tr>
              </thead>

              <tbody>
                {filteredReports.map((report) => (
                  <tr
                    key={report.id}
                    className="border-b border-slate-100"
                  >
                    <td className="px-3 py-4">
                      <p className="max-w-sm font-bold text-slate-900">
                        {report.title}
                      </p>

                      <p className="mt-1 flex items-center gap-1 text-xs text-slate-500">
                        <MapPin size={13} />
                        {report.id} • {report.location}
                      </p>
                    </td>

                    <td className="px-3 py-4 text-sm text-slate-600">
                      {report.category}
                    </td>

                    <td className="px-3 py-4">
                      <span
                        className={`rounded-full px-3 py-1.5 text-xs font-bold ${report.priority === "High"
                          ? "bg-red-50 text-red-700"
                          : "bg-amber-50 text-amber-700"
                          }`}
                      >
                        {report.priority}
                      </span>
                    </td>

                    <td className="px-3 py-4 text-sm font-semibold text-slate-600">
                      {report.supporters}
                    </td>

                    <td className="px-3 py-4">
                      <span
                        className={`rounded-full px-3 py-1.5 text-xs font-bold ${report.decision === "Verified"
                          ? "bg-emerald-50 text-emerald-700"
                          : report.decision === "Rejected"
                            ? "bg-red-50 text-red-700"
                            : "bg-slate-100 text-slate-600"
                          }`}
                      >
                        {report.decision}
                      </span>
                    </td>

                    <td className="px-3 py-4">
                      <button
                        onClick={() => {
                          setAnalysisMessage("");
                          setClassificationMessage("");
                          setReviewCategory(report.category);
                          setReviewPriority(report.priority);
                          setSelectedReport(report);
                        }}
                        className="rounded-lg bg-purple-50 px-4 py-2 text-sm font-bold text-purple-700 hover:bg-purple-600 hover:text-white"
                      >
                        Review
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {selectedReport && (
        <div
          onClick={() => setSelectedReport(null)}
          className="fixed inset-0 z-[100] grid place-items-center bg-slate-950/60 p-4 backdrop-blur-sm"
        >
          <article
            onClick={(event) => event.stopPropagation()}
            className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl md:p-8"
          >
            <div className="flex items-start justify-between gap-5">
              <div>
                <p className="text-xs font-bold tracking-widest text-purple-600">
                  {selectedReport.id} • ADMIN REVIEW
                </p>

                <h2 className="mt-3 text-2xl font-extrabold text-slate-900">
                  {selectedReport.title}
                </h2>
              </div>

              <button
                onClick={() => setSelectedReport(null)}
                className="grid size-10 shrink-0 place-items-center rounded-full bg-slate-100"
              >
                <X size={20} />
              </button>
            </div>

            <p className="mt-5 leading-7 text-slate-600">
              {selectedReport.description}
            </p>
            <section className="mt-6 rounded-2xl border border-purple-200 bg-purple-50/50 p-5">
              <h3 className="text-xs font-bold tracking-widest text-purple-600">
                CITIZEN EVIDENCE
              </h3>

              {selectedReport.evidenceUrl ? (
                <div className="mt-4">
                  {selectedReport.evidenceResourceType === "video" ? (
                    <video
                      key={selectedReport.evidenceUrl}
                      src={selectedReport.evidenceUrl}
                      controls
                      playsInline
                      preload="metadata"
                      className="max-h-96 w-full rounded-xl bg-black"
                    >
                      Your browser does not support video playback.
                    </video>
                  ) : (
                    <img
                      src={selectedReport.evidenceUrl}
                      alt={`Evidence for ${selectedReport.title}`}
                      className="max-h-96 w-full rounded-xl bg-white object-contain"
                    />
                  )}

                  <a
                    href={selectedReport.evidenceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 inline-block text-sm font-bold text-purple-700 underline hover:text-purple-900"
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

            <section className="mt-6 rounded-2xl border border-blue-200 bg-blue-50 p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h3 className="text-xs font-bold tracking-widest text-blue-600">
                  AI-ASSISTED REVIEW
                </h3>

                <button
                  type="button"
                  onClick={handleAnalyzeReport}
                  disabled={analyzing || updating}
                  className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-bold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {analyzing ? "Analyzing..." : "Analyze report"}
                </button>
              </div>

              {selectedReport.aiStatus === "COMPLETED" ? (
                <div className="mt-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <p className="text-xs text-slate-500">
                        Suggested category
                      </p>
                      <p className="mt-1 font-bold text-slate-900">
                        {selectedReport.aiCategory}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-slate-500">
                        Suggested priority
                      </p>
                      <p className="mt-1 font-bold text-slate-900">
                        {selectedReport.aiPriority}
                      </p>
                    </div>
                  </div>

                  <p className="mt-4 text-sm leading-6 text-slate-700">
                    {selectedReport.aiExplanation}
                  </p>

                  <p className="mt-3 text-xs text-blue-700">
                    AI suggestions require admin review. They do not change
                    the report’s category, priority or status automatically.
                  </p>
                </div>
              ) : (
                <p className="mt-4 text-sm text-slate-600">
                  {selectedReport.aiStatus === "UNAVAILABLE"
                    ? "AI analysis was unavailable. Manual review is still available."
                    : "No AI analysis yet. Click Analyze report to request suggestions."}
                </p>
              )}

              {analysisMessage && (
                <p
                  role="status"
                  className="mt-4 rounded-xl bg-white p-3 text-sm font-semibold text-slate-700"
                >
                  {analysisMessage}
                </p>
              )}
            </section>

            <section className="mt-5 rounded-2xl border border-purple-200 bg-purple-50/50 p-5">
              <h3 className="font-bold text-slate-900">
                Admin classification
              </h3>

              <fieldset
                disabled={
                  savingClassification ||
                  updating ||
                  analyzing ||
                  ["Resolved", "Rejected"].includes(selectedReport.status)
                }
                className="mt-4 space-y-4 disabled:opacity-60"
              >
                {selectedReport.aiStatus === "COMPLETED" && (
                  <button
                    type="button"
                    onClick={() => {
                      setReviewCategory(selectedReport.aiCategory);
                      setReviewPriority(selectedReport.aiPriority);
                      setClassificationMessage(
                        "Suggestions copied. Click Save classification to apply them."
                      );
                    }}
                    className="text-sm font-bold text-purple-700 underline"
                  >
                    Use AI suggestions
                  </button>
                )}

                <label className="block">
                  <span className="text-sm font-semibold text-slate-700">
                    Category
                  </span>

                  <select
                    value={reviewCategory}
                    onChange={(event) => setReviewCategory(event.target.value)}
                    className="mt-2 w-full rounded-xl border border-slate-300 bg-white p-3 text-slate-900"
                  >
                    {[
                      "Water & Sanitation",
                      "Waste Management",
                      "Road Safety",
                      "Public Health",
                      "Infrastructure",
                      "Other",
                    ].map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block">
                  <span className="text-sm font-semibold text-slate-700">
                    Priority
                  </span>

                  <select
                    value={reviewPriority}
                    onChange={(event) => setReviewPriority(event.target.value)}
                    className="mt-2 w-full rounded-xl border border-slate-300 bg-white p-3 text-slate-900"
                  >
                    {["Low", "Medium", "High"].map((priority) => (
                      <option key={priority} value={priority}>
                        {priority}
                      </option>
                    ))}
                  </select>
                </label>

                <button
                  type="button"
                  onClick={saveClassification}
                  className="rounded-xl bg-purple-600 px-5 py-3 text-sm font-bold text-white hover:bg-purple-700"
                >
                  {savingClassification ? "Saving..." : "Save classification"}
                </button>
              </fieldset>

              {classificationMessage && (
                <p role="status" className="mt-3 text-sm text-slate-700">
                  {classificationMessage}
                </p>
              )}
            </section>
            <section className="mt-5 rounded-2xl border border-blue-200 p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h3 className="font-bold text-slate-900">
                  Possible duplicates
                </h3>

                <button
                  type="button"
                  onClick={checkDuplicates}
                  disabled={checkingDuplicates}
                  className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
                >
                  {checkingDuplicates ? "Checking..." : "Check duplicates"}
                </button>
              </div>

              <p className="mt-2 text-xs text-slate-500">
                Text and location comparison. Results require manual review.
              </p>

              {duplicateMessage && (
                <p role="status" className="mt-3 text-sm text-slate-600">
                  {duplicateMessage}
                </p>
              )}

              {duplicatesChecked && duplicates.length === 0 && (
                <p className="mt-3 text-sm text-slate-600">
                  No possible duplicates found among the reports checked.
                </p>
              )}

              {duplicates.map((report) => (
                <article
                  key={report.id}
                  className="mt-3 rounded-xl bg-slate-50 p-4"
                >
                  <p className="text-xs font-bold text-blue-600">
                    {report.trackingId}
                  </p>

                  <h4 className="mt-1 font-bold text-slate-900">
                    {report.title}
                  </h4>

                  <p className="mt-1 text-sm text-slate-600">
                    {report.location} · {report.status}
                  </p>

                  <p className="mt-2 text-sm text-slate-600">
                    Word overlap: {report.textSimilarity}%
                    {report.distanceMeters !== null
                      ? ` · Approximately ${report.distanceMeters} metres away`
                      : " · GPS unavailable"}
                  </p>

                  <p className="mt-1 text-xs text-slate-500">
                    {report.reason}
                  </p>
                </article>
              ))}
            </section>
            <section className="mt-5 grid gap-4 sm:grid-cols-3">
              <div className="rounded-xl bg-slate-50 p-4">
                <p className="text-xs font-bold text-slate-500">
                  LOCATION
                </p>

                <p className="mt-2 text-sm font-bold text-slate-900">
                  {selectedReport.location}
                </p>
              </div>

              <div className="rounded-xl bg-slate-50 p-4">
                <p className="text-xs font-bold text-slate-500">
                  SUPPORTERS
                </p>

                <p className="mt-2 flex items-center gap-2 text-sm font-bold text-slate-900">
                  <Users size={16} />
                  {selectedReport.supporters}
                </p>
              </div>

              <div className="rounded-xl bg-slate-50 p-4">
                <p className="text-xs font-bold text-slate-500">
                  DUPLICATES
                </p>

                <p className="mt-2 text-sm font-bold text-slate-900">
                  Use Check duplicates above
                </p>
              </div>
            </section>

            <div className="mt-7 flex flex-col justify-end gap-3 border-t border-slate-200 pt-6 sm:flex-row">
              <button
                disabled={updating}
                onClick={() =>
                  updateDecision(selectedReport.id, "Rejected")
                }
                className="rounded-xl bg-red-50 px-5 py-3 font-bold text-red-700 hover:bg-red-600 hover:text-white"
              >
                {updating ? "Updating..." : "Reject"}
              </button>

              <button className="rounded-xl bg-amber-50 px-5 py-3 font-bold text-amber-700 hover:bg-amber-500 hover:text-white">
                Request clarification
              </button>

              <button
                disabled={updating}
                onClick={() =>
                  updateDecision(selectedReport.id, "Verified")
                }
                className="rounded-xl bg-emerald-600 px-5 py-3 font-bold text-white hover:bg-emerald-700"
              >
                {updating ? "Updating..." : "Verify challenge"}
              </button>
            </div>
          </article>
        </div>
      )}
    </AdminLayout>
  );
}

export default AdminDashboard;