import {
  ArrowLeft,
  ImagePlus,
  LocateFixed,
  MapPin,
  Send,
} from "lucide-react";
import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import CitizenLayout from "../layouts/CitizenLayout";
import api from "../services/api";
import LocationPicker from "../components/LocationPicker";
const inputStyle =
  "mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100";

function ReportChallenge() {
  const navigate = useNavigate();
  const locationBusy = useRef(false);
  const addressRevision = useRef(0);

  const [formData, setFormData] = useState({
    title: "",
    category: "",
    location: "",
    description: "",
    latitude: null,
    longitude: null,
  });

  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState("");
  const [locationError, setLocationError] = useState("");
  const [createdChallenge, setCreatedChallenge] = useState(null);
  const [evidenceName, setEvidenceName] = useState("");
  const [evidenceFile, setEvidenceFile] = useState(null);
  const [uploadedMedia, setUploadedMedia] = useState(null);
  const [uploading, setUploading] = useState(false);
  const hasCoordinates =
    Number.isFinite(formData.latitude) &&
    Number.isFinite(formData.longitude);

  // const mapUrl = hasCoordinates
  //   ? `https://maps.google.com/maps?q=${formData.latitude},${formData.longitude}&z=16&output=embed`
  //   : "";

  function handleChange(event) {
    const { name, value } = event.target;

    // Avoid overwriting an address the citizen edits during lookup.
    if (name === "location") {
      addressRevision.current += 1;
    }

    setFormData((current) => ({
      ...current,
      [name]: value,
    }));
  }
  async function updateSelectedLocation(latitude, longitude) {
    const revisionAtStart = addressRevision.current;

    // Clear the old address so it cannot be submitted for a new pin.
    setFormData((current) => ({
      ...current,
      latitude,
      longitude,
      location: "",
    }));

    try {
      const response = await api.post(
        "/locations/reverse",
        { latitude, longitude },
        { timeout: 15000 }
      );

      const address = response.data?.address;

      if (typeof address !== "string" || !address.trim()) {
        throw new Error("No address returned");
      }

      // Preserve any address typed while the lookup was running.
      if (addressRevision.current === revisionAtStart) {
        setFormData((current) => ({
          ...current,
          location: address.trim(),
        }));
      }
    } catch (lookupError) {
      setLocationError(
        lookupError.response?.data?.message ||
        "Pin selected, but the address lookup failed. Enter the address manually."
      );
    }
  }

  async function handleMapSelect({ latitude, longitude }) {
    if (loading || locationBusy.current) return;

    locationBusy.current = true;
    setLocating(true);
    setLocationError("");

    try {
      await updateSelectedLocation(latitude, longitude);
    } finally {
      locationBusy.current = false;
      setLocating(false);
    }
  }

  async function captureCurrentLocation() {
    if (loading || locationBusy.current) return;

    if (!navigator.geolocation) {
      setLocationError(
        "GPS is unavailable. Select a point on the map or enter an address."
      );
      return;
    }

    locationBusy.current = true;
    setLocating(true);
    setLocationError("");

    try {
      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000,
        });
      });

      const latitude = Number(position.coords.latitude.toFixed(6));
      const longitude = Number(position.coords.longitude.toFixed(6));

      await updateSelectedLocation(latitude, longitude);
    } catch (geoError) {
      const messages = {
        1: "Location permission was denied. Select the problem site on the map.",
        2: "GPS is unavailable. Select the problem site on the map.",
        3: "GPS timed out. Try again or select a point on the map.",
      };

      setLocationError(
        messages[geoError.code] || "Unable to capture your location."
      );
    } finally {
      locationBusy.current = false;
      setLocating(false);
    }
  }
  async function captureCurrentLocation() {
    if (loading || locationBusy.current) return;

    if (!navigator.geolocation) {
      setLocationError(
        "Geolocation is not supported. Please enter the address manually."
      );
      return;
    }

    locationBusy.current = true;
    setLocating(true);
    setLocationError("");

    const revisionAtStart = addressRevision.current;

    try {
      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000,
        });
      });

      const latitude = Number(position.coords.latitude.toFixed(6));
      const longitude = Number(position.coords.longitude.toFixed(6));

      // Keep the GPS pin even if the address service is unavailable.
      setFormData((current) => ({
        ...current,
        latitude,
        longitude,
      }));

      try {
        const response = await api.post(
          "/locations/reverse",
          { latitude, longitude },
          { timeout: 15000 }
        );

        const address = response.data?.address;

        if (typeof address !== "string" || !address.trim()) {
          throw new Error("No address returned");
        }

        // Preserve any manual edits made while the lookup was running.
        if (addressRevision.current === revisionAtStart) {
          setFormData((current) => ({
            ...current,
            location: address.trim(),
          }));
        }
      } catch (lookupError) {
        setLocationError(
          lookupError.response?.data?.message ||
          "GPS captured, but the address could not be found. Please enter it manually."
        );
      }
    } catch (geoError) {
      const messages = {
        1: "Location permission was denied. Enter the address manually or allow location access.",
        2: "Your location is unavailable. Please enter the address manually.",
        3: "Location request timed out. Try again or enter the address manually.",
      };

      setLocationError(
        messages[geoError.code] ||
        "Unable to capture your current location."
      );
    } finally {
      locationBusy.current = false;
      setLocating(false);
    }
  }

  function removeCoordinates() {
    if (loading || locationBusy.current) return;

    addressRevision.current += 1;

    setFormData((current) => ({
      ...current,
      latitude: null,
      longitude: null,
    }));

    setLocationError("");
  }
  function handleEvidenceChange(event) {
    const file = event.target.files?.[0] || null;

    setError("");
    setUploadedMedia(null);
    setEvidenceFile(null);

    if (!file) return;

    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "video/mp4",
    ];

    if (!allowedTypes.includes(file.type)) {
      setError("Please select a JPG, PNG or MP4 file.");
      event.target.value = "";
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError("Evidence must be 10 MB or smaller.");
      event.target.value = "";
      return;
    }

    setEvidenceFile(file);
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (loading || locating) return;

    const payload = {
      ...formData,
      title: formData.title.trim(),
      location: formData.location.trim(),
      description: formData.description.trim(),
    };

    if (
      !payload.title ||
      !payload.category ||
      !payload.location ||
      !payload.description
    ) {
      setError("Please complete all required fields.");
      return;
    }

    try {
      setLoading(true);
      setError("");

      let media = uploadedMedia;

      // Reuse a successful upload if report submission needs retrying.
      if (evidenceFile && !media) {
        setUploading(true);

        const uploadData = new FormData();
        uploadData.append("file", evidenceFile);

        const uploadResponse = await api.post(
          "/uploads",
          uploadData,
          {
            // Override the API instance's JSON content type.
            // The browser supplies the multipart boundary.
            headers: {
              "Content-Type": undefined,
            },
          }
        );

        media = uploadResponse.data.media;
        setUploadedMedia(media);
        setUploading(false);
      }

      const response = await api.post("/challenges", {
        ...payload,
        evidencePublicId: media?.publicId ?? null,
        evidenceResourceType: media?.resourceType ?? null,
      });

      setCreatedChallenge(response.data.challenge);
      setSubmitted(true);
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
        "Unable to upload evidence or submit the report. Please try again."
      );
    } finally {
      setUploading(false);
      setLoading(false);
    }
  }

  if (submitted) {
    return (
      <CitizenLayout
        title="Challenge submitted"
        subtitle="CITIZEN PORTAL"
      >
        <section className="glass-card mx-auto max-w-2xl rounded-3xl p-8 text-center md:p-12">
          <div className="mx-auto grid size-20 place-items-center rounded-full bg-emerald-100 text-4xl text-emerald-600">
            ✓
          </div>

          <p className="mt-7 text-xs font-bold tracking-[0.2em] text-emerald-600">
            REPORT SUBMITTED
          </p>

          <h2 className="mt-3 text-3xl font-extrabold text-slate-900">
            Your challenge is under review
          </h2>

          <p className="mx-auto mt-4 max-w-lg leading-7 text-slate-500">
            Your report has been saved for administrator review.
            Track its status from My Reports.
          </p>

          <div className="mx-auto mt-6 max-w-md rounded-2xl bg-blue-50 p-5 text-left">
            <p className="text-xs font-bold text-blue-500">
              TRACKING NUMBER
            </p>

            <p className="mt-1 break-all text-xl font-extrabold text-blue-800">
              {createdChallenge?.trackingId}
            </p>

            <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-slate-500">Category</p>
                <p className="font-bold text-slate-900">
                  {createdChallenge?.category}
                </p>
              </div>

              <div>
                <p className="text-slate-500">Initial priority</p>
                <p
                  className={`font-bold ${createdChallenge?.priority === "High"
                    ? "text-red-600"
                    : "text-amber-600"
                    }`}
                >
                  {createdChallenge?.priority}
                </p>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => navigate("/citizen/reports")}
            className="mt-8 rounded-xl bg-blue-600 px-6 py-3 font-bold text-white hover:bg-blue-700"
          >
            View my reports
          </button>
        </section>
      </CitizenLayout>
    );
  }

  return (
    <CitizenLayout
      title="Report a community challenge"
      subtitle="NEW CHALLENGE"
    >
      <button
        type="button"
        onClick={() => navigate("/citizen/dashboard")}
        className="mb-5 flex items-center gap-2 text-sm font-bold text-slate-600 hover:text-blue-600"
      >
        <ArrowLeft size={17} />
        Back to dashboard
      </button>

      <form
        onSubmit={handleSubmit}
        className="glass-card mx-auto max-w-4xl rounded-3xl p-6 md:p-9"
      >
        <p className="text-xs font-bold tracking-widest text-blue-600">
          CHALLENGE DETAILS
        </p>

        <h2 className="mt-2 text-2xl font-extrabold text-slate-900">
          Tell us what is happening
        </h2>

        <p className="mt-2 text-sm leading-6 text-slate-500">
          Provide clear information to help administrators review
          the challenge.
        </p>

        <div className="mt-8 grid gap-6 md:grid-cols-2">
          <div className="md:col-span-2">
            <label
              htmlFor="challenge-title"
              className="text-sm font-bold text-slate-700"
            >
              Challenge title
            </label>

            <input
              id="challenge-title"
              required
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="Example: Contaminated water near Ward 12"
              className={inputStyle}
            />
          </div>

          <div>
            <label
              htmlFor="challenge-category"
              className="text-sm font-bold text-slate-700"
            >
              Category
            </label>

            <select
              id="challenge-category"
              required
              name="category"
              value={formData.category}
              onChange={handleChange}
              className={inputStyle}
            >
              <option value="">Select category</option>
              <option value="Water & Sanitation">
                Water & Sanitation
              </option>
              <option value="Waste Management">
                Waste Management
              </option>
              <option value="Road Safety">Road Safety</option>
              <option value="Public Health">Public Health</option>
              <option value="Infrastructure">Infrastructure</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div>
            <label
              htmlFor="challenge-location"
              className="text-sm font-bold text-slate-700"
            >
              Location
            </label>

            <div className="relative mt-2">
              <MapPin
                size={18}
                className="absolute left-4 top-3.5 text-slate-400"
              />

              <textarea
                id="challenge-location"
                required
                name="location"
                rows={3}
                value={formData.location}
                onChange={handleChange}
                placeholder="Street, locality, city, state and PIN code"
                className="w-full resize-y rounded-xl border border-slate-300 bg-white py-3 pl-11 pr-4 text-sm leading-6 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              />
            </div>

            <button
              type="button"
              onClick={captureCurrentLocation}
              disabled={locating || loading}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-bold text-blue-700 hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <LocateFixed size={18} />
              {locating
                ? "Finding your address..."
                : "Use current location"}
            </button>

            {locationError && (
              <p
                role="alert"
                className="mt-2 text-sm font-semibold text-red-600"
              >
                {locationError}
              </p>
            )}
          </div>

          {hasCoordinates && (
            <div className="md:col-span-2">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-bold text-slate-700">
                    Select the problem location
                  </p>

                  <p className="mt-1 text-xs text-slate-500">
                    {hasCoordinates
                      ? `Coordinates: ${formData.latitude.toFixed(6)}, ${formData.longitude.toFixed(6)}`
                      : "No pin selected. Choose a point or use current location."}
                  </p>
                </div>

                {hasCoordinates && (
                  <button
                    type="button"
                    onClick={removeCoordinates}
                    disabled={loading || locating}
                    className="text-sm font-bold text-red-600 hover:text-red-700 disabled:opacity-50"
                  >
                    Remove map pin
                  </button>
                )}
              </div>

              <LocationPicker
                latitude={formData.latitude}
                longitude={formData.longitude}
                onSelect={handleMapSelect}
                disabled={loading || locating}
              />

              {locating && (
                <p
                  role="status"
                  className="mt-3 text-sm font-semibold text-blue-600"
                >
                  Finding the address… Please wait before moving the marker again.
                </p>
              )}
            </div>
          )}

          <div className="md:col-span-2">
            <label
              htmlFor="challenge-description"
              className="text-sm font-bold text-slate-700"
            >
              Problem description
            </label>

            <textarea
              id="challenge-description"
              required
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={6}
              placeholder="Explain the problem, how long it has existed and who is affected..."
              className={`${inputStyle} resize-y`}
            />
          </div>

          <div className="md:col-span-2">
            <p className="text-sm font-bold text-slate-700">
              Photo or video evidence
            </p>

            <label
              htmlFor="challenge-evidence"
              className={`relative mt-2 flex flex-col items-center justify-center
      rounded-2xl border-2 border-dashed px-5 py-10 text-center
      transition duration-200
      focus-within:border-blue-500 focus-within:ring-4
      focus-within:ring-blue-100
      ${loading
                  ? "cursor-not-allowed border-slate-200 bg-slate-50 opacity-60"
                  : "cursor-pointer border-blue-200 bg-blue-50/50 hover:border-blue-500 hover:bg-blue-50"
                }`}
            >
              <input
                id="challenge-evidence"
                type="file"
                accept="image/png,image/jpeg,video/mp4"
                onChange={handleEvidenceChange}
                disabled={loading}
                aria-label="Upload photo or video evidence"
                className="sr-only"
              />

              <span className="grid size-16 place-items-center rounded-2xl bg-blue-100 text-blue-600">
                <ImagePlus size={32} />
              </span>

              <span className="mt-4 text-base font-bold text-slate-800">
                {evidenceFile ? "Click to change evidence" : "Click to upload evidence"}
              </span>

              {evidenceFile ? (
                <span
                  aria-live="polite"
                  className="mt-3 max-w-full break-all rounded-xl bg-white px-4 py-2 text-sm font-semibold text-blue-700 shadow-sm"
                >
                  {evidenceFile.name}
                  {" · "}
                  {(evidenceFile.size / (1024 * 1024)).toFixed(2)} MB
                </span>
              ) : (
                <span className="mt-2 text-sm text-slate-500">
                  Choose a photo or video from your device
                </span>
              )}

              <span className="mt-4 text-xs leading-5 text-slate-500">
                Optional: one JPG, PNG or MP4, up to 10 MB.
                <br />
                The file uploads when you submit the report.
              </span>
            </label>
          </div>
        </div>

        {error && (
          <div
            role="alert"
            className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700"
          >
            {error}
          </div>
        )}

        <div className="mt-8 flex flex-col-reverse justify-end gap-3 border-t border-slate-200 pt-6 sm:flex-row">
          <button
            type="button"
            disabled={loading}
            onClick={() => navigate("/citizen/dashboard")}
            className="rounded-xl bg-slate-100 px-6 py-3 font-bold text-slate-700 hover:bg-slate-200 disabled:opacity-60"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={loading || locating}
            className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3 font-bold text-white shadow-lg shadow-blue-200 hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? (
              <>
                <span className="size-5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                {uploading ? "Uploading evidence..." : "Submitting report..."}
              </>
            ) : (
              <>
                <Send size={17} />
                Submit challenge
              </>
            )}
          </button>
        </div>
      </form>
    </CitizenLayout>
  );
}

export default ReportChallenge;