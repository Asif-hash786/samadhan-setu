import "dotenv/config";

async function checkConnection() {
  if (!process.env.GEMINI_API_KEY) {
    console.error("GEMINI_API_KEY is missing.");
    process.exitCode = 1;
    return;
  }

  console.log("Checking Gemini API connectivity and model access...");

  try {
    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models",
      {
        headers: {
          "x-goog-api-key": process.env.GEMINI_API_KEY,
        },
        signal: AbortSignal.timeout(15000),
      }
    );

    console.log("HTTP status:", response.status);

    const data = await response.json();

    if (!response.ok) {
      console.error(
        "API error:",
        data.error?.message || "Unknown API error"
      );
      return;
    }

    const models = (data.models || []).filter((model) =>
      model.supportedGenerationMethods?.includes("generateContent")
    );

    console.log("Connection successful. Available generation models:");

    for (const model of models) {
      console.log(model.name);
    }
  } catch (error) {
    console.error("Connection failed:", error.message);
    console.error(
      "Cause:",
      error.cause?.code || error.cause?.message || error.name
    );
  }
}

checkConnection();