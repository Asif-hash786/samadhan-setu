import { useEffect, useState } from "react";
import AdminLayout from "../layouts/AdminLayout";
import api from "../services/api";

export default function UniversityApplications() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function loadApplications() {
    setLoading(true);
    setError("");

    try {
      const response = await api.get("/universities/applications");
      setApplications(response.data.applications || []);
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
          "Unable to load applications."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadApplications();
  }, []);

  async function reviewApplication(id, decision) {
    if (savingId) return;

    setSavingId(id);
    setError("");
    setMessage("");

    try {
      const response = await api.patch(
        `/universities/applications/${id}`,
        { decision }
      );

      setApplications((current) =>
        current.filter((application) => application.id !== id)
      );

      setMessage(response.data.message);
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
          "Unable to review this application."
      );
    } finally {
      setSavingId(null);
    }
  }

  return (
    <AdminLayout
      title="University applications"
      subtitle="PARTNER APPROVAL"
    >
      <section className="rounded-2xl border border-purple-100 bg-white p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xl font-extrabold text-slate-900">
            Pending university applications
          </h2>

          <button
            type="button"
            onClick={loadApplications}
            disabled={loading || savingId !== null}
            className="rounded-xl bg-purple-100 px-4 py-2 font-bold text-purple-700 disabled:opacity-50"
          >
            Refresh
          </button>
        </div>

        <p className="mt-2 text-sm text-slate-500">
          Review the institution and contact details before approving.
          Expertise entries are supplied by the applicant.
        </p>

        {message && (
          <p
            role="status"
            className="mt-5 rounded-xl bg-emerald-50 p-4 text-emerald-700"
          >
            {message}
          </p>
        )}

        {error && (
          <p
            role="alert"
            className="mt-5 rounded-xl bg-red-50 p-4 text-red-700"
          >
            {error}
          </p>
        )}

        {loading ? (
          <p className="mt-6 text-slate-500">
            Loading applications...
          </p>
        ) : (
          <>
            {!error && applications.length === 0 && (
              <p className="mt-6 rounded-xl bg-slate-50 p-5 text-slate-500">
                No pending applications.
              </p>
            )}

            <div className="mt-6 space-y-5">
              {applications.map((application) => (
                <article
                  key={application.id}
                  className="rounded-2xl border border-slate-200 p-5"
                >
                  <h3 className="text-lg font-extrabold text-slate-900">
                    {application.name}
                  </h3>

                  <p className="mt-1 break-all text-sm text-slate-600">
                    {application.email}
                  </p>

                  <p className="mt-2 text-xs text-slate-500">
                    Applied{" "}
                    {new Date(application.createdAt).toLocaleDateString(
                      "en-IN"
                    )}
                  </p>

                  <dl className="mt-4 space-y-3 text-sm">
                    {[
                      ["Departments", application.departments],
                      ["Skills", application.skills],
                      ["Research areas", application.researchAreas],
                    ].map(([label, entries]) => (
                      <div key={label}>
                        <dt className="font-bold text-slate-700">
                          {label}
                        </dt>
                        <dd className="mt-1 text-slate-600">
                          {entries?.length
                            ? entries.join(", ")
                            : "Not provided"}
                        </dd>
                      </div>
                    ))}
                  </dl>

                  <div className="mt-5 flex flex-wrap gap-3">
                    <button
                      type="button"
                      disabled={savingId !== null}
                      onClick={() =>
                        reviewApplication(application.id, "APPROVE")
                      }
                      className="rounded-xl bg-emerald-600 px-5 py-3 font-bold text-white disabled:opacity-50"
                    >
                      {savingId === application.id
                        ? "Saving..."
                        : "Approve university"}
                    </button>

                    <button
                      type="button"
                      disabled={savingId !== null}
                      onClick={() =>
                        reviewApplication(application.id, "REJECT")
                      }
                      className="rounded-xl bg-red-50 px-5 py-3 font-bold text-red-700 disabled:opacity-50"
                    >
                      Reject
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </>
        )}
      </section>
    </AdminLayout>
  );
}