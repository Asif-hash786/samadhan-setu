import { useEffect, useState } from "react";
import UniversityLayout from "../layouts/UniversityLayout";
import api from "../services/api";

const fields = [
  {
    name: "departments",
    label: "Departments",
    placeholder: "Civil Engineering\nEnvironmental Engineering",
  },
  {
    name: "skills",
    label: "Skills",
    placeholder: "Water testing\nIoT sensors",
  },
  {
    name: "researchAreas",
    label: "Research areas",
    placeholder: "Water purification\nWaste management",
  },
];

function toForm(university) {
  return {
    departments: (university.departments || []).join("\n"),
    skills: (university.skills || []).join("\n"),
    researchAreas: (university.researchAreas || []).join("\n"),
  };
}

export default function UniversityProfile() {
  const [form, setForm] = useState({
    departments: "",
    skills: "",
    researchAreas: "",
  });

  const [name, setName] = useState("");
  const [loading, setLoading] = useState(true);
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    let active = true;

    async function loadProfile() {
      try {
        const response = await api.get("/universities/profile");

        if (!active) return;

        const university = response.data.university;

        setName(university.name);
        setForm(toForm(university));
        setLoaded(true);
      } catch (requestError) {
        if (!active) return;

        setError(
          requestError.response?.data?.message ||
            "Unable to load your expertise. Refresh to try again."
        );
      } finally {
        if (active) setLoading(false);
      }
    }

    loadProfile();

    return () => {
      active = false;
    };
  }, []);

  async function handleSubmit(event) {
    event.preventDefault();

    if (!loaded || saving) return;

    setError("");
    setMessage("");

    const payload = {};

    for (const field of fields) {
      const entries = form[field.name]
        .split("\n")
        .map((entry) => entry.trim())
        .filter(Boolean);

      if (
        entries.length > 20 ||
        entries.some((entry) => entry.length > 100)
      ) {
        setError(
          `${field.label}: use up to 20 entries, each at most 100 characters.`
        );
        return;
      }

      payload[field.name] = entries;
    }

    try {
      setSaving(true);

      const response = await api.patch(
        "/universities/profile",
        payload
      );

      setForm(toForm(response.data.university));
      setMessage(response.data.message || "Expertise saved.");
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
          "Unable to save expertise. Your entries are still here."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <UniversityLayout
      title="University expertise"
      subtitle="UNIVERSITY PROFILE"
    >
      <section className="mx-auto max-w-3xl rounded-3xl border border-orange-100 bg-white p-6 shadow-sm md:p-8">
        <h2 className="text-2xl font-extrabold text-slate-900">
          {name || "Your university"}
        </h2>

        <p className="mt-2 text-sm leading-6 text-slate-500">
          Describe your university’s expertise to help administrators
          identify relevant community challenges.
        </p>

        {loading && (
          <p className="mt-6 font-semibold text-orange-600">
            Loading expertise...
          </p>
        )}

        {error && (
          <p
            role="alert"
            className="mt-5 rounded-xl bg-red-50 p-4 text-sm font-semibold text-red-700"
          >
            {error}
          </p>
        )}

        {message && (
          <p
            role="status"
            className="mt-5 rounded-xl bg-emerald-50 p-4 text-sm font-semibold text-emerald-700"
          >
            {message}
          </p>
        )}

        {loaded && (
          <form onSubmit={handleSubmit} className="mt-6">
            <fieldset disabled={saving} className="space-y-6">
              {fields.map((field) => (
                <div key={field.name}>
                  <label
                    htmlFor={field.name}
                    className="text-sm font-bold text-slate-700"
                  >
                    {field.label}
                  </label>

                  <textarea
                    id={field.name}
                    value={form[field.name]}
                    onChange={(event) => {
                      setForm((current) => ({
                        ...current,
                        [field.name]: event.target.value,
                      }));
                      setMessage("");
                    }}
                    placeholder={field.placeholder}
                    rows={4}
                    aria-describedby={`${field.name}-help`}
                    className="mt-2 w-full rounded-xl border border-slate-300 bg-white p-4 text-slate-900 outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-100 disabled:opacity-60"
                  />

                  <p
                    id={`${field.name}-help`}
                    className="mt-1 text-xs text-slate-500"
                  >
                    One entry per line. Maximum 20 entries, each up to
                    100 characters. Leave empty to clear this list.
                  </p>
                </div>
              ))}

              <button
                type="submit"
                disabled={saving}
                className="rounded-xl bg-orange-500 px-6 py-3 font-bold text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving ? "Saving..." : "Save expertise"}
              </button>
            </fieldset>
          </form>
        )}
      </section>
    </UniversityLayout>
  );
}