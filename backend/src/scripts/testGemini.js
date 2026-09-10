import "dotenv/config";
import { analyzeChallenge } from "../services/aiService.js";

async function testGemini() {
  console.log("Starting Gemini report analysis test...");

  console.log(
    "API key:",
    process.env.GEMINI_API_KEY ? "Found" : "Missing"
  );

  console.log(
    "Model:",
    process.env.GEMINI_MODEL || "Missing"
  );

  if (
    !process.env.GEMINI_API_KEY ||
    !process.env.GEMINI_MODEL
  ) {
    console.error(
      "Add GEMINI_API_KEY and GEMINI_MODEL to backend/.env."
    );
    process.exitCode = 1;
    return;
  }

  try {
    const result = await analyzeChallenge({
      title: "Contaminated drinking water",
      description:
        "Residents report a sewage smell in water from the community handpump.",
      category: "Other",
    });

    console.log("\nAnalysis result:");
    console.log(JSON.stringify(result, null, 2));

    if (result.source === "gemini") {
      console.log("\nSuccess: Gemini generated the analysis.");
    } else {
      console.error(
        "\nFallback used. Check any diagnostic messages above."
      );
      process.exitCode = 1;
    }
  } catch (error) {
    console.error("Test failed:", error.message);
    process.exitCode = 1;
  }
}

testGemini();